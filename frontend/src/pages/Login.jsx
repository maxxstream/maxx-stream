import React, { useState, useEffect, useRef } from 'react';

const API = window.location.origin + '/api';

// Componente de campo OTP individual
function OtpInputGroup({ value, onChange }) {
  const inputs = useRef([]);
  const digits = (value || '').padEnd(6, '').split('').slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const arr = digits.map(d => d === ' ' ? '' : d);
      if (arr[i]) {
        arr[i] = '';
        onChange(arr.join(''));
      } else if (i > 0) {
        arr[i - 1] = '';
        onChange(arr.join(''));
        inputs.current[i - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputs.current[i - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return; }
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const arr = digits.map(d => d === ' ' ? '' : d);
    // Suporte a colar
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6);
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    arr[i] = raw[0];
    onChange(arr.join(''));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] && digits[i] !== ' ' ? digits[i] : ''}
          onKeyDown={e => handleKey(i, e)}
          onChange={e => handleChange(i, e)}
          className="otp-digit"
          autoComplete="off"
        />
      ))}
    </div>
  );
}

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    setError(''); setLoading(true);
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
        setOtpInfo(data.fallbackCode
          ? 'E-mail não configurado. Seu código temporário: ' + data.fallbackCode
          : '');
        setShowOtp(true);
        setOtpCode('');
        setResendCooldown(60);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (otpCode.replace(/\s/g, '').length < 6) { setError('Digite o código de 6 dígitos.'); return; }
    setError(''); setLoading(true);
    try {
      const r = await fetch(API + '/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: otpCode.replace(/\s/g, '') })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Código inválido');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess('Verificado! Entrando no painel...');
      setTimeout(() => navigate('dashboard'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(''); setLoading(true);
    try {
      const r = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao reenviar');
      setResendCooldown(60);
      setOtpCode('');
      setOtpInfo(data.fallbackCode ? 'Código: ' + data.fallbackCode : '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── TELA OTP ──
  if (showOtp) {
    return (
      <div className={`login-card ${mounted ? 'login-card--visible' : ''}`}>
        <div className="login-card__glow-top" />
        <div className="login-card__glow-bottom" />

        <div className="login-logo">
          <div className="login-logo__icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <circle cx="20" cy="20" r="20" fill="url(#lg1)" />
              <polygon points="15,12 15,28 30,20" fill="white" />
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#00d2ff" />
                  <stop offset="1" stopColor="#007bff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="login-logo__text">MAXX <span className="login-logo__accent">STREAM</span></span>
        </div>

        <div className="login-otp-icon">
          <svg viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="24" fill="rgba(0,210,255,0.1)" />
            <path d="M24 14a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16zm0 3a1.5 1.5 0 011.5 1.5v4l2.7 1.56a1.5 1.5 0 01-1.5 2.6l-3.5-2A1.5 1.5 0 0122.5 26v-5.5A1.5 1.5 0 0124 19z" fill="#00d2ff"/>
          </svg>
        </div>

        <h2 className="login-otp-title">Verificação em duas etapas</h2>
        <p className="login-otp-desc">
          Enviamos um código para <strong className="text-white">{emailMask}</strong>
          {' '}e para o seu WhatsApp cadastrado.
        </p>

        {otpInfo && (
          <div className="login-alert login-alert--info">
            <i className="fas fa-info-circle" /> {otpInfo}
          </div>
        )}
        {error && (
          <div className="login-alert login-alert--error">
            <i className="fas fa-exclamation-triangle" /> {error}
          </div>
        )}
        {success && (
          <div className="login-alert login-alert--success">
            <i className="fas fa-check-circle" /> {success}
          </div>
        )}

        <form onSubmit={handleOtpVerify} className="login-form" style={{marginTop: '24px'}}>
          <div style={{ marginBottom: '28px' }}>
            <label className="login-label">Código de 6 dígitos</label>
            <OtpInputGroup value={otpCode} onChange={setOtpCode} />
          </div>

          <button type="submit" disabled={loading || otpCode.replace(/\s/g,'').length < 6} className="login-btn login-btn--primary">
            {loading
              ? <><i className="fas fa-spinner fa-spin" /> Verificando...</>
              : <><i className="fas fa-shield-check" /> Confirmar Acesso</>
            }
          </button>

          <div className="login-otp-resend">
            {resendCooldown > 0
              ? <span>Reenviar código em <strong className="text-cyan-400">{resendCooldown}s</strong></span>
              : <button type="button" onClick={handleResend} className="login-link">
                  <i className="fas fa-redo" /> Reenviar código
                </button>
            }
          </div>

          <button type="button" onClick={() => { setShowOtp(false); setOtpCode(''); setError(''); }} className="login-btn login-btn--ghost">
            <i className="fas fa-arrow-left" /> Voltar ao Login
          </button>
        </form>
      </div>
    );
  }

  // ── TELA LOGIN ──
  return (
    <div className={`login-card ${mounted ? 'login-card--visible' : ''}`}>
      <div className="login-card__glow-top" />
      <div className="login-card__glow-bottom" />

      {/* Logo */}
      <div className="login-logo">
        <div className="login-logo__icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
            <circle cx="20" cy="20" r="20" fill="url(#lg2)" />
            <polygon points="15,12 15,28 30,20" fill="white" />
            <defs>
              <linearGradient id="lg2" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#00d2ff" />
                <stop offset="1" stopColor="#007bff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="login-logo__text">MAXX <span className="login-logo__accent">STREAM</span></span>
      </div>

      <p className="login-tagline">Acesse seu painel de gerenciamento</p>

      {/* Badges de segurança */}
      <div className="login-badges">
        <span className="login-badge"><i className="fas fa-shield-alt" /> SSL Seguro</span>
        <span className="login-badge"><i className="fas fa-lock" /> 2FA Ativo</span>
        <span className="login-badge login-badge--whatsapp"><i className="fab fa-whatsapp" /> WhatsApp OTP</span>
      </div>

      {error && (
        <div className="login-alert login-alert--error">
          <i className="fas fa-exclamation-triangle" /> {error}
        </div>
      )}
      {success && (
        <div className="login-alert login-alert--success">
          <i className="fas fa-check-circle" /> {success}
        </div>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <div className="login-field">
          <label className="login-label">E-mail</label>
          <div className="login-input-wrap">
            <span className="login-input-icon"><i className="fas fa-envelope" /></span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="login-input"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="login-field">
          <div className="login-field__header">
            <label className="login-label">Senha</label>
            <button
              type="button"
              onClick={() => navigate('forgot')}
              className="login-link"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="login-input-wrap">
            <span className="login-input-icon"><i className="fas fa-lock" /></span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input login-input--has-end"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="login-input-toggle"
            >
              <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn login-btn--primary login-btn--glow">
          {loading
            ? <><i className="fas fa-spinner fa-spin" /> Autenticando...</>
            : <><i className="fas fa-sign-in-alt" /> Entrar no Painel</>
          }
        </button>
      </form>

      <div className="login-divider">
        <span>Novo por aqui?</span>
      </div>

      <button onClick={() => navigate('register')} className="login-btn login-btn--outline">
        <i className="fas fa-user-plus" /> Criar minha conta
      </button>

      <p className="login-footer">
        <i className="fas fa-shield-check" /> Ambiente protegido · Dados criptografados
      </p>
    </div>
  );
}
