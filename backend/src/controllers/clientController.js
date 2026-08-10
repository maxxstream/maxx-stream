const { getDb, salvar } = require('../database');
const seventv = require('../services/seventvApi');
const notif = require('../services/notificationService');

const maskEmail = (email) => { const [u, d] = email.split('@'); return `${u.substring(0, 2)}***@${d}`; };
const maskPhone = (phone) => `${phone.substring(0, 5)}***-${phone.substring(phone.length - 4)}`;

exports.getClients = (req, res) => {
  const db = getDb();
  const result = db.exec(`SELECT * FROM clientes ORDER BY id`);
  if (!result.length) return res.json({ success: true, clients: [], credits: 0 });

  const cols = result[0].columns;
  const clients = result[0].values.map(row => ({
    id: row[0], name: row[1], email: maskEmail(row[2]), phone: maskPhone(row[3]),
    plan: row[4], status: row[5], connections: row[6], expiration: row[7]
  }));

  const cred = db.exec(`SELECT credits FROM usuarios WHERE email = 'admin@maxxstream.com.br'`);
  const credits = cred.length ? cred[0].values[0][0] : 0;

  res.json({ success: true, clients, credits });
};

exports.getClientById = (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT * FROM clientes WHERE id = ?`, [parseInt(req.params.id)]);
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Cliente não encontrado.' });
  const cols = r[0].columns;
  const c = r[0].values[0];
  res.json({ success: true, client: { id: c[0], name: c[1], email: maskEmail(c[2]), phone: maskPhone(c[3]), plan: c[4], status: c[5], connections: c[6], expiration: c[7] } });
};

exports.addClient = (req, res) => {
  const { name, email, phone, plan } = req.body;
  if (!name || !email || !phone || !plan) return res.status(400).json({ error: 'Preencha todos os campos.' });

  const planConfig = { Mensal: [30, 2], Trimestral: [90, 4], Anual: [365, 5], Trial: [0, 1] };
  const [days, conn] = planConfig[plan] || [30, 2];
  const exp = plan === 'Trial' ? '' : new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

  const db = getDb();
  db.run(`INSERT INTO clientes (name, email, phone, plan, status, connections, expiration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, plan, plan === 'Trial' ? 'Trial' : 'Ativo', conn, exp]);
  salvar();

  const id = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];
  res.status(201).json({ success: true, client: { id, name, email: maskEmail(email), phone: maskPhone(phone), plan, status: plan === 'Trial' ? 'Trial' : 'Ativo', connections: conn, expiration: exp } });
};

exports.deleteClient = (req, res) => {
  const db = getDb();
  db.run(`DELETE FROM clientes WHERE id = ?`, [parseInt(req.params.id)]);
  salvar();
  res.json({ success: true, message: 'Cliente removido.' });
};

exports.notifyClient = async (req, res) => {
  const { id } = req.params;
  const { type, message } = req.body;
  const db = getDb();
  const r = db.exec(`SELECT * FROM clientes WHERE id = ?`, [parseInt(id)]);
  if (!r.length || !r[0].values.length) return res.status(404).json({ error: 'Cliente não encontrado.' });

  const c = r[0].values[0];
  const msg = message || `Olá ${c[1]}, seu plano ${c[4]} vence em ${c[7] || 'breve'}. Renove agora!`;
  const to = type === 'whatsapp' ? c[3] : c[2];

  db.run(`INSERT INTO mensagens (clientId, type, to_addr, message) VALUES (?, ?, ?, ?)`, [c[0], type, to, msg]);
  salvar();

  let enviado = false;
  try {
    if (type === 'whatsapp') {
      await notif.sendWhatsApp(to, msg);
    } else {
      await notif.sendEmail(to, c[1], 'MAXX STREAM — Renovação de Plano', msg);
    }
    enviado = true;
  } catch (e) {
    console.error('[Notificar] Falha no envio real:', e.message);
  }

  res.json({ success: true, enviado, message: `Notificação ${enviado ? 'enviada' : 'registrada'} via ${type} para ${c[1]}!` });
};

exports.generateTest = async (req, res) => {
  const db = getDb();
  const cfgKey = db.exec(`SELECT value FROM configuracoes WHERE key = 'seventv_api_key'`);
  const apiKey = cfgKey.length && cfgKey[0].values.length ? cfgKey[0].values[0][0] : '';
  if (apiKey) {
    process.env.SEVENTV_API_KEY = apiKey;
  }

  const cred = db.exec(`SELECT credits FROM usuarios WHERE email = 'admin@maxxstream.com.br'`);
  let credits = cred.length ? cred[0].values[0][0] : 0;

  if (credits <= 0) return res.status(400).json({ error: 'Saldo insuficiente de créditos.' });

  credits -= 1;
  db.run(`UPDATE usuarios SET credits = ? WHERE email = 'admin@maxxstream.com.br'`, [credits]);
  salvar();

  try {
    const result = await seventv.generateTestAccount(6, 'smart_tv');
    res.json({
      success: true,
      message: 'Conta de teste criada por 6 horas.',
      user: result.username || 'teste_' + Math.floor(Math.random() * 90000 + 10000),
      pass: result.password || Math.floor(Math.random() * 900000 + 100000).toString(),
      expiresAt: result.expires_at,
      creditsRemaining: credits,
      simulated: result.simulated || false
    });
  } catch (e) {
    res.json({ success: true, message: 'Conta de teste criada por 6 horas.', user: 'teste_' + Math.floor(Math.random() * 90000 + 10000), pass: Math.floor(Math.random() * 900000 + 100000).toString(), creditsRemaining: credits });
  }
};

