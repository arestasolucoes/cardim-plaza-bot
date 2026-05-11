const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};
const ultimaMensagem = {};

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel. Seu nome é Cardim. Atenda com cordialidade e profissionalismo.

INFORMAÇÕES DO HOTEL:
- Endereço: Rua Maestro Cardim, 508 - Bela Vista, São Paulo/SP
- Check-in: a partir das 14h00
- Check-out: até as 12h00
- Café da manhã: incluso na diária, servido das 06h30 às 10h00
- Estacionamento: R$35,00 por diária
- Wi-Fi: gratuito para todos os hóspedes
- Pets: não são aceitos
- Formas de pagamento: PIX e cartão de crédito/débito

HOSPITAIS PRÓXIMOS:
- Hospital Paulistano: 50 metros
- Hospital Beneficência Portuguesa: 100 metros
- Hospital AC Camargo Cancer Center: 500 metros (6 minutos a pé)
- Hospital Alemão Oswaldo Cruz: 500 metros (6 minutos a pé)

METRÔ PRÓXIMO:
- Estação Vergueiro (Linha 1 - Azul): 5 minutos a pé
- Estação São Joaquim (Linha 1 - Azul): 7 minutos a pé

AEROPORTOS:
- Aeroporto de Congonhas: 8 km, 15 minutos de carro
- Aeroporto de Guarulhos: 40 km, 40 a 60 minutos de carro

RODOVIÁRIAS:
- Terminal Tietê: 8 km, 20 minutos de carro
- Terminal Barra Funda: 10 km, 20 minutos de carro
- Terminal Jabaquara: 12 km, 25 minutos de carro

PONTOS TURÍSTICOS:
- Avenida Paulista: 1,5 km (15 minutos a pé)
- Bairro da Liberdade: 800 metros (10 minutos a pé)
- Parque Ibirapuera: 2,8 km (10 minutos de carro)
- MASP: 2,6 km (10 minutos de carro)
- Bixiga: 300 metros (5 minutos a pé)

RESTAURANTES PRÓXIMOS:
- Japa's: Rua Maestro Cardim, 332 (100m)
- Bonjardim: Rua Maestro Cardim, 407 (100m)
- Famiglia Mancini: Rua Avanhandava, 81 (italiano premiado)
- Pizzaria Speranza: Rua Treze de Maio, 1004 (desde 1958)
- Cantina Lazzarella: Rua Treze de Maio, 589 (música ao vivo aos sábados)
- Templo da Carne Marcos Bassi: Rua Treze de Maio, 668
- Osteria Generale: Rua Dr. Fausto Ferraz, 163

REGRAS PARA RESERVAS:
Quando o hóspede informar datas de check-in e check-out, responda EXATAMENTE assim, substituindo as datas que ele informou:

"Perfeito! Acesse o link abaixo e selecione as datas de DATA_ENTRADA a DATA_SAIDA para ver disponibilidade e reservar:
https://book.omnibees.com/hotel/18555?currencyId=16&lang=pt-BR

Qualquer dúvida estamos à disposição!"

REGRAS GERAIS:
- Seja educado e simpático
- Respostas curtas e diretas
- Nunca invente informações
- Se não souber, diga: Aguarde, um atendente responderá em breve.
- Não responda sobre assuntos não relacionados ao hotel`;

async function enviarMensagem(para, texto) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const de = process.env.TWILIO_WHATSAPP_NUMBER;

  const credentials = Buffer.from(accountSid + ':' + authToken).toString('base64');

  const body = new URLSearchParams();
  body.append('From', 'whatsapp:' + de);
  body.append('To', para);
  body.append('Body', texto);

  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const data = await response.json();
  console.log('Twilio envio:', response.status, JSON.stringify(data).substring(0, 200));
  return data;
}

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
  console.log('Status API:', response.status, JSON.stringify(data).substring(0, 200));
  if (data.error) throw new Error(data.error.message);
  const resposta = data.content[0].text;
  conversas[numero].push({ role: 'assistant', content: resposta });
  return resposta;
}

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body || '';
  const numero = req.body.From || '';
  console.log('Mensagem de ' + numero + ': ' + mensagem);

  res.status(200).send('OK');

  if (ultimaMensagem[numero]) clearTimeout(ultimaMensagem[numero]);

  ultimaMensagem[numero] = setTimeout(async () => {
    try {
      await enviarMensagem(numero, 'Esperamos ter ajudado! Sua duvida foi resolvida? Estamos a disposicao para o que precisar. Sera um prazer recebe-lo no Cardim Plaza Hotel!');
    } catch(e) {
      console.error('Erro proativa:', e.message);
    }
    delete ultimaMensagem[numero];
  }, 5 * 60 * 1000);

  try {
    const resposta = await perguntarIA(numero, mensagem);
    console.log('Resposta: ' + resposta);
    await enviarMensagem(numero, resposta);
  } catch(e) {
    console.error('Erro:', e.message);
    await enviarMensagem(numero, 'Instabilidade momentanea. Tente novamente.');
  }
});

app.get('/', (req, res) => res.send('Robo Cardim Plaza online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
