import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
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

function extractNeighborhood(address: string): string {
  if (!address) return '';

  const parts = address.split(',').map(p => p.trim());
  // Find the neighborhood by going backwards, skipping city/state and numbers
  for (let i = parts.length - 1; i >= 1; i--) {
    const part = parts[i];
    // Skip if it's a city/state (contains /) or just a number or CEP
    if (part.includes('/') || /^\d+$/.test(part) || /^\d{5}-?\d{3}$/.test(part)) {
      continue;
    }
    return part;
  }
  return '';
}

function scrapeVivaReal(html: string, url: string): ScrapedData {
  const $ = cheerio.load(html);

  const title = $('h1.property-card__title').text().trim() ||
                $('[data-type="title"]').text().trim() ||
                $('h1').first().text().trim();

  // Try multiple selectors for address
  const address = $('.property-card__address').text().trim() ||
                  $('[data-type="address"]').text().trim() ||
                  $('.property-location__address').text().trim() ||
                  $('[class*="address"] [class*="text"]').first().text().trim();

  const neighborhood = extractNeighborhood(address);

  let rent = 0;
  let condo = 0;
  let iptu = 0;

  // Find price sections with better parsing
  $('[class*="price"]').each((_, el) => {
    const fullText = $(el).text();
    const label = fullText.toLowerCase();

    // Match patterns like "R$ 2.000" or "R$ 2000"
    const matches = fullText.match(/R\$\s*([\d.,]+)/g);

    if (matches && matches.length > 0) {
      matches.forEach(match => {
        const cleanValue = match.replace(/[^\d]/g, '');
        const numValue = parseInt(cleanValue) || 0;

        // Only consider reasonable values (between 100 and 100000)
        if (numValue >= 100 && numValue <= 100000) {
          if (label.includes('aluguel') && rent === 0) {
            rent = numValue;
          } else if (label.includes('condom') && condo === 0) {
            condo = numValue;
          } else if (label.includes('iptu') && iptu === 0) {
            iptu = numValue;
          }
        }
      });
    }
  });

  // Fallback: try to extract from body text with stricter patterns
  if (rent === 0) {
    const bodyText = $('body').text();
    const rentMatch = bodyText.match(/aluguel[\s\n]+R\$\s*([\d.,]+)/i);
    if (rentMatch) {
      const value = parseInt(rentMatch[1].replace(/[^\d]/g, '')) || 0;
      if (value >= 100 && value <= 100000) {
        rent = value;
      }
    }
  }

  const images: string[] = [];
  $('img[src], img[data-src]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon') && !src.endsWith('.svg')) {
      const isInGallery = $(el).closest('[class*="gallery"], [class*="carousel"], [class*="slider"], picture').length > 0;
      // Also check if it's a large image
      const width = $(el).attr('width');
      const isLarge = !width || parseInt(width) > 200;

      if ((isInGallery || isLarge) && !images.includes(src)) {
        images.push(src);
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
}

function scrapeImovelWeb(html: string, url: string): ScrapedData {
  const $ = cheerio.load(html);

  let title = '';
  let address = '';
  let neighborhood = '';
  let rent = 0;
  let condo = 0;
  let iptu = 0;

  // Try to extract from JSON-LD first
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const jsonData = JSON.parse($(scripts[i]).html() || '{}');

      if (jsonData['@type'] === 'Apartment' && jsonData.address) {
        title = jsonData.name || '';
        address = jsonData.address.streetAddress || '';
        neighborhood = jsonData.address.addressRegion || '';
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback to HTML parsing if JSON-LD didn't work
  if (!title) {
    title = $('h1.property-title').text().trim() ||
            $('[data-qa="POSTING_CARD_DESCRIPTION"]').text().trim() ||
            $('h1').first().text().trim();
  }

  if (!address) {
    address = $('.location-address').text().trim() ||
              $('[data-qa="POSTING_CARD_LOCATION"]').text().trim();
  }

  if (!neighborhood && address) {
    neighborhood = extractNeighborhood(address);
  }

  // Extract prices from body text with specific patterns
  const bodyText = $('body').text();

  // Pattern: "aluguel ... R$ 2.000"
  const rentMatch = bodyText.match(/aluguel[^R]*R\$\s*([\d.,]+)/i);
  if (rentMatch) {
    const value = parseInt(rentMatch[1].replace(/[^\d]/g, '')) || 0;
    if (value >= 100 && value <= 100000) {
      rent = value;
    }
  }

  // Pattern: "Condomínio R$ 500"
  const condoMatch = bodyText.match(/Condom[íi]nio\s*R\$\s*([\d.,]+)/i);
  if (condoMatch) {
    const value = parseInt(condoMatch[1].replace(/[^\d]/g, '')) || 0;
    if (value >= 10 && value <= 100000) {
      condo = value;
    }
  }

  // Pattern: "IPTU R$ 90"
  const iptuMatch = bodyText.match(/IPTU\s*R\$\s*([\d.,]+)/i);
  if (iptuMatch) {
    const value = parseInt(iptuMatch[1].replace(/[^\d]/g, '')) || 0;
    if (value >= 10 && value <= 100000) {
      iptu = value;
    }
  }

  const images: string[] = [];
  $('img[data-src], img[src]').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src') || '';
    if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon') && !src.endsWith('.svg')) {
      const isInGallery = $(el).closest('[class*="gallery"], [class*="carousel"]').length > 0;
      // Also check if it's a large image
      const width = $(el).attr('width');
      const isLarge = !width || parseInt(width) > 200;

      if ((isInGallery || isLarge) && !images.includes(src)) {
        images.push(src);
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
}

export async function POST(request: NextRequest) {
  let browser;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    console.log('Launching browser for:', url);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the page with more flexible wait strategy
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } catch (e) {
      // If navigation times out, continue anyway - the page might have loaded
      console.log('Navigation timeout, continuing with available content');
    }

    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get the HTML content
    const html = await page.content();

    await browser.close();
    browser = null;

    console.log('Page loaded successfully');

    // Debug ImovelWeb
    if (url.includes('imovelweb') && process.env.NODE_ENV === 'development') {
      const fs = require('fs');
      fs.writeFileSync('/tmp/imovelweb-page.html', html);
      console.log('ImovelWeb HTML saved to /tmp/imovelweb-page.html');
    }

    // Determine which scraper to use
    let data: ScrapedData | null = null;

    // First try JSON-LD for structured data (works great for VivaReal)
    const $ = require('cheerio').load(html);
    const scripts = $('script[type="application/ld+json"]');
    const finalUrl = url;

    for (let i = 0; i < scripts.length; i++) {
      try {
        const jsonData = JSON.parse($(scripts[i]).html() || '{}');

        // Check if it's a Product schema (VivaReal uses this)
        if (jsonData['@type'] === 'Product' && jsonData.offers) {
          // Extract from meta tags for address
          const metaDescription = $('meta[name="description"]').attr('content') || '';
          // Pattern: "...na Rua Samuel Cézar, 1197 - Água Verde - Curitiba - PR"
          const addressMatch = metaDescription.match(/na (.+?) - (.+?) - (.+?) - (.+?)\./);

          if (addressMatch) {
            const [, street, neighborhood, city, state] = addressMatch;

            data = {
              title: jsonData.name || '',
              address: street || '',
              neighborhood: neighborhood || '',
              rent: parseInt(String(jsonData.offers.price)) || 0,
              condo: 0,
              iptu: 0,
              images: Array.isArray(jsonData.image) ? jsonData.image.slice(0, 10) : [],
              url: finalUrl,
            };

            // Now try to extract condo and IPTU from HTML
            const bodyText = html;
            // Extract condo and IPTU using data-testid for reliability
            const condoText = $('[data-testid="condoFee"]').text();
            if (condoText) {
              const condoMatch = condoText.match(/R?\$?\s*([\d.,]+)/);
              if (condoMatch) {
                const value = parseInt(condoMatch[1].replace(/[^\d]/g, '')) || 0;
                if (value >= 10 && value <= 100000) {
                  data.condo = value;
                }
              }
            }

            const iptuText = $('[data-testid="iptu"]').text();
            if (iptuText) {
              const iptuMatch = iptuText.match(/R?\$?\s*([\d.,]+)/);
              if (iptuMatch) {
                const value = parseInt(iptuMatch[1].replace(/[^\d]/g, '')) || 0;
                if (value >= 10 && value <= 100000) {
                  data.iptu = value;
                }
              }
            }
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback to site-specific scrapers if JSON-LD didn't work
    if (!data && finalUrl.includes('vivareal.com.br')) {
      data = scrapeVivaReal(html, finalUrl);
    } else if (!data && finalUrl.includes('imovelweb.com.br')) {
      data = scrapeImovelWeb(html, finalUrl);
    } else if (!data) {
      return NextResponse.json({
        error: 'Site não suportado com browser scraping. Use a rota normal para QuintoAndar e Chaves na Mão'
      }, { status: 400 });
    }

    if (!data || !data.title) {
      return NextResponse.json({
        error: 'Não foi possível extrair os dados do anúncio. Tente preencher manualmente.'
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Browser scraping error:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json({
      error: 'Erro ao processar anúncio com navegador. Tente novamente ou preencha manualmente.'
    }, { status: 500 });
  }
}