exports.getStats = (req, res) => {
  const db = getDb();
  const clientes = db.exec(`SELECT plan, status, COUNT(*) as qtd FROM clientes GROUP BY plan, status`);
  const total = db.exec(`SELECT COUNT(*) FROM clientes`)[0].values[0][0];
  const ativos = db.exec(`SELECT COUNT(*) FROM clientes WHERE status = 'Ativo'`)[0].values[0][0];
  const planosPrecos = db.exec(`SELECT name, price FROM planos WHERE active = 1`);
  const precos = {};
  if (planosPrecos.length && planosPrecos[0].values.length) {
    planosPrecos[0].values.forEach(row => { precos[row[0]] = row[1]; });
  }
  const fat = db.exec(`SELECT plan, COUNT(*) as qtd FROM clientes WHERE status = 'Ativo' GROUP BY plan`);
  let faturamento = 0;
  if (fat.length && fat[0].values.length) {
    fat[0].values.forEach(row => { faturamento += (precos[row[0]] || 0) * row[1]; });
  }
  const msgs = db.exec(`SELECT type, COUNT(*) as qtd FROM mensagens GROUP BY type`);
  const cred = db.exec(`SELECT credits FROM usuarios WHERE email = 'admin@maxxstream.com.br'`);

  res.json({ success: true, stats: { total, ativos, faturamento, credits: cred.length ? cred[0].values[0][0] : 0, clientes: clientes.length ? clientes[0].values : [], mensagens: msgs.length ? msgs[0].values : [] } });
};

exports.exportClients = (req, res) => {
  const db = getDb();
  const r = db.exec(`SELECT name, email, phone, plan, status, connections, expiration FROM clientes`);
  if (!r.length) return res.json({ success: true, csv: 'nome,email,telefone,plano,status,conexoes,vencimento\n' });

  const cols = r[0].columns;
  let csv = cols.join(',') + '\n';
  r[0].values.forEach(row => {
    csv += row.map(v => `"${v || ''}"`).join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
  res.send(csv);
};

// CRM
exports.getCRMConversas = (req, res) => {
  const db = getDb();
  const { clientId } = req.query;

  if (clientId) {
    const msgs = db.exec(`SELECT * FROM mensagens WHERE clientId = ? ORDER BY timestamp`, [parseInt(clientId)]);
    const mensagens = msgs.length ? msgs[0].values.map(m => ({ id: m[0], type: m[2], to: m[3], message: m[4], direction: m[5], timestamp: m[6] })) : [];
    return res.json({ success: true, mensagens });
  }

  const clientes = db.exec(`SELECT * FROM clientes ORDER BY name`);
  const conversas = clientes.length ? clientes[0].values.map(c => {
    const last = db.exec(`SELECT type, message, timestamp FROM mensagens WHERE clientId = ? ORDER BY timestamp DESC LIMIT 1`, [c[0]]);
    return {
      id: c[0], name: c[1], email: maskEmail(c[2]), phone: maskPhone(c[3]), plan: c[4], status: c[5],
      ultimaMensagem: last.length && last[0].values.length ? { type: last[0].values[0][0], message: last[0].values[0][1], timestamp: last[0].values[0][2] } : null
    };
  }) : [];

  res.json({ success: true, conversas });
};

exports.sendCRM = async (req, res) => {
  const { clientId, type, message } = req.body;
  if (!clientId || !type || !message) return res.status(400).json({ error: 'Campos obrigatórios' });

  const db = getDb();
  const c = db.exec(`SELECT * FROM clientes WHERE id = ?`, [parseInt(clientId)]);
  if (!c.length || !c[0].values.length) return res.status(404).json({ error: 'Cliente não encontrado' });

  const cRow = c[0].values[0];
  const to = type === 'whatsapp' ? cRow[3] : cRow[2];
  db.run(`INSERT INTO mensagens (clientId, type, to_addr, message) VALUES (?, ?, ?, ?)`, [parseInt(clientId), type, to, message]);
  salvar();

  let enviado = false;
  try {
    if (type === 'whatsapp') {
      await notif.sendWhatsApp(to, message);
    } else {
      await notif.sendEmail(to, cRow[1], 'MAXX STREAM', message);
    }
    enviado = true;
  } catch (e) {
    console.error('[CRM] Falha no envio real:', e.message);
  }

  const id = db.exec(`SELECT last_insert_rowid()`)[0].values[0][0];
  res.json({ success: true, enviado, mensagem: { id, type, to, message, direction: 'enviada', timestamp: new Date().toISOString() } });
};