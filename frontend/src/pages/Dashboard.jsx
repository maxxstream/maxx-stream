import React, { useState, useEffect } from 'react';

const API = window.location.origin;

export default function Dashboard({ navigate }) {
  const [credits, setCredits] = useState(0);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, ativos: 0, faturamento: 0 });
  const [seventvStatus, setSeventvStatus] = useState('checking');
  const [testUser, setTestUser] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [showTestResult, setShowTestResult] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('login');
      return;
    }
    carregarDados();
  }, []);

  function getToken() {
    return localStorage.getItem('token');
  }

  async function apiFetch(path, opts = {}) {
    const token = getToken();
    if (!token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('login');
      throw new Error('Sessão expirada');
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...opts.headers
    };
    const r = await fetch(API + path, { ...opts, headers });
    if (r.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('login');
      throw new Error('Sessão expirada');
    }
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Erro');
    return d;
  }

  async function carregarDados() {
    setError('');
    try {
      const [clientsData, statsData] = await Promise.all([
        apiFetch('/api/clients'),
        apiFetch('/api/clients/stats')
      ]);
      setClients(clientsData.clients || []);
      setCredits(clientsData.credits || 0);
      setStats(statsData.stats || { total: 0, ativos: 0, faturamento: 0 });
    } catch (e) {
      if (e.message !== 'Sessão expirada') setError('Erro ao carregar dados: ' + e.message);
    }
    try {
      const sv = await apiFetch('/api/seventv/check-connection');
      setSeventvStatus(sv.connected ? 'connected' : 'disconnected');
    } catch (e) {
      if (e.message !== 'Sessão expirada') setSeventvStatus('error');
    }
  }

  const activeCount = clients.filter(c => c.status === 'Ativo').length;
  const expiredCount = clients.filter(c => c.status === 'Vencido').length;

  const handleGenerateTest = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const data = await apiFetch('/api/clients/generate-test', { method: 'POST' });
      setTestUser(data.user);
      setTestPassword(data.pass);
      setShowTestResult(true);
      setCredits(data.creditsRemaining);
    } catch (e) {
      if (e.message !== 'Sessão expirada') setError('Erro ao gerar teste: ' + e.message);
    }
    setGenerating(false);
  };

  const [notifyMsg, setNotifyMsg] = useState('');

  const handleSendNotification = async (clientName, clientId, type) => {
    setNotifyMsg('');
    try {
      await apiFetch('/api/clients/' + clientId + '/notify', {
        method: 'POST',
        body: JSON.stringify({ type: type === 'WhatsApp' ? 'whatsapp' : 'email', message: '' })
      });
      setNotifyMsg('Notificação enviada para ' + clientName + ' via ' + type + '!');
      setTimeout(() => setNotifyMsg(''), 4000);
    } catch (e) {
      setNotifyMsg('Erro: ' + e.message);
      setTimeout(() => setNotifyMsg(''), 4000);
    }
  };

  return (
    <div className="w-full max-w-6xl glass-card rounded-3xl p-6 md:p-8 shadow-2xl relative border border-white/10 text-left">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent"></div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}
      {notifyMsg && (
        <div className={`border rounded-xl text-sm mb-6 text-center p-3 ${
          notifyMsg.startsWith('Erro') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          <i className={`fas ${notifyMsg.startsWith('Erro') ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-2`}></i> {notifyMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <i className="fas fa-play-circle text-[#00d2ff] text-2xl"></i>
            <span className="text-xl font-bold tracking-tighter uppercase italic">
              MAXX <span className="text-[#00d2ff]">STREAM</span>
            </span>
            <span className="bg-[#00d2ff]/10 text-[#00d2ff] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#00d2ff]/20">
              Admin
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Painel Administrativo IPTV</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`bg-white/5 border px-4 py-2 rounded-xl text-sm ${seventvStatus === 'connected' ? 'border-green-500/20' : 'border-white/10'}`}>
            🔌 Sincronização Seventv: <strong className={seventvStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {seventvStatus === 'connected' ? 'Ativa' : seventvStatus === 'checking' ? 'Verificando...' : 'Inativa'}
            </strong>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('login');
            }}
            className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 hover:border-red-500/30 px-4 py-2 rounded-xl text-sm transition"
          >
            Sair <i className="fas fa-sign-out-alt ml-1.5"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Faturamento Estimado</p>
          <p className="text-2xl font-bold text-white mt-2">R$ {stats.faturamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <i className="fas fa-wallet text-white/5 text-6xl absolute -bottom-2 -right-2"></i>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clientes Ativos</p>
          <p className="text-2xl font-bold text-white mt-2">{activeCount} / {clients.length}</p>
          <div className="text-xs text-gray-400 mt-1">
            {expiredCount} vencido(s) pendente(s)
          </div>
          <i className="fas fa-users text-white/5 text-6xl absolute -bottom-2 -right-2"></i>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Satisfação do Cliente</p>
          <p className="text-2xl font-bold text-[#00d2ff] mt-2">{clients.length > 0 ? Math.round((activeCount / clients.length) * 100) : 0}%</p>
          <div className="text-xs text-gray-400 mt-1">
            Baseado em clientes ativos
          </div>
          <i className="fas fa-smile text-white/5 text-6xl absolute -bottom-2 -right-2"></i>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Créditos Seventv</p>
          <p className="text-2xl font-bold text-orange-400 mt-2">{credits} un</p>
          <a href="/admin-dashboard.html" className="text-xs text-[#00d2ff] hover:underline font-semibold mt-1 block">
            Comprar mais créditos
          </a>
          <i className="fas fa-coins text-white/5 text-6xl absolute -bottom-2 -right-2"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Clientes e Assinaturas (LGPD)</h3>
            <span className="text-xs text-gray-500">*Dados pessoais mascarados parcialmente</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/15 text-gray-400 font-bold uppercase tracking-wider text-xs">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Contato</th>
                  <th className="pb-3">Plano</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Transmissão</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-white/2 transition-all">
                    <td className="py-3 font-semibold">{client.name}</td>
                    <td className="py-3 text-xs text-gray-400">
                      <div>{client.email}</div>
                      <div>{client.phone}</div>
                    </td>
                    <td className="py-3">{client.plan}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        client.status === 'Ativo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        client.status === 'Vencido' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${client.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {client.status === 'Ativo' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSendNotification(client.name, client.id, 'WhatsApp')}
                          title="Cobrar via WhatsApp"
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-1.5 rounded-lg border border-green-500/20"
                        >
                          <i className="fab fa-whatsapp"></i>
                        </button>
                        <button
                          onClick={() => handleSendNotification(client.name, client.id, 'E-mail')}
                          title="Cobrar via E-mail"
                          className="bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 text-[#00d2ff] p-1.5 rounded-lg border border-[#00d2ff]/20"
                        >
                          <i className="fas fa-envelope"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4">Gerador de Teste Temporário</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Gere um usuário e senha temporários para clientes em teste de 6 horas. Desconta 1 crédito de sua carteira Seventv.
            </p>

            {showTestResult ? (
              <div className="bg-[#00d2ff]/10 border border-[#00d2ff]/30 p-4 rounded-xl space-y-3 mb-6 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Usuário</span>
                  <span className="font-mono font-bold text-white text-base">{testUser}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Senha</span>
                  <span className="font-mono font-bold text-white text-base">{testPassword}</span>
                </div>
                <div className="text-[10px] text-gray-400 italic">
                  *Válido por 6 horas a partir de agora.
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/20 p-8 rounded-xl text-center text-gray-500 text-sm mb-6">
                Clique no botão abaixo para gerar
              </div>
            )}
          </div>

          <div className="space-y-3">
            {showTestResult && (
              <button
                onClick={() => setShowTestResult(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider"
              >
                Gerar Novo
              </button>
            )}
            <button
              onClick={handleGenerateTest}
              disabled={generating || credits <= 0}
              className={`w-full ${generating || credits <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#007bff] hover:bg-[#00d2ff]'} text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] uppercase text-xs tracking-wider`}
            >
              {generating ? 'Gerando...' : credits <= 0 ? 'Sem Créditos' : 'Criar Teste Grátis'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-desktop text-red-500 animate-pulse"></i> Monitoramento de Status ao Vivo
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Sinaliza automaticamente em tempo real caso algum cliente sofra com bufferings constantes ou perda de sinal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Servidor Central SP</span>
            <span className="text-xs text-green-400 font-bold uppercase tracking-widest">Estável 99%</span>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Servidor Backup RJ</span>
            <span className="text-xs text-green-400 font-bold uppercase tracking-widest">Estável 99%</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Canal Premiere Club</span>
            <span className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Alerta de Oscilação</span>
          </div>
        </div>
      </div>
    </div>
  );
}
