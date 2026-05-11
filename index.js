const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel. Seu nome é Cardim. Atenda com cordialidade e profissionalismo usando emojis com moderação.

INFORMAÇÕES DO HOTEL:
- Check-in: a partir das 14h00
- Check-out: até as 12h00
- Café da manhã: incluso na diária, servido das 06h30 às 10h00
- Estacionamento: R$35,00 por diária
- Wi-Fi: gratuito para todos os hóspedes
- Pets: não são aceitos
- Formas de pagamento: PIX e cartão de crédito/débito

REGRAS PARA RESERVAS:
Quando o hóspede informar as datas, gere o link substituindo as datas no formato DD-MM-YYYY.
Exemplo: check-in 16/05 e check-out 18/05 vira:
https://book.omnibees.com/hotel/18555?checkIn=16-05-2026&checkOut=18-05-2026&currencyId=16&lang=pt-BR

Responda APENAS assim quando tiver as datas, sem texto adicional:
"Acesse o link para ver disponibilidade e reservar: https://book.omnibees.com/hotel/18555?checkIn=DD-MM-YYYY&checkOut=DD-MM-YYYY&currencyId=16&lang=pt-BR"

OUTRAS REGRAS:
- Seja educado, formal e simpático
- Use no máximo 1 emoji por mensagem
- Nunca invente informações
- Se não souber responder diga: "Aguarde um momento, um atendente irá lhe responder em breve."
- Não responda sobre assuntos não relacionados ao hotel
- Mantenha respostas CURTAS e DIRETAS`;

async function perguntarIA(numero, mensagem) {
  if (!conversas[numero]) conversas[numero] = [];
  conversas[numero].push({ role: 'user', content: mensagem });
  if (conversas[numero].length > 20) conversas[numero] = conversas[numero].slice(-20);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: conversas[numero]
    })
  });

  const data = await response.json();
  console.log('Status:', response.status, JSON.stringify(data).substring(0, 200));
  if (data.error) throw new Error(data.error.message);
  const resposta = data.content[0].text;
  conversas[numero].push({ role: 'assistant', content: resposta });
  return resposta;
}

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body || '';
  const numero = req.body.From || '';
  console.log('Mensagem de ' + numero + ': ' + mensagem);
  try {
    const resposta = await perguntarIA(numero, mensagem);
    console.log('Resposta: ' + resposta);
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + resposta + '</M
