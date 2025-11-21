import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedData {
  title: string;
  address: string;
  neighborhood: string;
  rent: number;
  condo: number;
  iptu: number;
  insurance?: number;
  notes?: string;
  images: string[];
  url: string;
}

function extractFromJsonLd(html: string, url: string): ScrapedData | null {
  try {
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < scripts.length; i++) {
      try {
        const jsonData = JSON.parse($(scripts[i]).html() || '{}');

        // Check for various property types
        const validTypes = ['Apartment', 'House', 'SingleFamilyResidence', 'Residence', 'RealEstateListing'];
        const isProperty = validTypes.includes(jsonData['@type']) ||
                          (jsonData['@type'] && Array.isArray(jsonData['@type']) &&
                           jsonData['@type'].some((t: string) => validTypes.includes(t)));

        if (isProperty) {
          const result: ScrapedData = {
            title: jsonData.name || jsonData.headline || '',
            address: '',
            neighborhood: '',
            rent: 0,
            condo: 0,
            iptu: 0,
            images: [],
            url
          };

          // Extract address (can be string or object)
          if (typeof jsonData.address === 'string') {
            result.address = jsonData.address;
            const parts = jsonData.address.split(',').map((p: string) => p.trim());

            // Find the neighborhood - skip city/state and street numbers
            let neighborhoodIndex = -1;

            for (let i = parts.length - 1; i >= 0; i--) {
              const part = parts[i];
              // Skip if it's a city/state (contains /) or just a number or CEP
              if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
                continue;
              }
              // Skip first part (usually the street)
              if (i === 0) {
                continue;
              }
              neighborhoodIndex = i;
              break;
            }

            if (neighborhoodIndex > 0) {
              result.neighborhood = parts[neighborhoodIndex];
            } else if (parts.length === 1) {
              // Try to extract from dash separator
              const dashParts = parts[0].split('-').map((p: string) => p.trim());
              if (dashParts.length >= 2) {
                result.neighborhood = dashParts[dashParts.length - 1];
              }
            }
          } else if (jsonData.address && typeof jsonData.address === 'object') {
            // Schema.org PostalAddress format
            const addr = jsonData.address;
            const addressParts = [];
            if (addr.streetAddress) addressParts.push(addr.streetAddress);
            if (addr.addressLocality) {
              addressParts.push(addr.addressLocality);
              result.neighborhood = addr.addressLocality;
            }
            if (addr.addressRegion) addressParts.push(addr.addressRegion);
            result.address = addressParts.join(', ');
          }

          // Extract rent from various possible fields
          if (jsonData.potentialAction && jsonData.potentialAction.price) {
            result.rent = parseInt(String(jsonData.potentialAction.price).replace(/[^\d]/g, '')) || 0;
          } else if (jsonData.offers && jsonData.offers.price) {
            result.rent = parseInt(String(jsonData.offers.price).replace(/[^\d]/g, '')) || 0;
          } else if (jsonData.price) {
            result.rent = parseInt(String(jsonData.price).replace(/[^\d]/g, '')) || 0;
          }

          // Extract images - handle various formats
          const imageArray: string[] = [];
          if (Array.isArray(jsonData.image)) {
            jsonData.image.forEach((img: any) => {
              if (typeof img === 'string' && img.includes('http')) {
                imageArray.push(img);
              } else if (img && typeof img === 'object' && img.url) {
                imageArray.push(img.url);
              }
            });
          } else if (jsonData.image && typeof jsonData.image === 'string' && jsonData.image.includes('http')) {
            imageArray.push(jsonData.image);
          } else if (jsonData.image && typeof jsonData.image === 'object' && jsonData.image.url) {
            imageArray.push(jsonData.image.url);
          }

          // Also check for photo field
          if (jsonData.photo) {
            if (Array.isArray(jsonData.photo)) {
              jsonData.photo.forEach((img: any) => {
                if (typeof img === 'string' && img.includes('http') && !imageArray.includes(img)) {
                  imageArray.push(img);
                } else if (img && typeof img === 'object' && img.url && !imageArray.includes(img.url)) {
                  imageArray.push(img.url);
                }
              });
            } else if (typeof jsonData.photo === 'string' && jsonData.photo.includes('http')) {
              if (!imageArray.includes(jsonData.photo)) imageArray.push(jsonData.photo);
            }
          }

          result.images = imageArray;

          // Only return if we have at least a title or address
          if (result.title || result.address) {
            return result;
          }
        }
      } catch (e) {
        // Try next script
        continue;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function scrapeImovelWeb(html: string, url: string): Promise<ScrapedData | null> {
  try {
    const $ = cheerio.load(html);

    const title = $('h1.property-title').text().trim() ||
                  $('[data-qa="POSTING_CARD_DESCRIPTION"]').text().trim();

    const address = $('.location-address').text().trim() ||
                    $('[data-qa="POSTING_CARD_LOCATION"]').text().trim();

    // Extract neighborhood - skip city/state and street numbers
    let neighborhood = '';
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      // Find the neighborhood by going backwards, skipping city/state and numbers
      for (let i = parts.length - 1; i >= 1; i--) {
        const part = parts[i];
        // Skip if it's a city/state (contains /) or just a number or CEP
        if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
          continue;
        }
        neighborhood = part;
        break;
      }
      // Fallback to dash separator
      if (!neighborhood && address.includes('-')) {
        neighborhood = address.split('-')[0].trim();
      }
    }

    let rent = 0;
    let condo = 0;
    let iptu = 0;

    $('.price-items .price-item').each((_, el) => {
      const label = $(el).find('.price-item-label').text().toLowerCase();
      const value = $(el).find('.price-item-value').text().replace(/[^\d]/g, '');
      const numValue = parseInt(value) || 0;

      if (label.includes('aluguel')) rent = numValue;
      if (label.includes('condom')) condo = numValue;
      if (label.includes('iptu')) iptu = numValue;
    });

    const images: string[] = [];
    $('img[data-src]').each((_, el) => {
      const src = $(el).attr('data-src');
      if (src && src.includes('http')) {
        images.push(src);
      }
    });

    $('.gallery-image img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('http') && !images.includes(src)) {
        images.push(src);
      }
    });

    return {
      title,
      address,
      neighborhood,
      rent,
      condo,
      iptu,
      images: images.slice(0, 10),
      url,
    };
  } catch (error) {
    console.error('Error scraping ImovelWeb:', error);
    return null;
  }
}

