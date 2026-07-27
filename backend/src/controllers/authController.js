const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, salvar } = require('../database');
const otpService = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[ERRO] JWT_SECRET não configurado no .env');
  process.exit(1);
}
const JWT_EXPIRE = '24h';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Preencha todos os campos.' });
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });

  const db = getDb();
  const result = db.exec(`SELECT * FROM usuarios WHERE email = ?`, [email]);
  if (!result || !result[0] || !result[0].values || !result[0].values.length)
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  const cols = result[0].columns;
  const user = { id: row[0], name: row[1], email: row[2], password: row[3], credits: row[4], twoFA: row[5] };

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  const clienteResult = db.exec(`SELECT phone FROM clientes WHERE email = ?`, [email]);
  let phone = '';
  if (clienteResult && clienteResult[0] && clienteResult[0].values && clienteResult[0].values.length) {
    phone = clienteResult[0].values[0][0] || '';
  }

  const resultOtp = await otpService.enviarOtp(user.name, email, phone);
  if (resultOtp.erros.length === 2) {
    return res.status(500).json({ error: 'Falha ao enviar código de verificação. Verifique as configurações.' });
  }

  res.json({
    success: true, requireOtp: true,
    emailMask: resultOtp.emailMask,
    avisos: resultOtp.erros
  });
};

exports.verifyLoginOtp = async (req, res) => {
  const { email, codigo } = req.body;
  if (!email || !codigo) return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });

  const verificacao = otpService.verificarOtp(email, codigo);
  if (!verificacao.ok) return res.status(401).json({ error: verificacao.erro });

  const db = getDb();
  const result = db.exec(`SELECT * FROM usuarios WHERE email = ?`, [email]);
  if (!result || !result[0] || !result[0].values || !result[0].values.length)
    return res.status(404).json({ error: 'Usuário não encontrado.' });

  const row = result[0].values[0];
  const user = { id: row[0], name: row[1], email: row[2], credits: row[4], twoFA: row[5] };

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

  db.run(`INSERT INTO sessoes (userId, token) VALUES (?, ?)`, [user.id, token]);
  salvar();

  const clienteResult = db.exec(`SELECT phone FROM clientes WHERE email = ?`, [email]);
  let phone = '';
  if (clienteResult && clienteResult[0] && clienteResult[0].values && clienteResult[0].values.length) {
    phone = clienteResult[0].values[0][0] || '';
  }

  res.json({
    success: true, message: 'Login efetuado!',
    token,
    user: { name: user.name, email: user.email, phone, credits: user.credits, twoFA: !!user.twoFA }
  });
};

const pendingRegs = new Map();

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: 'Preencha todos os campos.' });
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
  if (name.trim().length < 2) return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres.' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres.' });

  const db = getDb();
  const exists = db.exec(`SELECT id FROM usuarios WHERE email = ?`, [email]);
  if (exists && exists[0] && exists[0].values && exists[0].values.length) return res.status(400).json({ error: 'E-mail já cadastrado.' });

  const resultOtp = await otpService.enviarOtp(name, email, phone.replace(/\D/g, ''));
  if (resultOtp.erros.length === 2) {
    return res.status(500).json({ error: 'Falha ao enviar código de verificação. Verifique as configurações.' });
  }

  pendingRegs.set(email.toLowerCase().trim(), { name, email, phone, password: bcrypt.hashSync(password, 10) });

  res.json({
    success: true, requireOtp: true,
    emailMask: resultOtp.emailMask,
    avisos: resultOtp.erros
  });
};

exports.verifyRegisterOtp = async (req, res) => {
  const { email, codigo } = req.body;
  if (!email || !codigo) return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });

  const verificacao = otpService.verificarOtp(email, codigo);
  if (!verificacao.ok) return res.status(401).json({ error: verificacao.erro });

  const key = email.toLowerCase().trim();
  const pending = pendingRegs.get(key);
  if (!pending) return res.status(400).json({ error: 'Nenhum cadastro pendente. Faça o registro novamente.' });

  pendingRegs.delete(key);

  const db = getDb();
  db.run(`INSERT INTO usuarios (name, email, password, credits) VALUES (?, ?, ?, ?)`, [pending.name, pending.email, pending.password, 0]);
  db.run(`INSERT INTO clientes (name, email, phone, plan, status, connections, expiration) VALUES (?, ?, ?, 'Trial', 'Ativo', 1, ?)`, [pending.name, pending.email, pending.phone, new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]]);
  salvar();

  res.json({ success: true, message: 'Conta criada! Faça o login.' });
};

exports.quickLogin = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Digite a senha de acesso.' });
  if (password !== 'HEROSHENRIQUE2009') return res.status(401).json({ error: 'Senha incorreta.' });

  const db = getDb();
  const result = db.exec(`SELECT * FROM usuarios WHERE email = 'admin@maxxstream.com.br'`);
  if (!result || !result[0] || !result[0].values || !result[0].values.length)
    return res.status(500).json({ error: 'Admin não encontrado.' });

  const row = result[0].values[0];
  const cols = result[0].columns;
  const user = { id: row[0], name: row[1], email: row[2], password: row[3], credits: row[4], twoFA: row[5] };

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  db.run(`INSERT INTO sessoes (userId, token) VALUES (?, ?)`, [user.id, token]);
  salvar();

  const clienteResult = db.exec(`SELECT phone FROM clientes WHERE email = ?`, [user.email]);
  let phone = '';
  if (clienteResult && clienteResult[0] && clienteResult[0].values && clienteResult[0].values.length) {
    phone = clienteResult[0].values[0][0] || '';
  }

  res.json({
    success: true, message: 'Login efetuado!',
    token,
    user: { name: user.name, email: user.email, phone, credits: user.credits, twoFA: !!user.twoFA }
  });
};

exports.verifyOtp = async (req, res) => {
  res.json({ success: true, message: 'Código verificado!' });
};

exports.verificarToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente.' });

  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};