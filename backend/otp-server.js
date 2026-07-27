// ============================================================
//  MAXX STREAM — Servidor OTP (Email + WhatsApp)
//  Stack: Node.js + Express + Nodemailer + whatsapp-web.js
// ============================================================
require("dotenv").config({ path: __dirname + "/.env" });
const express    = require("express");
const nodemailer = require("nodemailer");
const https      = require("https");
const crypto     = require("crypto");
const cors       = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode     = require("qrcode-terminal");

const path       = require("path");

const app = express();
app.use(express.json());
app.use(cors({
  origin: (origin, cb) => cb(null, true), // aceita file://, localhost e qualquer origem
  credentials: true,
}));

// Serve os arquivos do site (pasta pai)
const SITE_DIR = path.join(__dirname, "..");
app.use(express.static(SITE_DIR));
app.get("/", (req, res) => res.sendFile(path.join(SITE_DIR, "index.html")));

const PORT       = process.env.PORT || 3001;
const OTP_EXPIRE = 5 * 60 * 1000; // 5 minutos
const otpStore   = new Map();

// ── Brevo API REST (sem restrição de IP) ──────────────────────
function sendEmailBrevo(to, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender:  { name: process.env.EMAIL_FROM_NAME || 'MAXX STREAM', email: process.env.EMAIL_FROM },
      to:      [{ email: to, name: toName || '' }],
      subject,
      htmlContent
    });
    const req = https.request({
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':  'application/json',
        'api-key':       process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data));
        else reject(new Error(`Brevo API erro ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Helpers ──────────────────────────────────────────────────
function gerarCodigo() {
  return String(crypto.randomInt(100000, 999999));
}

function formatarTel(tel) {
  const d = tel.replace(/\D/g, "");
  if (d.startsWith("55")) return "+" + d;
  return "+55" + d;
}

// ── WhatsApp Client (whatsapp-web.js) ───────────────────────
let waReady = false;
const waClient = new Client({
  authStrategy: new LocalAuth({ dataPath: __dirname + '/.wwebjs_auth' }),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

waClient.on('qr', (qr) => {
  console.log('\n📱 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:');
  console.log('   (Abra WhatsApp > Dispositivos Conectados > Conectar dispositivo)\n');
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  waReady = true;
  console.log('✅ WhatsApp conectado e pronto para enviar códigos!\n');
});

waClient.on('disconnected', () => {
  waReady = false;
  console.log('❌ WhatsApp desconectado. Reinicie o servidor para reconectar.');
});

waClient.initialize();

function sendWhatsApp(telefone, texto) {
  const num = telefone.replace(/\D/g, '');
  const chatId = (num.startsWith('55') ? num : '55' + num) + '@c.us';
  if (!waReady) return Promise.reject(new Error('WhatsApp ainda não está pronto.'));
  return waClient.sendMessage(chatId, texto);
}

// ── ROTA: Enviar OTP ─────────────────────────────────────────
app.post("/api/otp/enviar", async (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false, erro: "E-mail é obrigatório." });
  }

  // Gera dois códigos diferentes
  const codeWa    = gerarCodigo();
  let   codeEmail = gerarCodigo();
  while (codeEmail === codeWa) codeEmail = gerarCodigo();

  const key       = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_EXPIRE;

  // Salva no store
  otpStore.set(key, { codeWa, codeEmail, email, expiresAt });

  const erros = [];

  // ── 1. Envia pelo WhatsApp ─────────────────────────────
  const waTel = telefone || process.env.WHATSAPP_NUMBER;
  if (waTel) {
    try {
      await sendWhatsApp(waTel,
        `🔐 *MAXX STREAM — Verificação*\n\nOlá ${nome || ""}!\nSeu código de verificação é:\n\n*${codeWa}*\n\n_Válido por 5 minutos. Não compartilhe._`
      );
      console.log(`✅ WhatsApp enviado para: ${waTel}`);
    } catch (err) {
      console.error("❌ Erro WhatsApp:", err.message);
      erros.push("whatsapp");
    }
  } else {
    console.warn("⚠️ WhatsApp não configurado (número ausente)");
    erros.push("whatsapp");
  }

  // ── 2. Envia pelo Brevo API ─────────────────────────
  try {
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#070712;border-radius:20px;padding:36px;color:#fff;border:1px solid #1a1a3e">
        <div style="text-align:center;margin-bottom:28px">
          <h1 style="color:#00d2ff;font-size:24px;margin:0;font-style:italic">▶ MAXX STREAM</h1>
          <p style="color:#8b8fa8;font-size:13px;margin:4px 0 0">Verificação de identidade</p>
        </div>
        <p style="color:#ccc;font-size:15px;margin-bottom:8px">Olá, <strong style="color:#fff">${nome || 'usuário'}</strong>!</p>
        <p style="color:#8b8fa8;font-size:13px;margin-bottom:24px">Use o código abaixo para confirmar seu cadastro.</p>
        <div style="background:#0e0e22;border:2px solid #00d2ff;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="color:#8b8fa8;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px">Seu código</p>
          <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#00d2ff;font-family:monospace">${codeEmail}</div>
        </div>
        <p style="color:#8b8fa8;font-size:12px;text-align:center">⏱ Expira em <strong style="color:#fff">5 minutos</strong>. Nunca compartilhe este código.</p>
      </div>
    `;
    await sendEmailBrevo(email, nome, '🔐 Seu código de verificação — MAXX STREAM', htmlContent);
    console.log(`✅ E-mail enviado para: ${email}`);
  } catch (err) {
    console.error("❌ Erro Email:", err.message);
    erros.push("email");
  }

  if (erros.length === 2) {
    return res.status(500).json({ ok: false, erro: "Falha ao enviar WhatsApp e E-mail. Verifique as configurações no .env." });
  }

  res.json({
    ok:        true,
    avisos:    erros,
    emailMask: email.split("@")[0].substring(0, 3) + "***@" + email.split("@")[1],
    waOk:      !erros.includes("whatsapp"),
    emailOk:   !erros.includes("email"),
  });
});

