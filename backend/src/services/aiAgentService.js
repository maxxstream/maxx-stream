const axios = require('axios');
const { getDb, salvar } = require('../database');

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey() {
  const db = getDb();
  if (!db) return process.env.GEMINI_API_KEY || '';
  const r = db.exec(`SELECT value FROM configuracoes WHERE key = 'gemini_api_key'`);
  if (r.length && r[0].values.length) return r[0].values[0][0];
  return process.env.GEMINI_API_KEY || '';
}

function getTrainingData() {
  const db = getDb();
  if (!db) return '';
  const r = db.exec(`SELECT value FROM configuracoes WHERE key = 'ai_training'`);
  if (r.length && r[0].values.length) return r[0].values[0][0];
  return '';
}

function getAutoRespond() {
  const db = getDb();
  if (!db) return false;
  const r = db.exec(`SELECT value FROM configuracoes WHERE key = 'ai_auto_respond'`);
  if (r.length && r[0].values.length) return r[0].values[0][0] === 'true';
  return false;
}

const SYSTEM_PROMPT = `Você é o assistente virtual da MAXX STREAM, uma plataforma IPTV brasileira.
Você ajuda administradores e clientes com informações sobre planos, suporte técnico, renovação de assinaturas, etc.
Seja educado, profissional e responda em português brasileiro.
Se não souber algo, diga que vai verificar com o suporte técnico.
Nunca invente informações sobre preços ou planos.`;

async function gerarResposta(mensagem, contexto = '') {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { erro: true, mensagem: 'API do Google Gemini não configurada. Vá em Configurações > Agente IA para configurar.' };
  }

  const training = getTrainingData();
  const treinamento = training ? `\nInformações do sistema:\n${training}\n` : '';

  try {
    const response = await axios.post(
      `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n${treinamento}\n${contexto ? "Contexto: " + contexto + "\n" : ""}Cliente: ${mensagem}\nAssistente:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
          topK: 40
        }
      },
      { timeout: 15000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';
    return { erro: false, mensagem: text.trim() };
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    if (msg.includes('API_KEY_INVALID')) {
      return { erro: true, mensagem: 'Chave de API inválida. Verifique sua chave do Google Gemini.' };
    }
    if (msg.includes('quota') || msg.includes('429')) {
      return { erro: true, mensagem: 'Limite de requisições excedido. Aguarde um momento e tente novamente.' };
    }
    return { erro: true, mensagem: 'Erro ao comunicar com a IA. Tente novamente.' };
  }
}

async function verificarStatus() {
  const apiKey = getApiKey();
  return {
    configurado: !!apiKey,
    autoResponder: getAutoRespond()
  };
}

module.exports = { gerarResposta, verificarStatus, getTrainingData, getAutoRespond, getApiKey };
