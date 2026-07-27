process.on('uncaughtException', (err) => {
  console.error('[ERRO] Exceção não capturada (servidor continua):', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[ERRO] Rejeição não tratada (servidor continua):', err.message || err);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
require('dotenv').config();

const { initDatabase, getDb, salvar } = require('./database');
const autenticar = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const messagingRoutes = require('./routes/messaging');
const plansRoutes = require('./routes/plans');
const avisosRoutes = require('./routes/avisos');
const settingsRoutes = require('./routes/settings');
const billingRoutes = require('./routes/billing');
const seventvRoutes = require('./routes/seventv');
const profileRoutes = require('./routes/profile');
const aiAgentRoutes = require('./routes/aiAgent');
const notif = require('./services/notificationService');

async function main() {
  await initDatabase();
  console.log('[DB] Banco SQLite inicializado');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/quick-login', authLimiter);

  // WebSocket
  io.on('connection', (socket) => {
    console.log('[WS] Cliente conectado:', socket.id);
    socket.on('disconnect', () => console.log('[WS] Cliente desconectou:', socket.id));
  });

  app.use((req, res, next) => { req.io = io; next(); });

  app.use('/api/auth', authRoutes);
  app.use('/api/clients', autenticar, clientRoutes);
  app.use('/api/messaging', autenticar, messagingRoutes);
  app.use('/api/plans', autenticar, plansRoutes);
  app.use('/api/avisos', autenticar, avisosRoutes);
  app.use('/api/settings', autenticar, settingsRoutes);
  app.use('/api/billing', autenticar, billingRoutes);
  app.use('/api/seventv', autenticar, seventvRoutes);
  app.use('/api/profile', autenticar, profileRoutes);
  app.use('/api/ai', autenticar, aiAgentRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'MAXX STREAM rodando com SQLite + JWT + WebSocket!' });
  });

  // Webhook
  app.post('/api/webhooks/stream', (req, res) => {
    console.log('[Webhook] Evento:', req.body?.event);
    io.emit('stream-alert', req.body);
    res.json({ received: true });
  });

  app.get('/admin/lista-clientes', autenticar, (req, res) => {
    const db = getDb();
    var clientes = db.exec('SELECT id, name, email, phone, plan, status, connections, expiration, createdAt FROM clientes ORDER BY id DESC');
    var clRows = (clientes.length && clientes[0].values.length) ? clientes[0].values : [];
    var usuarios = db.exec('SELECT email, password FROM usuarios');
    var usRows = (usuarios.length && usuarios[0].values.length) ? usuarios[0].values : [];
    var usMap = {};
    for (var u = 0; u < usRows.length; u++) { usMap[usRows[u][0]] = usRows[u][1]; }
    var planos = db.exec('SELECT name, price FROM planos WHERE active = 1');
    var precos = {};
    if (planos.length && planos[0].values.length) { planos[0].values.forEach(function(p) { precos[p[0]] = p[1]; }); }
    var html = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Cadastrados - MAXX STREAM</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#070712;color:#fff;padding:20px}h1{font-size:1.3rem;margin-bottom:4px;display:flex;align-items:center;gap:10px}sub{color:rgba(255,255,255,0.3);font-size:0.82rem}.card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-top:20px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:12px 16px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.3);font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(168,85,247,0.03)}td{padding:12px 16px;font-size:0.82rem;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.8)}tr:hover td{background:rgba(168,85,247,0.04)}.badge{padding:3px 10px;border-radius:20px;font-size:0.65rem;font-weight:600}.Ativo{background:rgba(34,197,94,0.12);color:#22c55e}.Inativo{background:rgba(239,68,68,0.12);color:#ef4444}.Trial{background:rgba(234,179,8,0.12);color:#eab308}.pass{color:rgba(255,255,255,0.2);font-size:0.7rem;font-family:monospace}.total{padding:16px;border-top:1px solid rgba(255,255,255,0.05);font-size:0.8rem;color:rgba(255,255,255,0.3)}</style></head><body><h1><i class="fas fa-database" style="color:#a855f7"></i> Cadastrados</h1><sub>Clientes registrados no sistema</sub><div class="card"><div style="overflow-x:auto"><table><thead><tr><th>#</th><th>Nome</th><th>Email</th><th>Senha</th><th>Telefone</th><th>Plano</th><th>Preco</th><th>Status</th><th>Conexoes</th><th>Vencimento</th><th>Cadastro</th></tr></thead><tbody>';
    if (clRows.length === 0) {
      html += '<tr><td colspan="11" style="text-align:center;padding:40px;color:rgba(255,255,255,0.2)">Nenhum cliente cadastrado</td></tr>';
    } else {
      for (var i = 0; i < clRows.length; i++) {
        var row = clRows[i];
        var email = row[2];
        var hasSenha = usMap[email] ? true : false;
        var sc = row[5] === 'Ativo' ? 'Ativo' : row[5] === 'Trial' ? 'Trial' : 'Inativo';
        var preco = precos[row[4]] ? 'R$ ' + parseFloat(precos[row[4]]).toFixed(2) : '-';
        var data = row[8] ? new Date(row[8]).toLocaleDateString('pt-BR') : '-';
        var senhaTd = hasSenha ? '<span class="pass"><i class="fas fa-lock" style="color:#22c55e"></i> Protegida</span>' : '<span class="pass" style="color:rgba(255,255,255,0.1)">—</span>';
        html += '<tr><td>' + (i+1) + '</td><td style="font-weight:600">' + row[1] + '</td><td>' + email + '</td><td>' + senhaTd + '</td><td>' + row[3] + '</td><td>' + row[4] + '</td><td>' + preco + '</td><td><span class="badge ' + sc + '">' + row[5] + '</span></td><td>' + row[6] + '</td><td style="font-size:0.75rem">' + (row[7] || '-') + '</td><td style="font-size:0.75rem;color:rgba(255,255,255,0.3)">' + data + '</td></tr>';
      }
    }
    html += '</tbody></table></div><div class="total">Total: ' + clRows.length + ' clientes</div></div></body></html>';
    res.type('html').send(html);
  });

  const staticPath = path.resolve(__dirname, '..', '..', 'public');
  app.use(express.static(staticPath));

  const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  app.use('/app', express.static(frontendDist));
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  const PORT = process.env.PORT || 5000;
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[ERRO] Porta ${PORT} já em uso. Tente: set PORT=5001 && node src/server.js`);
      process.exit(0);
    } else { throw err; }
  });
  server.listen(PORT, () => {
    console.log(`\n[Servidor] Rodando na porta ${PORT}`);
    console.log(`[WS] WebSocket ativo`);
    console.log(`[WEB] http://localhost:${PORT}/login.html`);
    console.log(`[WEB] http://localhost:${PORT}/cliente.html`);
    console.log(`[WEB] http://localhost:${PORT}/admin/lista-clientes\n`);
  });

  setTimeout(async () => {
    try { await notif.initWhatsApp(); } catch (e) { console.log('[WA] WhatsApp não iniciou (servidor continua):', e.message); }
  }, 2000);
}

main().catch(e => { console.error('[ERRO]', e); process.exit(1); });