async function scrapeVivaReal(html: string, url: string): Promise<ScrapedData | null> {
  try {
    const $ = cheerio.load(html);

    const title = $('h1.property-card__title').text().trim() ||
                  $('[data-type="title"]').text().trim() ||
                  $('h1').first().text().trim();

    const address = $('.property-card__address').text().trim() ||
                    $('[data-type="address"]').text().trim();

    // Extract neighborhood - skip city/state and street numbers
    let neighborhood = '';
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      // Find the neighborhood by going backwards, skipping city/state and numbers
      for (let i = parts.length - 1; i >= 1; i--) {
        const part = parts[i];
        // Skip if it's a city/state (contains /) or just a number or CEP
        if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
          continue;
        }
        neighborhood = part;
        break;
      }
      // Fallback to dash separator
      if (!neighborhood && address.includes('-')) {
        const dashParts = address.split('-').map(p => p.trim());
        if (dashParts.length >= 2) {
          neighborhood = dashParts[1];
        }
      }
    }

    let rent = 0;
    let condo = 0;
    let iptu = 0;

    $('.price__list-value').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const value = $(el).find('.js-price').text().replace(/[^\d]/g, '');
      const numValue = parseInt(value) || 0;

      if (text.includes('aluguel')) rent = numValue;
      if (text.includes('condom')) condo = numValue;
      if (text.includes('iptu')) iptu = numValue;
    });

    const images: string[] = [];
    $('img[data-src]').each((_, el) => {
      const src = $(el).attr('data-src');
      if (src && src.includes('http')) {
        images.push(src);
      }
    });

    $('picture img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('http') && !images.includes(src)) {
        images.push(src);
      }
    });

    return {
      title,
      address,
      neighborhood,
      rent,
      condo,
      iptu,
      images: images.slice(0, 10),
      url,
    };
  } catch (error) {
    console.error('Error scraping VivaReal:', error);
    return null;
  }
}

