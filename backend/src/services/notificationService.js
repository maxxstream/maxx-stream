const https = require('https');
const nodemailer = require('nodemailer');
const { getDb } = require('../database');

const EMAIL_FROM = process.env.EMAIL_FROM || 'naoresponda@maxxstream.com.br';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'MAXX STREAM';

function getSetting(key, fallback = '') {
    try {
        const db = getDb();
        if (!db) return fallback;
        const stmt = db.prepare(`SELECT value FROM configuracoes WHERE key = ?`);
        stmt.bind([key]);
        let v = null;
        while (stmt.step()) { v = stmt.getAsObject().value; }
        stmt.free();
        return (v === null || v === undefined || v === '') ? fallback : v;
    } catch (e) { /* banco ainda não inicializado */ }
    return fallback;
}

exports.isEmailConfigured = () => {
    const resend = process.env.RESEND_API_KEY || '';
    if (resend) return true;
    const brevo = getSetting('brevo_api_key', process.env.BREVO_API_KEY || '');
    if (brevo) return true;
    const host = getSetting('smtp_host', process.env.SMTP_HOST || '');
    const user = getSetting('smtp_user', process.env.SMTP_USER || '');
    const pass = getSetting('smtp_pass', process.env.SMTP_PASS || '');
    return !!(host && user && pass);
};

