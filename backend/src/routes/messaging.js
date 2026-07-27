const express = require('express');
const router = express.Router();
const notif = require('../services/notificationService');

const messageLog = [];
const templates = [
  { id: 1, name: 'Vencimento Próximo', message: 'Olá {{nome}}, seu plano {{plano}} vence em breve no dia {{vencimento}}. Renove e continue aproveitando o melhor da MAXX STREAM! 🚀' },
  { id: 2, name: 'Boas-Vindas', message: 'Seja bem-vindo à MAXX STREAM {{nome}}! 🎉 Seu plano {{plano}} já está ativo. Qualquer dúvida, estamos aqui. Aproveite!' },
  { id: 3, name: 'Promoção', message: 'Oferta especial só para você {{nome}}! Renove seu plano {{plano}} agora e ganhe condições exclusivas. Não perca essa chance! 🔥' },
  { id: 4, name: 'Teste Grátis', message: 'Olá {{nome}}, seu teste grátis está liberado por 6 horas! Teste a qualidade MAXX STREAM sem compromisso. 🎯' },
  { id: 5, name: 'Cobrança', message: 'Olá {{nome}}, lembramos que seu plano {{plano}} venceu em {{vencimento}}. Regularize para não perder o acesso. 💡' },
];

router.get('/status', (req, res) => {
  const waStatus = notif.getWAStatus();
  res.json({ success: true, waReady: waStatus.ready, qr: waStatus.qr || '', brevoKey: !!process.env.BREVO_API_KEY });
});

router.get('/qr', (req, res) => {
  const waStatus = notif.getWAStatus();
  res.json({ success: true, qr: waStatus.qr || '', ready: waStatus.ready });
});

router.get('/templates', (req, res) => {
  res.json({ success: true, templates });
});

router.post('/send-whatsapp', async (req, res) => {
  const { telefone, mensagem, clienteNome } = req.body;
  if (!telefone || !mensagem) return res.status(400).json({ error: 'Telefone e mensagem obrigatórios' });
  try {
    await notif.sendWhatsApp(telefone, mensagem);
    messageLog.push({ type: 'whatsapp', to: telefone, name: clienteNome || '', message: mensagem, timestamp: new Date().toISOString() });
    if (req.io) req.io.emit('stream-alert', { message: 'WhatsApp enviado para ' + (clienteNome || telefone) });
    res.json({ success: true, message: 'WhatsApp enviado!' });
  } catch (err) {
    res.status(400).json({ error: 'WhatsApp não conectado. Escaneie o QR Code primeiro.' });
  }
});

router.post('/send-email', async (req, res) => {
  const { email, nome, assunto, mensagem } = req.body;
  if (!email || !mensagem) return res.status(400).json({ error: 'E-mail e mensagem obrigatórios' });
  try {
    await notif.sendEmail(email, nome || 'Cliente', assunto || 'MAXX STREAM', mensagem);
    messageLog.push({ type: 'email', to: email, name: nome || '', message: mensagem, timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'E-mail enviado!' });
  } catch (err) {
    console.error('[Email] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao enviar e-mail. Verifique as configurações.' });
  }
});

router.post('/bulk-whatsapp', async (req, res) => {
  const { clientes, mensagem } = req.body;
  if (!clientes || !clientes.length || !mensagem) return res.status(400).json({ error: 'Clientes e mensagem obrigatórios' });
  const results = [];
  for (const c of clientes) {
    try {
      await notif.sendWhatsApp(c.phone, mensagem.replace(/\{\{nome\}\}/g, c.name));
      results.push({ name: c.name, status: 'ok' });
    } catch (e) {
      console.error('[Bulk WhatsApp] Erro:', e.message);
      results.push({ name: c.name, status: 'erro', error: 'falha no envio' });
    }
  }
  res.json({ success: true, results, total: results.length });
});

router.post('/bulk-email', async (req, res) => {
  const { clientes, assunto, mensagem } = req.body;
  if (!clientes || !clientes.length) return res.status(400).json({ error: 'Clientes obrigatórios' });
  const results = [];
  for (const c of clientes) {
    try {
      await notif.sendEmail(c.email, c.name, assunto || 'MAXX STREAM', mensagem.replace(/\{\{nome\}\}/g, c.name));
      results.push({ name: c.name, status: 'ok' });
    } catch (e) {
      console.error('[Bulk Email] Erro:', e.message);
      results.push({ name: c.name, status: 'erro', error: 'falha no envio' });
    }
  }
  res.json({ success: true, results, total: results.length });
});

router.get('/log', (req, res) => {
  res.json({ success: true, log: messageLog.slice(-100) });
});

module.exports = router;