async function scrapeQuintoAndar(html: string, url: string): Promise<ScrapedData | null> {
  try {
    const $ = cheerio.load(html);

    const title = $('h1[data-testid="listing-title"]').text().trim() ||
                  $('h1.title').text().trim() ||
                  $('h1').first().text().trim();

    const address = $('[data-testid="listing-address"]').text().trim() ||
                    $('.address').text().trim() ||
                    $('[class*="address"]').first().text().trim();

    // Extract neighborhood - skip city/state and street numbers
    let neighborhood = '';
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      // Find the neighborhood by going backwards, skipping city/state and numbers
      for (let i = parts.length - 1; i >= 1; i--) {
        const part = parts[i];
        // Skip if it's a city/state (contains /) or just a number or CEP
        if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
          continue;
        }
        neighborhood = part;
        break;
      }
      // Fallback to dash separator
      if (!neighborhood && address.includes('-')) {
        const dashParts = address.split('-').map(p => p.trim());
        neighborhood = dashParts[0];
      }
    }

    let rent = 0;
    let condo = 0;
    let iptu = 0;

    // Try multiple selectors for price information
    $('[data-testid="price-info"], [class*="price"], .price-details, [class*="cost"]').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const value = text.replace(/[^\d]/g, '');
      const numValue = parseInt(value) || 0;

      if (numValue > 0) {
        if (text.includes('aluguel') && rent === 0) {
          rent = numValue;
        } else if (text.includes('condom') && condo === 0) {
          condo = numValue;
        } else if (text.includes('iptu') && iptu === 0) {
          iptu = numValue;
        }
      }
    });

    // If we didn't find rent yet, try to extract from common patterns
    if (rent === 0) {
      const priceText = $('body').text();
      const rentMatch = priceText.match(/aluguel[:\s]+r?\$?\s*([\d.,]+)/i);
      if (rentMatch) {
        rent = parseInt(rentMatch[1].replace(/[^\d]/g, '')) || 0;
      }
    }

    const images: string[] = [];
    // Look for actual property images, avoid logos and icons
    $('img[src], img[data-src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && src.includes('http') && (src.includes('quintoandar') || src.includes('cloudfront'))) {
        // Filter out small images (likely icons/logos)
        const width = $(el).attr('width');
        const height = $(el).attr('height');
        const isSmall = (width && parseInt(width) < 100) || (height && parseInt(height) < 100);

        // Also check if it's in a gallery or carousel
        const isInGallery = $(el).closest('[class*="gallery"], [class*="carousel"], [class*="slider"]').length > 0;

        if (!isSmall || isInGallery) {
          if (!images.includes(src)) {
            images.push(src);
          }
        }
      }
    });

    return {
      title,
      address,
      neighborhood,
      rent,
      condo,
      iptu,
      images: images.slice(0, 10),
      url,
    };
  } catch (error) {
    console.error('Error scraping QuintoAndar:', error);
    return null;
  }
}

