const express = require('express');
const router = express.Router();
const { getDb, salvar } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT key, value FROM configuracoes`);
  const settings = {};
  if (r.length && r[0].values.length) {
    r[0].values.forEach(row => { settings[row[0]] = row[1]; });
  }
  res.json({ success: true, settings });
});

router.put('/', (req, res) => {
  const db = getDb();
  const updates = req.body;
  if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Envie um objeto com chave/valor' });
  Object.keys(updates).forEach(key => {
    const stmt = db.prepare(`SELECT key FROM configuracoes WHERE key = ?`);
    stmt.bind([key]);
    let exists = false;
    while (stmt.step()) { exists = true; }
    stmt.free();
    if (exists) {
      db.run(`UPDATE configuracoes SET value = ? WHERE key = ?`, [String(updates[key]), key]);
    } else {
      db.run(`INSERT INTO configuracoes (key, value) VALUES (?, ?)`, [key, String(updates[key])]);
    }
  });
  salvar();
  res.json({ success: true, message: 'Configurações salvas' });
});

module.exports = router;
