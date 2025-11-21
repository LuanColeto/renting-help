const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('/tmp/imovelweb-page.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== JSON-LD SCHEMAS ===');
const scripts = $('script[type="application/ld+json"]');
for (let i = 0; i < scripts.length; i++) {
  try {
    const jsonData = JSON.parse($(scripts[i]).html() || '{}');
    if (jsonData.address || jsonData['@type']) {
      console.log(JSON.stringify(jsonData, null, 2));
      console.log('\n---\n');
    }
  } catch(e) {
    console.error('Error parsing JSON-LD:', e.message);
  }
}

console.log('\n=== PRICES ===');
console.log('IPTU:', $('body').text().match(/IPTU R?\$?\s*([\d.,]+)/i));
console.log('Expensas:', $('body').text().match(/Expensas R?\$?\s*([\d.,]+)/i));
