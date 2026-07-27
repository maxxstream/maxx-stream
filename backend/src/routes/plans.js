const express = require('express');
const router = express.Router();
const { getDb, salvar } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT * FROM planos ORDER BY price`);
  if (!r.length) return res.json({ success: true, plans: [] });
  const cols = r[0].columns;
  const plans = r[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
  res.json({ success: true, plans });
});

router.post('/', (req, res) => {
  const { name, price, days, connections, description } = req.body;
  if (!name || price === undefined || !days) return res.status(400).json({ error: 'Campos obrigatórios: name, price, days' });
  const db = getDb();
  try {
    db.run(`INSERT INTO planos (name, price, days, connections, description) VALUES (?, ?, ?, ?, ?)`,
      [name, parseFloat(price), parseInt(days), parseInt(connections || 2), description || '']);
    salvar();
    const id = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];
    res.status(201).json({ success: true, plan: { id, name, price: parseFloat(price), days: parseInt(days), connections: parseInt(connections || 2), description: description || '', active: 1 } });
  } catch (e) {
    res.status(400).json({ error: 'Plano já existe ou dados inválidos' });
  }
});

const PLANO_CAMPOS = { name: 1, price: 1, days: 1, connections: 1, description: 1, active: 1 };

router.put('/:id', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT * FROM planos WHERE id = ?`, { bind: [parseInt(req.params.id)] });
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Plano não encontrado' });
  const updates = [];
  const params = [];
  Object.keys(req.body).forEach(key => {
    if (!PLANO_CAMPOS[key]) return;
    updates.push(key + ' = ?');
    if (key === 'price') params.push(parseFloat(req.body[key]));
    else if (key === 'days' || key === 'connections') params.push(parseInt(req.body[key]));
    else if (key === 'active') params.push(req.body[key] ? 1 : 0);
    else params.push(req.body[key]);
  });
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
  params.push(parseInt(req.params.id));
  db.run(`UPDATE planos SET ${updates.join(', ')} WHERE id = ?`, params);
  salvar();
  res.json({ success: true, message: 'Plano atualizado' });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM planos WHERE id = ?`, [parseInt(req.params.id)]);
  salvar();
  res.json({ success: true, message: 'Plano removido' });
});

module.exports = router;
