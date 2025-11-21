const testUrl = 'https://www.vivareal.com.br/imovel/apartamento-1-quartos-agua-verde-bairros-curitiba-com-garagem-31m2-aluguel-RS2000-id-2846159313/';

fetch('http://localhost:3000/api/scrape-browser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: testUrl }),
})
  .then(res => res.json())
  .then(data => {
    console.log('=== RESULTADO DO SCRAPING ===');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Erro:', err);
  });