async function scrapeChavesNaMao(html: string, url: string): Promise<ScrapedData | null> {
  try {
    const $ = cheerio.load(html);

    const title = $('h1.property-title').text().trim() ||
                  $('.title-section h1').text().trim() ||
                  $('h1[class*="title"]').text().trim() ||
                  $('h1').first().text().trim();

    const address = $('.property-address').text().trim() ||
                    $('.address-text').text().trim() ||
                    $('[class*="address"]').first().text().trim();

    // Extract neighborhood - skip city/state and street numbers
    let neighborhood = '';
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      // Find the neighborhood by going backwards, skipping city/state and numbers
      for (let i = parts.length - 1; i >= 1; i--) {
        const part = parts[i];
        // Skip if it's a city/state (contains /) or just a number or CEP
        if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
          continue;
        }
        neighborhood = part;
        break;
      }
      // Fallback to dash separator
      if (!neighborhood && address.includes('-')) {
        const dashParts = address.split('-').map(p => p.trim());
        if (dashParts.length >= 2) {
          neighborhood = dashParts[1];
        }
      }
    }

    let rent = 0;
    let condo = 0;
    let iptu = 0;

    // Extract from body text using the exact pattern from Chaves na Mão
    const bodyText = $('body').text();

    // Pattern: "Aluguel R$ 2.200/mês" or "Aluguel\nR$ 2.200/mês"
    const rentMatch = bodyText.match(/Aluguel\s*R?\$?\s*([\d.,]+)/i);
    if (rentMatch) {
      rent = parseInt(rentMatch[1].replace(/[^\d]/g, '')) || 0;
    }

    // Pattern: "Condomínio R$ 288/mês" or "Condominio R$ 288/mês"
    const condoMatch = bodyText.match(/Condom[ií]nio\s*R?\$?\s*([\d.,]+)/i);
    if (condoMatch) {
      condo = parseInt(condoMatch[1].replace(/[^\d]/g, '')) || 0;
    }

    // Pattern: "IPTU R$ 98"
    const iptuMatch = bodyText.match(/IPTU\s*R?\$?\s*([\d.,]+)/i);
    if (iptuMatch) {
      iptu = parseInt(iptuMatch[1].replace(/[^\d]/g, '')) || 0;
    }

    const images: string[] = [];
    $('img[src], img[data-src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && src.includes('http') && src.includes('chavesnamao')) {
        // Filter out small images (icons/logos)
        const isInGallery = $(el).closest('[class*="gallery"], [class*="carousel"], [class*="slider"], [class*="photo"]').length > 0;
        const width = $(el).attr('width');
        const isSmall = width && parseInt(width) < 100;

        if (isInGallery || !isSmall) {
          if (!images.includes(src)) {
            images.push(src);
          }
        }
      }
    });

    return {
      title,
      address,
      neighborhood,
      rent,
      condo,
      iptu,
      images: images.slice(0, 10),
      url,
    };
  } catch (error) {
    console.error('Error scraping ChavesNaMao:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, html } = await request.json();

    if (!url && !html) {
      return NextResponse.json({ error: 'URL ou HTML é obrigatório' }, { status: 400 });
    }

    let pageHtml = html;

    // If HTML is not provided, try to fetch it
    if (!pageHtml && url) {
      // Fetch the HTML with enhanced headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'Referer': 'https://www.google.com/',
        },
      });

      if (!response.ok) {
        console.error('Fetch error:', response.status, response.statusText);
        return NextResponse.json({
          error: `Erro ao buscar URL: ${response.status} ${response.statusText}. O site pode estar bloqueando requisições automáticas. Tente preencher manualmente.`,
          blocked: true
        }, { status: 400 });
      }

      pageHtml = await response.text();
    }

    let data: ScrapedData | null = null;
    const finalUrl = url || 'unknown';

    // Try JSON-LD first (QuintoAndar uses this)
    data = extractFromJsonLd(pageHtml, finalUrl);

    if (!data || !data.title) {
      // Fall back to site-specific scrapers
      if (finalUrl.includes('imovelweb.com.br')) {
        data = await scrapeImovelWeb(pageHtml, finalUrl);
      } else if (finalUrl.includes('vivareal.com.br')) {
        data = await scrapeVivaReal(pageHtml, finalUrl);
      } else if (finalUrl.includes('quintoandar.com.br')) {
        data = await scrapeQuintoAndar(pageHtml, finalUrl);
      } else if (finalUrl.includes('chavesnamao.com.br')) {
        data = await scrapeChavesNaMao(pageHtml, finalUrl);
      } else if (!html) {
        // Only show this error if HTML wasn't manually provided
        return NextResponse.json({
          error: 'Site não suportado. Sites suportados: QuintoAndar, Chaves na Mão, VivaReal (com HTML), ImovelWeb (com HTML)'
        }, { status: 400 });
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Erro ao extrair dados do anúncio' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Erro ao processar anúncio' }, { status: 500 });
  }
}
