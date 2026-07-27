# Manual de Privacidade e LGPD (IPTV MAXX STREAM)

Este documento estabelece as diretrizes para conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) no sistema MAXX STREAM.

---

## 🔒 Princípios de Proteção de Dados

### 1. Mascaramento de Dados (Data Masking)
Na interface administrativa, os dados de contato dos clientes devem ser parcialmente mascarados para evitar exposição indevida (ex: por funcionários ou em telas de suporte).
*   **E-mail:** Mostrar apenas os 2 primeiros caracteres do usuário e ocultar o restante até o `@` (ex: `marcos.r@gmail.com` vira `ma***@gmail.com`).
*   **Telefone:** Mostrar apenas o DDI, DDD, os 2 primeiros dígitos do número e os 4 últimos dígitos (ex: `+55 11 98888-1234` vira `+55 11 98***-1234`).

### 2. Minimização de Dados
Colete apenas o estritamente necessário para prestar o serviço:
*   Nome completo (para identificação no suporte)
*   E-mail (para envio de credenciais e notificações)
*   Telefone/WhatsApp (para suporte imediato e envio de OTP)
*   *Não coletar* CPF, endereço físico ou dados de pagamento no próprio site (os pagamentos devem ser processados externamente via gateways seguros ou Pix direto).

### 3. Consentimento Explícito
O formulário de cadastro inclui um checkbox obrigatório onde o usuário dá consentimento claro para a coleta de seus dados de contato a fim de receber o acesso e notificações sobre o plano (renovação, alertas).

### 4. Direito ao Esquecimento
O cliente tem o direito de solicitar a exclusão de seus dados. Disponibilize um botão "Excluir Conta" na área do cliente ou execute a exclusão manual no banco de dados quando solicitado.

---

## 🛠️ Boas Práticas Técnicas
*   **Armazenamento de Senhas:** Nunca salve senhas em texto puro. Sempre use criptografia de hash com **bcrypt** (fator de custo 10+).
*   **Variáveis de Ambiente:** Mantenha chaves de API (Twilio, Seventv, SendGrid) fora do código, utilizando arquivos `.env`.
*   **Logs Limpos:** Certifique-se de que os logs do servidor não registrem senhas ou tokens de autenticação em texto limpo.
