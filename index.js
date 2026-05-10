const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};
const CHAVE = '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';

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel. Seu nome é Cardim. Atenda com cordialidade e profissionalismo.

INFORMAÇÕES:
- Check-in: a partir das 14h00
- Check-out: até as 12h00
- Café da manhã: incluso, servido das 06h30 às 10h00
- Estacionamento: R$35,00 por diária
- Wi-Fi: gratuito
- Pets: não aceitos
- Pagamento: PIX e cartão

RESERVAS: Quando perguntarem sobre disponibilidade, peça check-in e check-out e responda com o link:
https://book.omnibees.com/hotel/18555?checkIn=DATA_ENTRADA&checkOut=DATA_SAIDA&currencyId=16&lang=pt-BR

Se não souber responder diga: Vou verificar com nossa equipe, um atendente responderá em breve.`;

async function perguntarIA(numero, mensagem) {
  if (!conversas[numero]) conversas[numero] = [];
  conversas[numero].push({ role: 'user', content: mensagem });
  if (conversas[numero].length > 20) conversas[numero] = conversas[numero].slice(-20);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CHAVE,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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
  const mensagem = req.body.Body;
  const numero = req.body.From;
  console.log(`Mensagem de ${numero}: ${mensagem}`);
  try {
    const resposta = await perguntarIA(numero, mensagem);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${resposta}</Message></Response>`);
  } catch (error) {
    console.error('Erro:', error.message);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Instabilidade momentânea. Tente novamente.</Message></Response>`);
  }
});

app.get('/', (req, res) => res.send('Robo Cardim Plaza online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