// Resend (resend.com) — requer domínio verificado em resend.com/domains
// Só funciona se RESEND_FROM_EMAIL estiver configurado (ex: naoresponda@seudominio.com.br)
exports.sendEmailResend = (to, toName, subject, htmlContent) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.RESEND_API_KEY || '';
        if (!apiKey) return reject(new Error('RESEND_API_KEY nao configurada'));
        // onboarding@resend.dev só envia para o email do próprio dono da conta Resend
        // Para clientes, é OBRIGATÓRIO ter domínio verificado e definir RESEND_FROM_EMAIL
        const fromEmail = process.env.RESEND_FROM_EMAIL || '';
        if (!fromEmail) return reject(new Error('RESEND_FROM_EMAIL nao configurado (dominio verificado necessario)'));
        const fromName = getSetting('email_from_name', EMAIL_FROM_NAME);
        const body = JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject,
            html: htmlContent
        });
        const req = https.request({
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                if (res.statusCode < 300) resolve(JSON.parse(d));
                else reject(new Error('Resend erro ' + res.statusCode + (d ? ' - ' + d.slice(0, 200) : '')));
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

exports.sendEmailBrevo = (to, toName, subject, htmlContent) => {
    return new Promise((resolve, reject) => {
        const apiKey = getSetting('brevo_api_key', process.env.BREVO_API_KEY || '');
        if (!apiKey) return reject(new Error('BREVO_API_KEY não configurada'));
        const from = getSetting('email_from', EMAIL_FROM);
        const fromName = getSetting('email_from_name', EMAIL_FROM_NAME);
        const body = JSON.stringify({ sender: { name: fromName, email: from }, to: [{ email: to, name: toName || '' }], subject, htmlContent });
        const req = https.request({ hostname: 'api.brevo.com', path: '/v3/smtp/email', method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': apiKey, 'Content-Length': Buffer.byteLength(body) } }, (res) => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => { if (res.statusCode < 300) resolve(JSON.parse(d)); else reject(new Error('Brevo erro ' + res.statusCode + (d ? ' - ' + d.slice(0, 200) : ''))) });
        }); req.on('error', reject); req.write(body); req.end();
    });
};

exports.sendEmailSmtp = (to, toName, subject, htmlContent) => {
    return new Promise((resolve, reject) => {
        const host = getSetting('smtp_host', process.env.SMTP_HOST || '');
        if (!host) return reject(new Error('SMTP não configurado (smtp_host)'));
        const port = parseInt(getSetting('smtp_port', process.env.SMTP_PORT || '587'), 10);
        const secure = getSetting('smtp_secure', process.env.SMTP_SECURE || 'false') === 'true';
        const user = getSetting('smtp_user', process.env.SMTP_USER || '');
        const pass = getSetting('smtp_pass', process.env.SMTP_PASS || '');
        if (!user || !pass) return reject(new Error('Credenciais SMTP ausentes (smtp_user/smtp_pass)'));
        const from = getSetting('email_from', EMAIL_FROM);
        const fromName = getSetting('email_from_name', EMAIL_FROM_NAME);

        const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
        transporter.sendMail({ from: `"${fromName}" <${from}>`, to, subject, html: htmlContent }, (err, info) => {
            transporter.close();
            if (err) reject(new Error('SMTP: ' + (err.message || 'erro')));
            else resolve(info);
        });
    });
};

// Tenta Brevo -> SMTP -> Resend (Resend só funciona com domínio verificado)
exports.sendEmailFlex = async (to, toName, subject, htmlContent) => {
    const erros = [];
    try {
        return await exports.sendEmailBrevo(to, toName, subject, htmlContent);
    } catch (e) { erros.push('Brevo: ' + e.message); }
    try {
        return await exports.sendEmailSmtp(to, toName, subject, htmlContent);
    } catch (e) { erros.push('SMTP: ' + e.message); }
    try {
        return await exports.sendEmailResend(to, toName, subject, htmlContent);
    } catch (e) { erros.push('Resend: ' + e.message); }
    throw new Error('E-mail indisponivel (' + erros.join(' | ') + ')');
};

exports.sendEmail = async (to, toName, assunto, mensagem) => {
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#070712;border-radius:20px;padding:36px;color:#fff;border:1px solid #1a1a3e"><div style="text-align:center;margin-bottom:28px"><h1 style="color:#00d2ff;font-size:24px;margin:0;font-style:italic">▶ MAXX STREAM</h1><p style="color:#8b8fa8;font-size:13px;margin:4px 0 0">Comunicação automática</p></div><p style="color:#ccc;font-size:15px;margin-bottom:8px">Olá, <strong style="color:#fff">${toName || 'cliente'}</strong>!</p><div style="background:#0e0e22;border-radius:16px;padding:24px;margin-bottom:24px;color:#d1d5db;font-size:14px;line-height:1.6">${mensagem.replace(/\n/g, '<br>')}</div><p style="color:#8b8fa8;font-size:12px;text-align:center">Equipe <strong style="color:#00d2ff">MAXX STREAM</strong></p></div>`;
    return exports.sendEmailFlex(to, toName, assunto, html);
};

let waClient = null;
let waReady = false;
let waQr = '';

let waInitialized = false;

exports.initWhatsApp = async () => {
    if (waInitialized) return;
    waInitialized = true;
    try {
        const { Client, LocalAuth } = require('whatsapp-web.js');
        const qrcode = require('qrcode-terminal');
        const puppeteerOpts = { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] };
        const chromiumPath = process.env.CHROMIUM_PATH;
        if (chromiumPath) puppeteerOpts.executablePath = chromiumPath;
        const client = new Client({
            authStrategy: new LocalAuth({ dataPath: __dirname + '/.wwebjs_auth' }),
            puppeteer: puppeteerOpts
        });
        client.on('qr', (qr) => { waReady = 'qr'; waQr = qr; console.log('\n📱 QR CODE WHATSAPP:'); qrcode.generate(qr, { small: true }); });
        client.on('ready', () => { waReady = true; console.log('✅ WhatsApp conectado!'); });
        client.on('disconnected', async () => {
            waReady = false;
            console.log('❌ WhatsApp desconectado. Tentando reconectar em 30s...');
            setTimeout(() => { waInitialized = false; exports.initWhatsApp(); }, 30000);
        });
        client.on('auth_failure', (msg) => {
            console.log('❌ WhatsApp falha de autenticação:', msg);
            waReady = false;
        });
        try {
            await client.initialize();
            waClient = client;
        } catch (initErr) {
            console.log('[WA] Erro ao inicializar WhatsApp (servidor continua funcionando):', initErr.message);
            waReady = false;
            waInitialized = false;
        }
    } catch (e) {
        console.log('[WA] WhatsApp indisponível (servidor continua funcionando):', e.message);
        waReady = false;
        waInitialized = false;
    }
};

exports.sendWhatsApp = async (telefone, mensagem) => {
    if (!waClient || waReady !== true) throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    const num = telefone.replace(/\D/g, '');
    const chatId = (num.startsWith('55') ? num : '55' + num) + '@c.us';
    await waClient.sendMessage(chatId, mensagem);
    return true;
};

exports.getWAStatus = () => ({ ready: waReady, qr: waQr });

const agendamentos = [];

exports.agendarMensagem = (telefone, mensagem, dataAgendamento, clienteNome) => {
    const job = { id: Date.now(), telefone, mensagem, clienteNome, dataAgendamento, status: 'agendado', criadoEm: new Date().toISOString() };
    agendamentos.push(job);
    const delay = new Date(dataAgendamento).getTime() - Date.now();
    if (delay > 0) {
        setTimeout(async () => {
            try { await exports.sendWhatsApp(telefone, mensagem); job.status = 'enviado'; } catch (e) { job.status = 'falha'; }
        }, delay);
    }
    return job;
};

exports.getAgendamentos = () => agendamentos;

exports.cancelarAgendamento = (id) => {
    const idx = agendamentos.findIndex(a => a.id === id);
    if (idx >= 0) { agendamentos[idx].status = 'cancelado'; return true; }
    return false;
};