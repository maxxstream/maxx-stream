import React, { useState, useEffect } from 'react';

const API = window.location.origin + '/api';

export default function Register({ navigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthColor, setPasswordStrengthColor] = useState('bg-gray-700');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailMask, setEmailMask] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      setPasswordStrengthColor('bg-gray-700');
      return;
    }
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const length = password.length;

    if (length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      setPasswordStrength('Forte (Segura)');
      setPasswordStrengthColor('bg-green-500');
    } else if (length >= 6 && hasLetters && hasNumbers) {
      setPasswordStrength('Média (Recomendável incluir símbolos)');
      setPasswordStrengthColor('bg-yellow-500');
    } else {
      setPasswordStrength('Fraca (Mínimo 6 caracteres com letras e números)');
      setPasswordStrengthColor('bg-red-500');
    }
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const tempErrors = {};

    if (name.trim().length < 3) tempErrors.name = 'Nome deve ter pelo menos 3 letras.';
    if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Digite um e-mail válido.';
    if (phone.replace(/\D/g, '').length < 10) tempErrors.phone = 'Telefone inválido (mínimo 10 dígitos).';
    if (password.length < 6) tempErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    if (password !== confirmPassword) tempErrors.confirmPassword = 'As senhas não coincidem.';
    if (!privacyAccepted) tempErrors.privacy = 'Você deve aceitar os termos de privacidade.';

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    setServerError('');
    setLoading(true);
    try {
      const r = await fetch(API + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone.replace(/\D/g, ''), password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao cadastrar');

      if (data.requireOtp) {
        setEmailMask(data.emailMask);
        if (data.fallbackCode) {
          setOtpCode(data.fallbackCode);
          setOtpInfo('Código preenchido automaticamente. Clique em Confirmar Código para continuar.');
        } else {
          setOtpInfo('');
        }
        setShowOtpModal(true);
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode) { setOtpError('Digite o código de verificação.'); return; }
    setOtpError('');
    setLoading(true);
    try {
      const r = await fetch(API + '/auth/verify-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: otpCode })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Código inválido');

      setShowOtpModal(false);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('dashboard');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] glass-card rounded-3xl p-8 shadow-2xl relative border border-white/10">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent"></div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <i className="fas fa-play-circle text-[#00d2ff] text-3xl"></i>
          <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">
            MAXX <span className="text-[#00d2ff]">STREAM</span>
          </span>
        </div>
        <h2 className="text-lg text-gray-400 font-light">Crie sua Conta</h2>
      </div>

      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-6 text-center animate-pulse">
          <i className="fas fa-exclamation-triangle mr-2"></i> {serverError}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Nome Completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome Completo"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
          />
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              className="glass-input w-full px-4 py-2.5 pr-12 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
            >
              <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
            </button>
          </div>
          {passwordStrength && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrengthColor} transition-all duration-300`} style={{ width: passwordStrength.includes('Forte') ? '100%' : passwordStrength.includes('Média') ? '60%' : '20%' }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">{passwordStrength}</p>
            </div>
          )}
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Confirmar Senha</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a senha"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
          />
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-start gap-2.5 pt-2">
          <input
            type="checkbox"
            id="privacy"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 accent-[#00d2ff]"
          />
          <label htmlFor="privacy" className="text-xs text-gray-400 leading-normal">
            Aceito a política de privacidade e dou consentimento para fins de comunicação comercial e LGPD.
          </label>
        </div>
        {errors.privacy && <p className="text-red-400 text-xs">{errors.privacy}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#007bff] hover:bg-[#00d2ff] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-[#00d2ff]/20 transition-all uppercase tracking-wider text-sm hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Criar minha Conta'}
        </button>
      </form>

      <div className="text-center mt-6 pt-5 border-t border-white/5">
        <p className="text-sm text-gray-400">
          Já tem conta cadastrada?{' '}
          <button
            onClick={() => navigate('login')}
            className="text-[#00d2ff] font-bold hover:underline"
          >
            Faça login aqui
          </button>
        </p>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-[360px] p-8 rounded-3xl relative border border-white/10 text-center">
            <h3 className="text-xl font-bold mb-2">Confirme sua Identidade</h3>
            <p className="text-gray-400 text-sm mb-6">
              Enviamos um código de verificação para <strong className="text-white">{emailMask}</strong> e também para seu WhatsApp.
            </p>
            {otpInfo && (
              <p className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl p-3 mb-4 text-center">
                <i className="fas fa-info-circle mr-1"></i> {otpInfo}
              </p>
            )}
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="glass-input text-center text-xl tracking-[0.5em] py-3.5 rounded-xl w-full"
                required
              />
              {otpError && <p className="text-red-400 text-xs">{otpError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00d2ff] text-black font-bold py-3 rounded-xl transition hover:brightness-110 uppercase text-xs tracking-wider disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar Código'}
              </button>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
