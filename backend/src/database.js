const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'maxxstream.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    credits INTEGER DEFAULT 0,
    twoFA INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan TEXT DEFAULT 'Mensal',
    status TEXT DEFAULT 'Ativo',
    connections INTEGER DEFAULT 2,
    expiration TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    type TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    message TEXT NOT NULL,
    direction TEXT DEFAULT 'enviada',
    timestamp TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    token TEXT UNIQUE NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS planos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    price REAL NOT NULL,
    days INTEGER NOT NULL,
    connections INTEGER DEFAULT 2,
    description TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS avisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS configuracoes (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // Planos padrão
  const planos = db.exec(`SELECT COUNT(*) as c FROM planos`);
  if (!planos[0] || planos[0].values[0][0] === 0) {
    db.run(`INSERT INTO planos (name, price, days, connections, description) VALUES ('Mensal', 21, 30, 2, '40% OFF — Melhor custo-benefício')`);
    db.run(`INSERT INTO planos (name, price, days, connections, description) VALUES ('Anual', 280, 365, 5, 'O plano mais vantajoso')`);
    db.run(`INSERT INTO planos (name, price, days, connections, description) VALUES ('Trial', 0, 0, 1, 'Teste grátis')`);
  }

  // Config padrão
  const cfg = db.exec(`SELECT COUNT(*) as c FROM configuracoes`);
  if (!cfg[0] || cfg[0].values[0][0] === 0) {
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('seventv_api_key', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('seventv_partner_id', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('whatsapp_number', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('brevo_api_key', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('smtp_host', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('smtp_port', '587')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('smtp_secure', 'false')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('smtp_user', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('smtp_pass', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('email_from', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('email_from_name', 'MAXX STREAM')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('site_name', 'MAXX STREAM')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('gemini_api_key', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('ai_training', '')`);
    db.run(`INSERT INTO configuracoes (key, value) VALUES ('ai_auto_respond', 'false')`);
  }

  // Admin padrão
  const admin = db.exec(`SELECT id FROM usuarios WHERE email = ?`, ['admin@maxxstream.com.br']);
  if (!admin[0] || !admin[0].values || admin[0].values.length === 0) {
    const adminPass = process.env.ADMIN_PASSWORD || 'Maxx@Admin2026';
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(adminPass, 10);
    db.run(`INSERT INTO usuarios (name, email, password, credits) VALUES (?, ?, ?, ?)`, ['Administrador MAXX', 'admin@maxxstream.com.br', hash, 1240]);
    console.log('[DB] Admin criado');
  }

  // Não insere clientes falsos

  salvar();
  return db;
}

function salvar() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() { return db; }

module.exports = { initDatabase, getDb, salvar };