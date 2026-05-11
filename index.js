const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const conversas = {};
const ultimaMensagem = {};

const SYSTEM_PROMPT = `Você é o assistente virtual do Cardim Plaza Hotel. Seu nome é Cardim. Atenda com cordialidade e profissionalismo usando emojis com moderação.

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
- Hospital Paulistano: 50 metros (praticamente na porta do hotel)
- Hospital Beneficência Portuguesa: 100 metros (praticamente na porta do hotel)
- Hospital AC Camargo Cancer Center: 500 metros (6 minutos a pé)
- Hospital Alemão Oswaldo Cruz: 500 metros (6 minutos a pé)

METRÔ PRÓXIMO:
- Estação Vergueiro (Linha 1 - Azul): 5 minutos a pé
- Estação São Joaquim (Linha 1 - Azul): 7 minutos a pé

AEROPORTOS:
- Aeroporto de Congonhas (voos domésticos): 8 km, 15 minutos de carro ou Uber
- Aeroporto de Guarulhos (voos internacionais e domésticos): 40 km, 40 a 60 minutos de carro. Opção econômica: metrô Linha 1 até a Estação Luz + Expresso Aeroporto (R$5,20)

RODOVIÁRIAS:
- Terminal Rodoviário do Tietê (maior rodoviária da América Latina): 8 km, 20 minutos de carro. Opção econômica: metrô Linha 1 até Estação Tietê
- Terminal Rodoviário da Barra Funda: 10 km, 20 minutos de carro. Opção econômica: metrô Linha 1 até Estação Barra Funda
- Terminal Rodoviário do Jabaquara (ônibus para o litoral): 12 km, 25 minutos de carro. Opção econômica: metrô Linha 1 até Estação Jabaquara

PONTOS TURÍSTICOS PRÓXIMOS:
- Avenida Paulista: 1,5 km (15 minutos a pé ou 5 minutos de metrô)
- Bairro da Liberdade: 800 metros (10 minutos a pé)
- Parque Ibirapuera: 2,8 km (10 minutos de carro)
- MASP: 2,6 km (10 minutos de carro)
- Bixiga (Bela Vista): 300 metros (5 minutos a pé)
- Parque Trianon: 2,3 km (10 minutos de carro)
- Parque da Independência: 3,5 km (15 minutos de carro)
- Frei Caneca Shopping: 1,7 km (8 minutos de carro)
- Casa das Rosas: 1 km (12 minutos a pé)

RESTAURANTES PRÓXIMOS:

Na Rua do Hotel (Rua Maestro Cardim):
- Japa's: culinária brasileira/japonesa - Rua Maestro Cardim, 332 (100m do hotel)
- Casa do Pao de Queijo: lanches e cafe - Rua Maestro Cardim, 769 (200m do hotel)
- Bonjardim Restaurante: culinaria brasileira - Rua Maestro Cardim, 407 (100m do hotel)

Bixiga/Bela Vista (5 a 10 minutos a pe):
- Famiglia Mancini: italiano premiado - Rua Avanhandava, 81
- Pizzaria Speranza: pizza tradicional desde 1958 - Rua Treze de Maio, 1004
- Cantina Lazzarella: italiano com musica ao vivo aos sabados - Rua Treze de Maio, 589
- Osteria Generale: italiano, famoso pelo nhoque - Rua Dr. Fausto Ferraz, 163
- Mexilhao: frutos do mar - Rua Treze de Maio, 626
- Templo da Carne Marcos Bassi: churrascaria sofisticada - Rua Treze de Maio, 668
- Cantina C Que Sabe: italiano desde 1931 - Rua Rui Barbosa, 192
- Amazonia Casa Brasileira: culinaria paraense - Rua Rui Barbosa, 218
- Coco Bambu Conceito: frutos do mar - Patio Paulista (600m do hotel)

Bairro da Liberdade (10 minutos a pe):
- Diversas opcoes de culinaria japonesa, chinesa e coreana na Rua Galvao Bueno

Avenida Paulista (15 minutos a pe ou 5 minutos de metro):
- Cafe Creme: cafe e refeicoes desde 1988 - Av. Paulista, 807
- Cafe Mestico: culinaria asiatica - Av. Paulista, 508

REGRAS PARA RESERVAS:
Quando o hospede informar as datas, gere o link substituindo as datas no formato DD-MM-YYYY.
Exemplo: check-in 16/05 e check-out 18/05:
https://book.omnibees.com/hotel/18555?checkIn=16-05-2026&checkOut=18-05-2026&currencyId=16&lang=pt-BR

Responda assim quando tiver as datas:
Acesse o link para ver disponibilidade e reservar: https://book.omnibees.com/hotel/18555?checkIn=DD-MM-YYYY&checkOut=DD-MM-YYYY&currencyId=16&lang=pt-BR

OUTRAS REGRAS:
- Seja educado, formal e simpatico
- Use no maximo 1 emoji por mensagem
- Nunca invente informacoes
- Se nao souber responder diga: Aguarde um momento, um atendente ira lhe responder em breve.
- Nao responda sobre assuntos nao relacionados ao hotel
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

function escaparXML(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.Body || '';
  const numero = req.body.From || '';
  console.log('Mensagem de ' + numero + ': ' + mensagem);

  if (ultimaMensagem[numero]) clearTimeout(ultimaMensagem[numero]);

  ultimaMensagem[numero] = setTimeout(async () => {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
        to: numero,
        body: 'Olá! Esperamos ter ajudado. Sua duvida foi resolvida? Caso precise de mais informacoes ou queira fazer uma reserva, estamos a disposicao. Sera um prazer recebe-lo no Cardim Plaza Hotel!'
      });
      console.log('Mensagem proativa enviada para ' + numero);
    } catch(e) {
      console.error('Erro proativa:', e.message);
    }
    delete ultimaMensagem[numero];
  }, 5 * 60 * 1000);

  try {
    const resposta = await perguntarIA(numero, mensagem);
    console.log('Resposta: ' + resposta);
    const respostaSegura = escaparXML(resposta);
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + respostaSegura + '</Message></Response>');
  } catch(e) {
    console.error('Erro:', e.message);
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Instabilidade momentanea. Tente novamente.</Message></Response>');
  }
});

app.get('/', (req, res) => res.send('Robo Cardim Plaza online!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
