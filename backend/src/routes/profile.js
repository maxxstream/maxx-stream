const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb, salvar } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT id, name, email, credits, twoFA FROM usuarios WHERE email = ?`, { bind: [req.user.email] });
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  const row = r[0].values[0];
  res.json({ success: true, user: { id: row[0], name: row[1], email: row[2], credits: row[3], twoFA: !!row[4] } });
});

router.put('/', (req, res) => {
  const { name, twoFA } = req.body;
  const db = getDb();
  const email = req.user.email;
  if (name) db.run(`UPDATE usuarios SET name = ? WHERE email = ?`, [name, email]);
  if (twoFA !== undefined) db.run(`UPDATE usuarios SET twoFA = ? WHERE email = ?`, [twoFA ? 1 : 0, email]);
  salvar();
  res.json({ success: true, message: 'Perfil atualizado!' });
});

router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Preencha todos os campos' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'A senha deve ter no mínimo 4 caracteres' });
  const db = getDb();
  const r = db.exec(`SELECT password FROM usuarios WHERE email = ?`, { bind: [req.user.email] });
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  const valid = bcrypt.compareSync(currentPassword, r[0].values[0][0]);
  if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.run(`UPDATE usuarios SET password = ? WHERE email = ?`, [hash, req.user.email]);
  salvar();
  res.json({ success: true, message: 'Senha alterada com sucesso!' });
});

module.exports = router;
