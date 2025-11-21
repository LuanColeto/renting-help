const testUrl = 'https://www.imovelweb.com.br/propriedades/studio-mobiliado-com-lareira-sacada-e-vaga-de-garagem-3020940491.html';

fetch('http://localhost:3000/api/scrape-browser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: testUrl }),
})
  .then(res => res.json())
  .then(data => {
    console.log('=== RESULTADO DO SCRAPING IMOVELWEB ===');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Erro:', err);
  });
