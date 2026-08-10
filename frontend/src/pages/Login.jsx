import React, { useState } from 'react';

const API = window.location.origin + '/api';

export default function Login({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailMask, setEmailMask] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const r = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao logar');

      if (data.requireOtp) {
        setEmailMask(data.emailMask);
        if (data.fallbackCode) {
          setOtpCode(data.fallbackCode);
          setOtpInfo('Modo de segurança: envio de e-mail não configurado. Seu código é ' + data.fallbackCode);
        } else {
          setOtpInfo('');
        }
        setShowOtp(true);
        setSuccess('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode) { setError('Digite o código de verificação.'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await fetch(API + '/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: otpCode })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Código inválido');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess('Login efetuado com sucesso! Redirecionando...');
      setTimeout(() => navigate('dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="w-full max-w-[420px] glass-card rounded-3xl p-8 shadow-2xl relative border border-white/10">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent"></div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <i className="fas fa-play-circle text-[#00d2ff] text-3xl"></i>
            <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">
              MAXX <span className="text-[#00d2ff]">STREAM</span>
            </span>
          </div>
          <h2 className="text-lg text-gray-400 font-light">Verificação em duas etapas</h2>
        </div>

        <p className="text-gray-400 text-sm text-center mb-6">
          Enviamos um código de verificação para <strong className="text-white">{emailMask}</strong> e também para seu WhatsApp.
        </p>

        {otpInfo && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 p-3 rounded-xl text-sm mb-6 text-center">
            <i className="fas fa-info-circle mr-2"></i> {otpInfo}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6 text-center animate-pulse">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleOtpVerify} className="space-y-6">
          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Código de Verificação</label>
            <input
              type="text"
              maxLength="6"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="glass-input w-full text-center text-2xl tracking-[0.5em] py-4 rounded-xl"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007bff] hover:bg-[#00d2ff] text-white font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar Código'}
          </button>
          <button
            type="button"
            onClick={() => { setShowOtp(false); setOtpCode(''); setError(''); }}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider"
          >
            Voltar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] glass-card rounded-3xl p-8 shadow-2xl relative border border-white/10">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent"></div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <i className="fas fa-play-circle text-[#00d2ff] text-3xl"></i>
          <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">
            MAXX <span className="text-[#00d2ff]">STREAM</span>
          </span>
        </div>
        <h2 className="text-lg text-gray-400 font-light">Garanta sua diversão aqui com todos os canais</h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6 text-center animate-pulse">
          <i className="fas fa-exclamation-triangle mr-2"></i> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm mb-6 text-center">
          <i className="fas fa-check-circle mr-2"></i> {success}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">E-mail</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
              <i className="fas fa-envelope"></i>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm"
              required
            />
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Senha</label>
            <a href="#" className="text-xs text-[#00d2ff] hover:underline">Esqueceu?</a>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
              <i className="fas fa-lock"></i>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="glass-input w-full pl-11 pr-12 py-3 rounded-xl text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
            >
              <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#007bff] hover:bg-[#00d2ff] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-[#00d2ff]/20 transition-all uppercase tracking-wider text-sm hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Entrar no Painel'}
        </button>
      </form>

      <div className="text-center mt-8 pt-6 border-t border-white/5">
        <p className="text-sm text-gray-400">
          Não tem uma conta ativa?{' '}
          <button
            onClick={() => navigate('register')}
            className="text-[#00d2ff] font-bold hover:underline"
          >
            Cadastre-se aqui
          </button>
        </p>
      </div>
    </div>
  );
}
