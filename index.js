const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel, um hotel localizado em São Paulo.
Seu nome é "Cardim", e você atende com cordialidade, profissionalismo e simpatia, usando emojis com moderação.

INFORMAÇÕES DO HOTEL:
- Check-in: a partir das 14h00
- Check-out: até as 12h00
- Café da manhã: incluso na diária, servido das 06h30 às 10h00
- Estacionamento: disponível por R$35,00 por diária
- Wi-Fi: gratuito para todos os hóspedes
- Pets: não são aceitos no hotel
- Formas de pagamento: PIX e cartão de crédito/débito

QUANDO O HÓSPEDE PERGUNTAR SOBRE DISPONIBILIDADE OU RESERVAS:
Pergunte a data de check-in e check-out. Após receber as datas, formate-as no padrão DD-MM-YYYY e responda com:
"Clique no link abaixo para verificar disponibilidade e realizar sua reserva diretamente: 🔗 https://book.omnibees.com/hotel/18555?checkIn=DATA_ENTRADA&checkOut=DATA_SAIDA&currencyId=16&lang=pt-BR"
Substitua DATA_ENTRADA e DATA_SAIDA pelas datas no formato DD-MM-YYYY informadas pelo hóspede.

REGRAS IMPORTANTES:
- Seja sempre educado e formal, mas simpático
- Use emojis com moderação (no máximo 1-2 por mensagem)
- Nunca invente informações que não foram fornecidas
- Se não souber responder, diga: "Vou verificar essa informação com nossa equipe. Por favor, aguarde um momento que um de nossos atendentes irá lhe responder em breve. 😊"
- Mantenha respostas objetivas e claras
- Não responda sobre assuntos que não sejam relacionados ao hotel`;

async function perguntarIA(numero, mensagemUsuario) {
  if (!conversas[numero]) {
    conversas[numero] = [];
  }

  conversas[numero].push({ role: 'user', content: mensagemUsuario });

  if (conversas[numero].length > 20) {
    conversas[numero] = conversas[numero].slice(-20);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
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

  console.log('Status API:', response.status);
  console.log('Resposta API:', JSON.stringify(data).substring(0, 300));

  if (data.error) {
    throw new Error('Erro da API: ' + data.error.message);
  }

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Resposta inesperada: ' + JSON.stringify(data));
  }

  const respostaIA = data.content[0].text;
  conversas[numero].push({ role: 'assistant', content: respostaIA });

  return respostaIA;
}

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body;
  const numero = req.body.From;

  console.log(`Mensagem de ${numero}: ${mensagem}`);

  try {
    const resposta = await perguntarIA(numero, mensagem);
    console.log(`Resposta: ${resposta}`);

    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${resposta}</Message></Response>`);

  } catch (error) {
    console.error('Erro:', error.message);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Olá! Estamos com uma instabilidade momentânea. Por favor, tente novamente em instantes. 😊</Message></Response>`);
  }
});

app.get('/', (req, res) => {
  res.send('Robô Cardim Plaza online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
