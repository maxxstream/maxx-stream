# 🚀 Como Instalar e Rodar o Servidor OTP — MAXX STREAM

## ✅ Passo 1 — Instalar o Node.js

1. Acesse: **https://nodejs.org**
2. Clique em **"LTS" (versão recomendada)**
3. Baixe e instale normalmente (Next > Next > Finish)
4. Depois da instalação, **feche e reabra o PowerShell/CMD**

---

## ✅ Passo 2 — Configurar o Gmail (para enviar e-mail)

1. Acesse: **https://myaccount.google.com**
2. Vá em **Segurança → Verificação em duas etapas** (ative se não estiver ativo)
3. Volte em **Segurança → Senhas de app**
4. Em "Selecionar app" escolha **"Outro"** → Digite: `MAXX STREAM`
5. Clique em **Gerar** → Copie a senha de 16 letras (ex: `abcd efgh ijkl mnop`)

---

## ✅ Passo 3 — Configurar o Twilio (para enviar WhatsApp)

1. Crie conta gratuita em: **https://www.twilio.com/try-twilio**
2. No painel (Console), anote:
   - **Account SID** (começa com AC...)
   - **Auth Token**
3. Vá em **Messaging → Try it out → Send a WhatsApp message**
4. Siga as instruções para ativar o **Sandbox do WhatsApp**
   - Você vai enviar uma mensagem para o número do Twilio para ativar

---

## ✅ Passo 4 — Configurar o arquivo .env

Abra o arquivo `backend\.env` e preencha com seus dados:

```
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASS=abcd efgh ijkl mnop

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## ✅ Passo 5 — Instalar as dependências

Abra o **PowerShell** na pasta do projeto e rode:

```powershell
cd backend
npm install
```

---

## ✅ Passo 6 — Iniciar o servidor

```powershell
npm start
```

Você vai ver:
```
🚀 MAXX STREAM OTP Server rodando em http://localhost:3001
   Email:    seuemail@gmail.com
   Twilio:   ✅ Configurado
```

---

## ✅ Passo 7 — Abrir o site

Abra o arquivo `login.html` normalmente no navegador.  
O site vai se conectar automaticamente ao servidor em `localhost:3001`.

---

## ❓ Dúvidas Comuns

**"O WhatsApp não chegou"**  
→ Certifique-se de ter ativado o Sandbox do Twilio enviando a mensagem de ativação para o número deles.

**"O e-mail não chegou"**  
→ Verifique se usou a **Senha de App** do Google (não a senha normal da conta).  
→ Cheque a caixa de Spam.

**"Servidor offline"**  
→ Certifique-se de que o terminal com `npm start` está aberto e rodando.

---

## 🔒 Segurança

- **Nunca envie o arquivo `.env` para o GitHub** — ele contém suas senhas!
- Em produção (servidor real), coloque o servidor em um VPS com HTTPS.
