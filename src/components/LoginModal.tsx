import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Send } from 'lucide-react';
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
  const [validatingMagicLink, setValidatingMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(initialErrorMessage || null);
  const [linkSentEmail, setLinkSentEmail] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Check if page loaded from magic link in URL
  useEffect(() => {
    if (checkIsMagicLink()) {
      setValidatingMagicLink(true);
      setLoading(true);
      completeMagicLinkSignIn()
        .then(() => {
          onLoginSuccess();
        })
        .catch((err: any) => {
          console.error('Erro ao completar magic link:', err);
          setError(err.message || 'Esse link expirou ou já foi utilizado. Peça um novo link.');
        })
        .finally(() => {
          setLoading(false);
          setValidatingMagicLink(false);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#040607]">
      {/* Background Canvas image */}
      <div className="adsata-bg-fixed" />

      {/* Liquid Glass Card Container */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-[#06120e]/65 border border-[#22E025]/35 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(34,224,37,0.18)] rounded-3xl p-7 sm:p-9 overflow-hidden transition-all duration-300">
        
        {/* Top Gloss Reflection Line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#22E025]/60 to-transparent pointer-events-none" />

        {/* Ambient Liquid Glow Accents */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#22E025]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#153A2D]/40 rounded-full blur-3xl pointer-events-none" />

        {/* Security Lock Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#153A2D]/80 border border-[#22E025]/50 text-[#22E025] flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_25px_rgba(34,224,37,0.35)] backdrop-blur-md">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Área de Membros
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-1.5 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#22E025]" />
            Acesso Restrito por Link Mágico sem Senha
          </p>
        </div>

        {/* State A: Validating Magic Link */}
        {validatingMagicLink ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#153A2D]/80 border border-[#22E025]/50 text-[#22E025] flex items-center justify-center mx-auto animate-spin shadow-[0_0_20px_rgba(34,224,37,0.4)]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">
                Validando seu acesso...
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Aguarde um instante enquanto confirmamos sua credencial.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Error Alert Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 shadow-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-300">Acesso Não Autorizado</p>
                  <p className="mt-0.5 opacity-90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* State B: Email sent confirmation */}
            {linkSentEmail ? (
              <div className="space-y-5 text-center animate-in fade-in duration-300 relative z-10">
                <div className="p-4 rounded-xl bg-[#153A2D]/50 border border-[#22E025]/40 text-left backdrop-blur-md">
                  <div className="flex items-center gap-2 text-[#22E025] font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Link Enviado com Sucesso!</span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-medium">
                    Enviamos o link de acesso para <strong className="text-[#22E025]">{linkSentEmail}</strong>. Abra a mensagem e clique no botão para entrar.
                  </p>
                </div>

                {/* Countdown / Resend Controls */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={resendCountdown > 0 || loading}
                    onClick={handleResend}
                    className="w-full hero-cta-secondary py-3.5 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
              /* State C: Email request form */
              <form onSubmit={handleSendLink} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1.5">
                    Informe o e-mail cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full adsata-input rounded-xl pl-10 pr-4 py-3 text-sm bg-[#0B0F10]/80 border-[#1E272B] focus:border-[#22E025]"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">
                    Você receberá um link de login instantâneo direto no seu e-mail.
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
          </>
        )}

      </div>
    </div>
  );
};

