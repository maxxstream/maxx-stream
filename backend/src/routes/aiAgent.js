const express = require('express');
const router = express.Router();
const { gerarResposta, verificarStatus } = require('../services/aiAgentService');
const { getDb, salvar } = require('../database');

router.post('/chat', async (req, res) => {
  try {
    const { mensagem, contexto } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }
    const result = await gerarResposta(mensagem.trim(), contexto || '');
    res.json(result);
  } catch (err) {
    console.error('[AI Chat] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao processar mensagem.' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = await verificarStatus();
    res.json(status);
  } catch (err) {
    console.error('[AI Status] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao verificar status.' });
  }
});

router.post('/train', (req, res) => {
  try {
    const { conteudo } = req.body;
    if (!conteudo) return res.status(400).json({ error: 'Conteúdo é obrigatório' });

    const db = getDb();
    const existing = db.exec(`SELECT value FROM configuracoes WHERE key = 'ai_training'`);
    if (existing.length && existing[0].values.length) {
      db.run(`UPDATE configuracoes SET value = ? WHERE key = 'ai_training'`, [conteudo]);
    } else {
      db.run(`INSERT INTO configuracoes (key, value) VALUES ('ai_training', ?)`, [conteudo]);
    }
    salvar();
    res.json({ ok: true, message: 'Treinamento salvo!' });
  } catch (err) {
    console.error('[AI Train] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao salvar treinamento.' });
  }
});

router.get('/training', (req, res) => {
  try {
    const db = getDb();
    const r = db.exec(`SELECT value FROM configuracoes WHERE key = 'ai_training'`);
    const conteudo = (r.length && r[0].values.length) ? r[0].values[0][0] : '';
    res.json({ conteudo });
  } catch (err) {
    console.error('[AI Training] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao carregar treinamento.' });
  }
});

router.post('/auto-respond', (req, res) => {
  try {
    const { ativo } = req.body;
    const db = getDb();
    const existing = db.exec(`SELECT value FROM configuracoes WHERE key = 'ai_auto_respond'`);
    if (existing.length && existing[0].values.length) {
      db.run(`UPDATE configuracoes SET value = ? WHERE key = 'ai_auto_respond'`, [ativo ? 'true' : 'false']);
    } else {
      db.run(`INSERT INTO configuracoes (key, value) VALUES ('ai_auto_respond', ?)`, [ativo ? 'true' : 'false']);
    }
    salvar();
    res.json({ ok: true, ativo });
  } catch (err) {
    console.error('[AI AutoRespond] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao configurar resposta automática.' });
  }
});

module.exports = router;
