const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};

function responderSemIA(mensagem) {
  const msg = mensagem.toLowerCase();
  
  if (msg.includes('check-in') || msg.includes('checkin') || msg.includes('entrada')) {
    return 'Olá! 😊 O check-in no Cardim Plaza é a partir das 14h00. Posso ajudar com mais alguma informação?';
  }
  if (msg.includes('check-out') || msg.includes('checkout') || msg.includes('saída') || msg.includes('saida')) {
    return 'O check-out deve ser realizado até as 12h00. Posso ajudar com mais alguma informação? 😊';
  }
  if (msg.includes('café') || msg.includes('cafe') || msg.includes('café da manhã') || msg.includes('breakfast')) {
    return 'O café da manhã está incluso na diária e é servido das 06h30 às 10h00. 😊';
  }
  if (msg.includes('estacionamento') || msg.includes('carro') || msg.includes('vaga')) {
    return 'Temos estacionamento disponível por R$35,00 por diária. 🚗';
  }
  if (msg.includes('wifi') || msg.includes('wi-fi') || msg.includes('internet')) {
    return 'O Wi-Fi é gratuito para todos os hóspedes! 😊';
  }
  if (msg.includes('pet') || msg.includes('cachorro') || msg.includes('gato') || msg.includes('animal')) {
    return 'Infelizmente não aceitamos pets em nossa hospedagem.';
  }
  if (msg.includes('pagamento') || msg.includes('pagar') || msg.includes('pix') || msg.includes('cartão') || msg.includes('cartao')) {
    return 'Aceitamos PIX e cartão de crédito/débito. 😊';
  }
  if (msg.includes('reserva') || msg.includes('disponib') || msg.includes('quarto') || msg.includes('hospedagem')) {
    return 'Para verificar disponibilidade e fazer sua reserva, clique no link: 🔗 https://book.omnibees.com/hotel/18555?currencyId=16&lang=pt-BR\n\nSe preferir, me informe a data de entrada e saída que envio o link direto!';
  }
  if (msg.match(/\d{1,2}[\/\-]\d{1,2}/) || msg.includes('janeiro') || msg.includes('fevereiro') || msg.includes('março') || msg.includes('abril') || msg.includes('maio') || msg.includes('junho') || msg.includes('julho') || msg.includes('agosto') || msg.includes('setembro') || msg.includes('outubro') || msg.includes('novembro') || msg.includes('dezembro')) {
    return 'Para verificar disponibilidade nessas datas, acesse: 🔗 https://book.omnibees.com/hotel/18555?currencyId=16&lang=pt-BR\n\nClique no link e insira as datas para ver os quartos disponíveis!';
  }
  if (msg.includes('oi') || msg.includes('olá') || msg.includes('ola') || msg.includes('bom dia') || msg.includes('boa tarde') || msg.includes('boa noite') || msg.includes('hello')) {
    return 'Olá! Seja bem-vindo ao Cardim Plaza Hotel! 😊\n\nPosso ajudar com:\n• Informações sobre check-in e check-out\n• Café da manhã\n• Estacionamento\n• Wi-Fi\n• Reservas\n\nComo posso ajudar?';
  }
  
  return 'Obrigado pelo contato! Para mais informações ou reservas, acesse: 🔗 https://book.omnibees.com/hotel/18555?currencyId=16&lang=pt-BR\n\nOu aguarde que um de nossos atendentes irá lhe responder em breve. 😊';
}

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body || '';
  const numero = req.body.From;
  console.log(`Mensagem de ${numero}: ${mensagem}`);
  
  const resposta = responderSemIA(mensagem);
  console.log(`Resposta: ${resposta}`);
  
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${resposta}</Message></Response>`);
});

app.get('/', (req, res) => res.send('Robo Cardim Plaza online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
