const axios = require('axios');

const SEVENTV_BASE = 'https://api.seventv.com/v1/reseller';
const API_KEY = process.env.SEVENTV_API_KEY || '';
const PARTNER_ID = process.env.SEVENTV_PARTNER_ID || '';

const api = axios.create({
  baseURL: SEVENTV_BASE,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

exports.getCredits = async () => {
  if (!API_KEY) {
    return { credits: 0, reseller_id: 'não configurado', status: 'inactive' };
  }
  const { data } = await api.get('/credits');
  return data;
};

exports.generateTestAccount = async (durationHours = 6, deviceType = 'smart_tv') => {
  if (!API_KEY) {
    return {
      success: true,
      username: 'teste_' + Math.floor(Math.random() * 90000 + 10000),
      password: Math.floor(Math.random() * 900000 + 100000).toString(),
      expires_at: new Date(Date.now() + durationHours * 3600000).toISOString(),
      simulated: true,
    };
  }
  const { data } = await api.post('/test-account', {
    duration_hours: durationHours,
    device_type: deviceType,
  });
  return data;
};

exports.createSubscription = async ({ username, plan_type, connections }) => {
  if (!API_KEY) {
    return {
      success: true,
      new_expiration_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      credits_remaining: 119,
      simulated: true,
    };
  }
  const { data } = await api.post('/subscriptions', {
    username,
    plan_type,
    connections,
  });
  return data;
};