// ── ROTA: Verificar OTP ──────────────────────────────────────
app.post("/api/otp/verificar", (req, res) => {
  const { email, codigoWa, codigoEmail } = req.body;

  if (!email || !codigoWa || !codigoEmail) {
    return res.status(400).json({ ok: false, erro: "E-mail e os dois códigos são obrigatórios." });
  }

  const key    = email.toLowerCase().trim();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(404).json({ ok: false, erro: "Nenhum código encontrado. Solicite um novo." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(410).json({ ok: false, erro: "Códigos expirados. Clique em reenviar." });
  }

  const inputWa    = codigoWa.replace(/\s/g, "");
  const inputEmail = codigoEmail.replace(/\s/g, "");

  // Valida código do WhatsApp
  if (inputWa !== record.codeWa) {
    return res.status(401).json({ ok: false, campo: "whatsapp", erro: "Código do WhatsApp incorreto. Verifique e tente novamente." });
  }

  // Valida código do E-mail
  if (inputEmail !== record.codeEmail) {
    return res.status(401).json({ ok: false, campo: "email", erro: "Código do E-mail incorreto. Verifique sua caixa de entrada e tente novamente." });
  }

  otpStore.delete(key);
  console.log(`✅ OTP duplo verificado: ${key}`);
  res.json({ ok: true, mensagem: "Identidade confirmada!" });
});

// ── Health check ──────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({ ok: true, servico: "MAXX STREAM OTP", uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log("\n====================================");
  console.log("🚀 MAXX STREAM OTP Server ONLINE");
  console.log(`   Porta: ${PORT}`);
  console.log(`   Brevo:    ${process.env.BREVO_USER    || "❌ Não configurado"}`);
   console.log(`   WhatsApp: ${waReady ? "✅ Conectado" : "❌ Aguardando QR Code"}`);
  console.log("\n   🌐 Acesse o site em:");
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`   👉 http://localhost:${PORT}/login.html`);
  console.log("====================================\n");
});
