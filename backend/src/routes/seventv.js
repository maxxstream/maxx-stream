const express = require('express');
const router = express.Router();
const { getDb, salvar } = require('../database');
const seventv = require('../services/seventvApi');

router.get('/status', async (req, res) => {
  try {
    const credits = await seventv.getCredits();
    res.json({ success: true, connected: !credits.simulated, credits });
  } catch (e) {
    console.error('[Seventv Status] Erro:', e.message);
    res.json({ success: true, connected: false, credits: { credits: 0, status: 'error', message: 'Erro de conexão' } });
  }
});

router.post('/sync', async (req, res) => {
  const db = getDb();
  const cfg = db.exec(`SELECT key, value FROM configuracoes WHERE key IN ('seventv_api_key', 'seventv_partner_id')`);
  let apiKey = '', partnerId = '';
  if (cfg.length && cfg[0].values.length) {
    cfg[0].values.forEach(row => {
      if (row[0] === 'seventv_api_key') apiKey = row[1];
      if (row[0] === 'seventv_partner_id') partnerId = row[1];
    });
  }
  if (apiKey) {
    process.env.SEVENTV_API_KEY = apiKey;
    process.env.SEVENTV_PARTNER_ID = partnerId;
  }
  try {
    const credits = await seventv.getCredits();
    res.json({ success: true, connected: !credits.simulated, credits });
  } catch (e) {
    res.json({ success: true, connected: false, credits: null });
  }
});

router.get('/credits', async (req, res) => {
  try {
    const credits = await seventv.getCredits();
    res.json({ success: true, credits: credits.credits || 0, raw: credits });
  } catch (e) {
    console.error('[Seventv Credits] Erro:', e.message);
    res.json({ success: true, credits: 0, error: 'Erro ao consultar créditos' });
  }
});

router.get('/check-connection', async (req, res) => {
  const db = getDb();
  const cfgR = db.exec(`SELECT value FROM configuracoes WHERE key = 'seventv_api_key'`);
  const apiKey = cfgR.length && cfgR[0].values.length ? cfgR[0].values[0][0] : '';
  const configured = !!apiKey;
  if (!configured) return res.json({ success: true, configured: false, connected: false, message: 'API key não configurada' });
  process.env.SEVENTV_API_KEY = apiKey;
  try {
    const result = await seventv.getCredits();
    res.json({ success: true, configured: true, connected: !result.simulated, credits: result.credits || 0 });
  } catch (e) {
    console.error('[Seventv Check] Erro:', e.message);
    res.json({ success: true, configured: true, connected: false, credits: 0, error: 'Erro de conexão' });
  }
});

module.exports = router;
