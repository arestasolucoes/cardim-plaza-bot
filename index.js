const express = require('express');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};
const ultimaMensagem = {};
const historicoParaPainel = {};
const modosHumanos = {};
const primeirasMensagens = {};

const MENSAGEM_BOAS_VINDAS = `Olá! Seja muito bem-vindo ao *Cardim Plaza Hotel*! 🏨

Sou o *Cardim*, assistente virtual do hotel. Estou aqui para tornar sua experiência ainda mais especial!

Como posso te ajudar hoje?

1️⃣ *Atendimento pelo assistente virtual* — Tire dúvidas sobre reservas, check-in, localização, restaurantes e muito mais na hora!

2️⃣ *Falar com nossa equipe* — Prefere o atendimento humano? Um de nossos atendentes estará com você em instantes.

Escolha a opção que preferir ou simplesmente me conte o que precisa! 😊`;

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel. Seu nome é Cardim. Atenda com cordialidade e profissionalismo.

IMPORTANTE — PRIMEIRA INTERAÇÃO:
Quando o hóspede responder "2" ou pedir atendimento humano ou falar com atendente, responda EXATAMENTE:
"Claro! Estou avisando nossa equipe. Um atendente entrará em contato com você em instantes. Obrigado pela preferência pelo Cardim Plaza Hotel! 😊"
E então encerre sua participação nessa conversa.

Se o hóspede responder "1" ou qualquer outra coisa, atenda normalmente com as informações abaixo.

INFORMAÇÕES DO HOTEL:
- Endereço: Rua Maestro Cardim, 508 - Bela Vista, São Paulo/SP
- Check-in: a partir das 14h00
- Check-out: até as 12h00
- Café da manhã: incluso na diária, servido das 06h30 às 10h00
- Estacionamento: R$35,00 por diária
- Wi-Fi: gratuito para todos os hóspedes
- Pets: não são aceitos
- Formas de pagamento: PIX e cartão de crédito/débito
- Recepção 24 horas

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
- Cantina Lazzarella: Rua Treze de Maio, 589 (musica ao vivo aos sabados)
- Templo da Carne Marcos Bassi: Rua Treze de Maio, 668
- Osteria Generale: Rua Dr. Fausto Ferraz, 163

REGRAS PARA RESERVAS:
Quando o hospede informar datas de check-in e check-out, responda EXATAMENTE assim:
Perfeito! Acesse o link abaixo e selecione as datas de DATA_ENTRADA a DATA_SAIDA para ver disponibilidade e reservar:
https://book.omnibees.com/hotel/18555?currencyId=16&lang=pt-BR
Qualquer duvida estamos a disposicao!

REGRAS GERAIS:
- Seja educado e simpatico
- Respostas curtas e diretas
- Nunca invente informacoes
- Se nao souber, diga: Aguarde, um atendente respondera em breve.
- Nao responda sobre assuntos nao relacionados ao hotel`;

function getHora() {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
}

function salvarNoPainel(numero, role, content) {
  if (!historicoParaPainel[numero]) historicoParaPainel[numero] = [];
  historicoParaPainel[numero].push({ role, content, hora: getHora() });
}

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
    headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
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
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, system: SYSTEM_PROMPT, messages: conversas[numero] })
  });
  const data = await response.json();
  console.log('Status API:', response.status, JSON.stringify(data).substring(0, 200));
  if (data.error) throw new Error(data.error.message);
  const resposta = data.content[0].text;
  conversas[numero].push({ role: 'assistant', content: resposta });
  return resposta;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'painel.html'));
});

app.get('/conversas', (req, res) => {
  res.json({ historico: historicoParaPainel, modosHumanos });
});

app.post('/modo-humano', (req, res) => {
  const { numero, ativo } = req.body;
  if (ativo) { modosHumanos[numero] = true; } else { delete modosHumanos[numero]; }
  console.log('Modo humano ' + (ativo ? 'ATIVADO' : 'DESATIVADO') + ' para ' + numero);
  res.json({ ok: true });
});

app.post('/enviar-humano', async (req, res) => {
  const { numero, texto } = req.body;
  try {
    await enviarMensagem(numero, texto);
    salvarNoPainel(numero, 'humano', texto);
    res.json({ ok: true });
  } catch(e) {
    res.json({ ok: false, erro: e.message });
  }
});

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body || '';
  const numero = req.body.From || '';
  console.log('Mensagem de ' + numero + ': ' + mensagem);

  salvarNoPainel(numero, 'user', mensagem);
  res.status(200).send('OK');

  // Primeira mensagem do hóspede — envia boas-vindas
  if (!primeirasMensagens[numero]) {
    primeirasMensagens[numero] = true;
    await enviarMensagem(numero, MENSAGEM_BOAS_VINDAS);
    salvarNoPainel(numero, 'assistant', MENSAGEM_BOAS_VINDAS);
    return;
  }

  // Se hóspede escolheu atendimento humano
  const msgLower = mensagem.toLowerCase().trim();
  if (msgLower === '2' || msgLower.includes('atendente') || msgLower.includes('humano') || msgLower.includes('pessoa') || msgLower.includes('falar com')) {
    modosHumanos[numero] = true;
    const aviso = 'Claro! Estou avisando nossa equipe. Um atendente entrara em contato com voce em instantes. Obrigado pela preferencia pelo Cardim Plaza Hotel!';
    await enviarMensagem(numero, aviso);
    salvarNoPainel(numero, 'assistant', aviso);
    console.log('Modo humano ativado automaticamente para ' + numero);
    return;
  }

  if (modosHumanos[numero]) {
    console.log('Modo humano ativo para ' + numero + ' — robô não responde');
    return;
  }

  if (ultimaMensagem[numero]) clearTimeout(ultimaMensagem[numero]);
  ultimaMensagem[numero] = setTimeout(async () => {
    if (modosHumanos[numero]) return;
    try {
      const txt = 'Esperamos ter ajudado! Sua duvida foi resolvida? Estamos a disposicao para o que precisar. Sera um prazer recebe-lo no Cardim Plaza Hotel!';
      await enviarMensagem(numero, txt);
      salvarNoPainel(numero, 'assistant', txt);
    } catch(e) { console.error('Erro proativa:', e.message); }
    delete ultimaMensagem[numero];
  }, 5 * 60 * 1000);

  try {
    const resposta = await perguntarIA(numero, mensagem);
    console.log('Resposta: ' + resposta);
    salvarNoPainel(numero, 'assistant', resposta);
    await enviarMensagem(numero, resposta);
  } catch(e) {
    console.error('Erro:', e.message);
    await enviarMensagem(numero, 'Instabilidade momentanea. Tente novamente.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
