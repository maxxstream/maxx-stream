const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();

  const totalClientes = db.exec(`SELECT COUNT(*) FROM clientes`);
  const total = totalClientes.length ? totalClientes[0].values[0][0] : 0;

  const ativosR = db.exec(`SELECT COUNT(*) FROM clientes WHERE status = 'Ativo'`);
  const ativos = ativosR.length ? ativosR[0].values[0][0] : 0;

  const fatR = db.exec(`SELECT SUM(CASE WHEN status='Ativo' THEN CASE plan WHEN 'Mensal' THEN 35 WHEN 'Trimestral' THEN 85 WHEN 'Anual' THEN 280 ELSE 0 END ELSE 0 END) FROM clientes`);
  const faturamento = fatR.length ? (fatR[0].values[0][0] || 0) : 0;

  const planosR = db.exec(`SELECT plan, COUNT(*) as qtd, SUM(CASE WHEN status='Ativo' THEN 1 ELSE 0 END) as ativos FROM clientes GROUP BY plan`);
  const planos = planosR.length ? planosR[0].values.map(row => ({ plan: row[0], total: row[1], ativos: row[2] })) : [];

  const mensaisR = db.exec(`SELECT strftime('%Y-%m', createdAt) as mes, COUNT(*) as novos FROM clientes GROUP BY mes ORDER BY mes DESC LIMIT 12`);
  const historico = mensaisR.length ? mensaisR[0].values.map(row => ({ mes: row[0], novos: row[1] })) : [];

  res.json({
    success: true,
    faturamento: {
      total,
      ativos,
      faturamentoMensal: faturamento,
      faturamentoAnual: faturamento * 12,
      planos,
      historico
    }
  });
});

router.get('/detalhado', (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT id, name, plan, status, connections, expiration, createdAt FROM clientes ORDER BY createdAt DESC`);
  const clientes = r.length ? r[0].values.map(row => ({
    id: row[0], name: row[1], plan: row[2], status: row[3],
    connections: row[4], expiration: row[5], createdAt: row[6]
  })) : [];
  res.json({ success: true, clientes });
});

module.exports = router;
