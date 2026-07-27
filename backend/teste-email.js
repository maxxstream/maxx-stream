require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('BREVO_USER:', process.env.BREVO_USER);
console.log('BREVO_PASS:', process.env.BREVO_PASS ? process.env.BREVO_PASS.substring(0, 20) + '...' : 'NAO DEFINIDO');

const t = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  },
  debug: true,
  logger: true
});

t.verify((error, success) => {
  if (error) {
    console.log('ERRO na verificacao:', error.message);
  } else {
    console.log('Conexao SMTP OK! Enviando e-mail...');
    t.sendMail({
      from: '"MAXX STREAM" <' + process.env.EMAIL_FROM + '>',
      to: process.env.BREVO_USER,
      subject: 'Teste MAXX STREAM',
      text: 'E-mail de teste funcionando!'
    }).then(() => console.log('E-mail enviado!'))
      .catch(e => console.log('Erro ao enviar:', e.message));
  }
});
