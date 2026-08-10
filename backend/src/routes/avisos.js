const express = require('express');
const router = express.Router();
const { getDb, salvar } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT * FROM avisos ORDER BY createdAt DESC`);
  if (!r.length) return res.json({ success: true, avisos: [] });
  const cols = r[0].columns;
  const avisos = r[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
  res.json({ success: true, avisos });
});

router.post('/', (req, res) => {
  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo obrigatórios' });
  const db = getDb();
  db.run(`INSERT INTO avisos (title, content, type) VALUES (?, ?, ?)`, [title, content, type || 'info']);
  salvar();
  const id = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];
  res.status(201).json({ success: true, aviso: { id, title, content, type: type || 'info', active: 1 } });
});

const AVISO_CAMPOS = { title: 1, content: 1, type: 1, active: 1 };

router.put('/:id', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT * FROM avisos WHERE id = ?`, [parseInt(req.params.id)]);
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Aviso não encontrado' });
  const updates = [];
  const params = [];
  Object.keys(req.body).forEach(key => {
    if (!AVISO_CAMPOS[key]) return;
    updates.push(key + ' = ?');
    if (key === 'active') params.push(req.body[key] ? 1 : 0);
    else params.push(req.body[key]);
  });
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
  params.push(parseInt(req.params.id));
  db.run(`UPDATE avisos SET ${updates.join(', ')} WHERE id = ?`, params);
  salvar();
  res.json({ success: true, message: 'Aviso atualizado' });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM avisos WHERE id = ?`, [parseInt(req.params.id)]);
  salvar();
  res.json({ success: true, message: 'Aviso removido' });
});

module.exports = router;