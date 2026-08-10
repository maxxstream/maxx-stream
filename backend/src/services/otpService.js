const crypto = require('crypto');
const notif = require('./notificationService');

const OTP_EXPIRE = 5 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;
const otpStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore) {
    if (now > record.expiresAt) otpStore.delete(key);
  }
}, CLEANUP_INTERVAL);

function gerarCodigo() {
  return String(crypto.randomInt(100000, 999999));
}

exports.enviarOtp = async (nome, email, telefone) => {
  const code = gerarCodigo();
  const key = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_EXPIRE;

  otpStore.set(key, { code, email, nome, expiresAt });

  const erros = [];

  // WhatsApp é opcional (best-effort). Se não estiver conectado, o login/cadastro segue normalmente.
  if (telefone) {
    try {
      await notif.sendWhatsApp(telefone,
        `🔐 *MAXX STREAM — Verificação*\n\nOlá ${nome || ''}!\nSeu código de verificação é:\n\n*${code}*\n\n_Válido por 5 minutos._`
      );
      console.log(`✅ OTP WhatsApp enviado para: ${telefone}`);
    } catch (err) {
      console.warn('⚠️ OTP WhatsApp não enviado (opcional):', err.message);
      erros.push('whatsapp');
    }
  } else {
    console.warn('⚠️ OTP WhatsApp: número ausente');
    erros.push('whatsapp');
  }

  const emailConfigurado = notif.isEmailConfigured();
  let fallbackCode = null;

  try {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#070712;border-radius:20px;padding:36px;color:#fff;border:1px solid #1a1a3e">
        <div style="text-align:center;margin-bottom:28px">
          <h1 style="color:#00d2ff;font-size:24px;margin:0;font-style:italic">▶ MAXX STREAM</h1>
          <p style="color:#8b8fa8;font-size:13px;margin:4px 0 0">Verificação de identidade</p>
        </div>
        <p style="color:#ccc;font-size:15px;margin-bottom:8px">Olá, <strong style="color:#fff">${nome || 'usuário'}</strong>!</p>
        <p style="color:#8b8fa8;font-size:13px;margin-bottom:24px">Use o código abaixo para continuar.</p>
        <div style="background:#0e0e22;border:2px solid #00d2ff;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="color:#8b8fa8;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px">Seu código</p>
          <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#00d2ff;font-family:monospace">${code}</div>
        </div>
        <p style="color:#8b8fa8;font-size:12px;text-align:center">⏱ Expira em <strong style="color:#fff">5 minutos</strong>.</p>
      </div>
    `;
    await notif.sendEmailFlex(email, nome, '🔐 Código de verificação — MAXX STREAM', html);
    console.log(`✅ OTP Email enviado para: ${email}`);
  } catch (err) {
    console.error('❌ Erro Email OTP:', err.message);
    if (!emailConfigurado) {
      // E-mail ainda não configurado (Brevo/SMTP): entrega o código via resposta para não bloquear o cliente.
      fallbackCode = code;
      console.warn('⚠️ E-mail não configurado — código entregue em modo de segurança. Configure BREVO_API_KEY ou SMTP para envio real.');
    } else {
      erros.push('email');
    }
  }

  return {
    erros,
    emailMask: email.split('@')[0].substring(0, 3) + '***@' + email.split('@')[1],
    fallbackCode
  };
};

exports.verificarOtp = (email, codigo) => {
  const key = email.toLowerCase().trim();
  const record = otpStore.get(key);

  if (!record) {
    return { ok: false, erro: 'Nenhum código encontrado. Solicite um novo.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { ok: false, erro: 'Código expirado. Solicite um novo.' };
  }

  if (codigo.replace(/\s/g, '') !== record.code) {
    return { ok: false, erro: 'Código incorreto. Verifique e tente novamente.' };
  }

  otpStore.delete(key);
  return { ok: true };
};
