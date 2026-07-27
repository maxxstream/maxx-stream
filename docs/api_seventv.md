# Guia de Integração com a API Seventv (IPTV)

Este documento descreve como funciona a sincronização e automação de créditos de IPTV com a API Seventv.

---

## 🔗 Visão Geral

A Seventv disponibiliza uma API REST para que parceiros possam gerenciar a criação de contas de clientes, renovações de planos e compra de créditos.

### 🔑 Autenticação

Para se autenticar na API Seventv, você deve passar o cabeçalho `X-API-Key` em todas as requisições:

```http
GET /api/v1/credits HTTP/1.1
Host: api.seventv.com
X-API-Key: SUA_API_KEY_AQUI
Content-Type: application/json
```

---

## 🛠️ Endpoints Principais

### 1. Consultar Saldo de Créditos
Retorna o número de créditos disponíveis na carteira do revendedor.

*   **Método:** `GET`
*   **URL:** `https://api.seventv.com/v1/reseller/credits`
*   **Resposta (200 OK):**
    ```json
    {
      "credits": 120,
      "reseller_id": "res_983274",
      "status": "active"
    }
    ```

### 2. Gerar Conta de Teste Grátis (6 horas)
Gera uma credencial temporária para o cliente testar o serviço. Desconta **1 crédito** do saldo.

*   **Método:** `POST`
*   **URL:** `https://api.seventv.com/v1/reseller/test-account`
*   **Corpo da Requisição:**
    ```json
    {
      "duration_hours": 6,
      "device_type": "smart_tv"
    }
    ```
*   **Resposta (201 Created):**
    ```json
    {
      "success": true,
      "username": "teste_98234",
      "password": "pass_983726_tmp",
      "expires_at": "2026-07-23T04:30:00Z"
    }
    ```

### 3. Criar ou Renovar Assinatura (Mensal / Trimestral / Anual)
Cria uma conta definitiva ou estende os dias de acesso de uma conta existente.

*   **Método:** `POST`
*   **URL:** `https://api.seventv.com/v1/reseller/subscriptions`
*   **Corpo da Requisição:**
    ```json
    {
      "username": "cliente_marcos",
      "plan_type": "trimestral",
      "connections": 4
    }
    ```
*   **Resposta (200 OK):**
    ```json
    {
      "success": true,
      "new_expiration_date": "2026-10-15T23:59:59Z",
      "credits_remaining": 116
    }
    ```

---

## 📢 Webhooks de Monitoramento de Transmissão

Para receber alertas de travamento ou oscilação de canais dos clientes em tempo real, configure a URL de webhook do seu backend (`https://seu-dominio.com/api/webhooks/stream`) no painel da Seventv.

Exemplo de payload recebido pelo seu webhook:

```json
{
  "event": "stream.buffering_alert",
  "timestamp": "2026-07-22T19:45:00Z",
  "data": {
    "username": "cliente_marcos",
    "channel_id": "premiere_club_hd",
    "buffering_ratio": 0.85,
    "user_ip": "186.200.12.34"
  }
}
```
Ao receber esse payload, seu backend sinaliza o alerta no painel administrativo.
