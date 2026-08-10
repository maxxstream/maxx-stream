# Guia de Configuração e Deploy (MAXX STREAM)

Este guia orienta na instalação das dependências, configuração do ambiente e deploy do sistema completo.

---

## 💻 1. Preparação do Ambiente Local

Como sua máquina ainda não possui o Node.js instalado, siga os passos abaixo:

1.  **Instalar o Node.js:**
    *   Acesse [nodejs.org](https://nodejs.org/) e faça o download da versão **LTS** (Recomendada para a maioria dos usuários).
    *   Execute o instalador e avance todas as etapas padrão.
    *   Abra um novo terminal (PowerShell ou CMD) e confirme a instalação executando:
        ```bash
        node -v
        npm -v
        ```

2.  **Configurar Variáveis de Ambiente:**
    *   No diretório `/backend/`, copie o arquivo `.env.example` e renomeie-o para `.env`.
    *   Preencha as chaves com seus dados reais do banco de dados, Twilio, SendGrid e Seventv.

---

## 🛠️ 2. Executando o Projeto Localmente

### Passo A: Iniciar o Backend
Abra um terminal na pasta `/backend/`:
```bash
npm install
npm run dev
```
O servidor Express iniciará na porta `5000`.

### Passo B: Iniciar o Frontend (React)
Abra outro terminal na pasta `/frontend/`:
```bash
npm install
npm run dev
```
O Vite iniciará o servidor de desenvolvimento na porta `3000`. Acesse `http://localhost:3000` para testar.

---

## ☁️ 3. Guia de Deploy (Colocar o Site no Ar)

### Frontend (Hospedagem Gratuita e Rápida)
Recomendamos a **Vercel** ou **Netlify**:
1.  Crie uma conta gratuita na [Vercel](https://vercel.com).
2.  Instale a CLI da Vercel globalmente ou conecte seu repositório do GitHub.
3.  Para publicar a partir da pasta `/frontend/`, basta rodar:
    ```bash
    vercel
    ```
4.  O site público com a dashboard estará online com certificado SSL (HTTPS) gratuito e automático.

### Backend (Hospedagem da API)
Recomendamos a **Railway**, **Render** ou **Heroku**:
1.  Crie uma conta no [Railway.app](https://railway.app) ou [Render.com](https://render.com).
2.  Crie um novo projeto e aponte para a pasta `/backend/` do seu repositório.
3.  Configure as variáveis de ambiente (as mesmas definidas no `.env`) diretamente no painel de controle do Railway/Render.
4.  A API estará online e pronta para responder às requisições do frontend.

---

## 📧 4. Configurar o Envio do Código de Verificação (Obrigatório)

O cadastro e o login de clientes dependem do envio do código por **e-mail ou WhatsApp**. Sem isso o cliente **não recebe o código** e não consegue entrar.

Configure **uma** das opções de e-mail nas variáveis de ambiente do Railway/Render:

### Opção A — Brevo (recomendada, mais fácil)
1. Crie uma conta gratuita em [brevo.com](https://www.brevo.com).
2. Acesse **SMTP & API → API Keys** e crie uma chave (`xkeysib-...`).
3. Em **Sender Authentication** confirme o domínio/e-mail de envio.
4. No painel da hospedagem, defina:
   ```
   BREVO_API_KEY=<sua chave>
   EMAIL_FROM=suportemaxxstream@gmail.com
   EMAIL_FROM_NAME=MAXX STREAM
   ```

### Opção B — SMTP (qualquer provedor de e-mail)
Use um SMTP válido (Hostinger, Gmail com senha de app, Zoho, etc.). No painel da hospedagem, defina:
   ```
   SMTP_HOST=smtp.seuprovedor.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu@email.com
   SMTP_PASS=sua-senha-smtp
   EMAIL_FROM=seu@email.com
   EMAIL_FROM_NAME=MAXX STREAM
   ```

> 💡 O sistema tenta **Brevo primeiro** e, se falhar, usa o **SMTP**. Você também pode configurar essas chaves pela API de configurações (`PUT /api/settings`) sem precisar fazer deploy novo.
>
> ⚠️ O WhatsApp (WhatsApp Web) **não funciona de forma confiável em servidores na nuvem** (exige escanear QR Code). Por isso, use o e-mail como forma principal de envio do código.
