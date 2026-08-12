import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { sendMagicLink, completeMagicLinkSignIn, checkIsMagicLink } from '../lib/authService';

interface LoginModalProps {
  onLoginSuccess: () => void;
  initialErrorMessage?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  initialErrorMessage
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialErrorMessage || null);
  const [linkSentEmail, setLinkSentEmail] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Check if page loaded from magic link in URL
  useEffect(() => {
    if (checkIsMagicLink()) {
      setLoading(true);
      completeMagicLinkSignIn()
        .then(() => {
          onLoginSuccess();
        })
        .catch((err: any) => {
          console.error('Erro ao completar magic link:', err);
          setError(err.message || 'Esse link expirou. Peça um novo.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [onLoginSuccess]);

  // 60-second countdown for resend button locking
  useEffect(() => {
    let interval: any = null;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendMagicLink(email.trim());
      setLinkSentEmail(email.trim().toLowerCase());
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar o link de acesso. Peça um novo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!linkSentEmail || resendCountdown > 0) return;
    setLoading(true);
    setError(null);

    try {
      await sendMagicLink(linkSentEmail);
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Falha ao reenviar o link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="w-full max-w-md adsata-card overflow-hidden p-6 sm:p-7 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#1E272B]">
        
        {/* Neon Glow Accents */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#22E025]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#22E025]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Lock Header */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-[#153A2D] border border-[#22E025]/40 text-[#22E025] flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_20px_rgba(34,224,37,0.3)]">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Área de Membros Exclusiva
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-1 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#22E025]" />
            Acesso Restrito via Link Mágico por E-mail
          </p>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-300">Acesso Não Autorizado</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* State 1: Email sent confirmation */}
        {linkSentEmail ? (
          <div className="space-y-5 text-center animate-in fade-in duration-300">
            <div className="p-4 rounded-xl bg-[#153A2D]/40 border border-[#22E025]/30 text-left">
              <div className="flex items-center gap-2 text-[#22E025] font-bold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Link Enviado com Sucesso!</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-medium">
                Enviamos um link de acesso para <strong className="text-[#22E025]">{linkSentEmail}</strong>. Abra o e-mail neste mesmo dispositivo.
              </p>
            </div>

            {/* Countdown / Resend Controls */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={resendCountdown > 0 || loading}
                onClick={handleResend}
                className="w-full hero-cta-secondary py-3 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCountdown > 0
                    ? `Reenviar link em ${resendCountdown}s`
                    : 'Reenviar Link de Acesso'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLinkSentEmail(null);
                  setError(null);
                }}
                className="text-[11px] text-[#9CA3AF] hover:text-white underline font-semibold transition-colors"
              >
                Utilizar outro endereço de e-mail
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Email request form */
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Digite seu e-mail cadastrado na mentoria
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full adsata-input rounded-xl pl-10 pr-4 py-3 text-sm"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">
                Não existe senha. Você receberá um link de login direto na sua caixa de entrada.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full hero-cta py-3.5 px-4 text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#050E06]" />
                  <span>Enviando Link Seguro...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#050E06]" />
                  <span>Receber Link de Acesso</span>
                  <div className="hero-cta-arrow ml-1">
                    <ArrowRight className="w-3.5 h-3.5 text-[#050E06]" />
                  </div>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Hint for Test Email */}
        <div className="mt-6 pt-4 border-t border-[#1E272B] text-center">
          <p className="text-[11px] font-semibold text-[#9CA3AF]">
            💡 E-mail pré-autorizado para teste:
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail('carlos@dominus.site');
              setError(null);
            }}
            className="mt-1.5 text-[11px] font-mono font-bold text-[#22E025] hover:underline bg-[#153A2D]/60 px-3 py-1 rounded-full border border-[#22E025]/30 cursor-pointer inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-[#22E025]" />
            carlos@dominus.site
          </button>
        </div>

      </div>
    </div>
  );
};
