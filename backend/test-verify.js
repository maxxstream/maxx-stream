const fs = require('fs');
const path = require('path');

function check(condition, label) {
  console.log((condition ? '  PASS' : '  FAIL') + ' - ' + label);
}

const root = path.resolve(__dirname, '..');

console.log('\n=== VERIFICACAO DO SISTEMA ===\n');

// Auth
const serverJs = fs.readFileSync('./src/server.js', 'utf8');
check(serverJs.includes("app.use('/api/clients', autenticar"), 'Auth middleware em /api/clients');
check(serverJs.includes("app.use('/api/plans', autenticar"), 'Auth middleware em /api/plans');
check(serverJs.includes("app.use('/api/billing', autenticar"), 'Auth middleware em /api/billing');
check(serverJs.includes("app.use('/api/settings', autenticar"), 'Auth middleware em /api/settings');
check(serverJs.includes("app.use('/api/profile', autenticar"), 'Auth middleware em /api/profile');
check(serverJs.includes("app.use('/api/messaging', autenticar"), 'Auth middleware em /api/messaging');
check(serverJs.includes("app.use('/api/seventv', autenticar"), 'Auth middleware em /api/seventv');
check(serverJs.includes("app.use('/api/ai', autenticar"), 'Auth middleware em /api/ai');
check(serverJs.includes("app.use('/admin/lista-clientes', autenticar"), 'Auth middleware em /admin');

// Security
check(serverJs.includes('helmet'), 'Helmet security headers');
check(serverJs.includes('rateLimit'), 'Rate limiting ativado');

// React app
check(serverJs.includes("app.use('/app'"), 'React app servido em /app');
check(serverJs.includes("sendFile(path.join(frontendDist, 'index.html')"), 'SPA catch-all route');

// SQL injection protection
const plans = fs.readFileSync('./src/routes/plans.js', 'utf8');
check(plans.includes('PLANO_CAMPOS'), 'Plans: whitelist de colunas');

const avisos = fs.readFileSync('./src/routes/avisos.js', 'utf8');
check(avisos.includes('AVISO_CAMPOS'), 'Avisos: whitelist de colunas');

// Profile security
const profile = fs.readFileSync('./src/routes/profile.js', 'utf8');
check(profile.includes('req.user.email') && !profile.includes('req.query.email'), 'Profile usa req.user.email do JWT');

// Error leak protection
const messaging = fs.readFileSync('./src/routes/messaging.js', 'utf8');
check(!messaging.includes("err.message"), 'Messaging: sem vazamento de err.message');

const aiAgent = fs.readFileSync('./src/routes/aiAgent.js', 'utf8');
check(!aiAgent.includes("err.message"), 'AI Agent: sem vazamento de err.message');

const seventv = fs.readFileSync('./src/routes/seventv.js', 'utf8');
check(!seventv.includes("err.message"), 'Seventv: sem vazamento de err.message');

// JWT
const authCtrl = fs.readFileSync('./src/controllers/authController.js', 'utf8');
check(authCtrl.includes("process.env.JWT_SECRET") && !authCtrl.includes("||"), 'JWT_SECRET: sem fallback hardcoded');

// OTP
const otp = fs.readFileSync('./src/services/otpService.js', 'utf8');
check(otp.includes('setInterval'), 'OTP: timer de cleanup ativo');

// CREDENCIAIS
check(!fs.existsSync(path.join(root, 'CREDENCIAIS.txt')), 'CREDENCIAIS.txt removido');

// .gitignore
check(fs.existsSync(path.join(root, '.gitignore')), '.gitignore existe');

// Frontend build
const feDist = path.join(root, 'frontend', 'dist', 'index.html');
check(fs.existsSync(feDist), 'Frontend React build existe');

// .env
const env = fs.readFileSync('./.env', 'utf8');
check(env.includes('JWT_SECRET='), '.env: JWT_SECRET configurado');
check(env.includes('BREVO_API_KEY='), '.env: BREVO_API_KEY configurado');
check(env.includes('EMAIL_FROM='), '.env: EMAIL_FROM configurado');
check(env.includes('ADMIN_PASSWORD='), '.env: ADMIN_PASSWORD configurado');

// Database
const dbPath = path.join(root, 'data', 'maxxstream.db');
check(fs.existsSync(dbPath), 'Banco SQLite existe');

// Admin user exists
const { initDatabase, getDb } = require('./src/database');
initDatabase().then(() => {
  const db = getDb();
  const admins = db.exec("SELECT email, name FROM usuarios WHERE email = 'admin@maxxstream.com.br'");
  check(admins && admins[0] && admins[0].values && admins[0].values.length > 0, 'Admin user existe no banco');

  const plansCount = db.exec('SELECT COUNT(*) FROM planos');
  check(plansCount && plansCount[0] && plansCount[0].values[0][0] > 0, 'Planos cadastrados');

  console.log('\n=== VERIFICACAO CONCLUIDA ===\n');
  process.exit(0);
}).catch(e => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
