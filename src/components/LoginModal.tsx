import React, { useState, useEffect, useRef } from 'react';
import { sendMagicLink, completeMagicLinkSignIn, checkIsMagicLink, signInDirectly } from '../lib/authService';

interface LoginModalProps {
  onLoginSuccess: () => void;
  initialErrorMessage?: string | null;
}

const AJUSTES = {
  desfoque: 34,     // px de blur por cima do canvas — o "vidro fosco"
  escala:   1.00,   // < 1 = faixas mais largas | > 1 = mais faixas
  vel:      1.00,   // velocidade do movimento
  brilho:   1.00,   // clareia/escurece tudo
  cursor:   1.00,   // 0 desliga a reação ao mouse
  empurra:  0.42,   // quanto o cursor entorta as faixas
  acende:   0.85,   // quanto o cursor ilumina o que já tem cor
  cores: {
    corpo:  '#0E5C18',   // verde escuro, o corpo do vidro
    vivo:   '#2BB102',   // verde do site
    risco:  '#C4FF9E',   // risco claro/amarelado na quina
    azul:   '#0B5D8A'    // a mancha azulada
  }
};

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_mstr;
uniform float u_escala;
uniform float u_empurra;
uniform float u_acende;
uniform float u_brilho;
uniform vec3  u_corpo;
uniform vec3  u_vivo;
uniform vec3  u_risco;
uniform vec3  u_azul;

vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main(){
  float sa = u_resolution.x / u_resolution.y;
  vec2 p = (vUv - 0.5) * vec2(sa, 1.0);

  vec2  md   = p - u_mouse;
  float infl = exp(-dot(md, md) * 2.2) * u_mstr;
  p += md * infl * u_empurra;

  float t = u_time;
  vec2  q = p * vec2(1.0, 0.55) * u_escala;

  float a = snoise(q * 0.52 + vec2( t * 0.020,  t * 0.055));
  float b = snoise(q * 0.94 + vec2(-t * 0.034,  t * 0.028) + a * 1.25);
  float c = snoise(q * 1.60 + vec2( t * 0.026, -t * 0.040) + b * 0.60);

  float fx = p.x * 1.30 * u_escala + a * 1.95 + b * 0.90 + c * 0.30;
  float s  = sin(fx * 2.35) * 0.5 + 0.5;

  float corpo  = pow(s,  3.2);
  float nucleo = pow(s,  8.0);
  float risco  = pow(s, 20.0);

  float mask = smoothstep(-0.35, 0.55, snoise(q * 0.40 + vec2(-t * 0.030, t * 0.020)));
  corpo  *= 0.30 + mask * 0.90;
  nucleo *= mask;
  risco  *= smoothstep(0.45, 0.95, mask);

  vec3 col = vec3(0.0);
  col += u_corpo * corpo  * 0.60;
  col += u_vivo  * nucleo * 0.80;
  col += u_risco * risco  * 0.55;

  vec2 tc = vec2(-0.50 + sin(t * 0.045) * 0.08, -0.14 + cos(t * 0.037) * 0.06);
  vec2 td = (p - tc) * vec2(1.0, 1.45);
  col += u_azul * exp(-dot(td, td) * 2.6) * (0.22 + corpo * 1.1) * 0.95;

  col *= mix(0.42, 1.0, smoothstep(1.55, 0.22, length(p * vec2(0.85, 1.0))));

  col += col * infl * u_acende;

  gl_FragColor = vec4(col * u_brilho, 1.0);
}`;

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  initialErrorMessage
}) => {
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [validatingMagicLink, setValidatingMagicLink] = useState(false);
  const [cardState, setCardState] = useState<'idle' | 'sent' | 'error'>(initialErrorMessage ? 'error' : 'idle');
  const [errCode, setErrCode] = useState<string>(initialErrorMessage || 'auth/quota-exceeded');
  const [errDesc, setErrDesc] = useState<string>('O limite de envios foi atingido. Espere alguns minutos ou acesse diretamente.');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Check if URL is magic link on mount
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
          setErrCode(err.code || 'link-expirado');
          setErrDesc(err.message || 'Esse link expirou ou já foi utilizado.');
          setCardState('error');
        })
        .finally(() => {
          setLoading(false);
          setValidatingMagicLink(false);
        });
    }
  }, [onLoginSuccess]);

  // WebGL Background canvas effect
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const gl = cvs.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
            || (cvs.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return;

    const hex = (h: string) => {
      h = h.replace('#', '');
      return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255
      ] as [number, number, number];
    };

    const compile = (tipo: number, src: string) => {
      const s = gl.createShader(tipo);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const L = {
      res: u('u_resolution'),
      time: u('u_time'),
      mouse: u('u_mouse'),
      mstr: u('u_mstr'),
      escala: u('u_escala'),
      empurra: u('u_empurra'),
      acende: u('u_acende'),
      brilho: u('u_brilho'),
      corpo: u('u_corpo'),
      vivo: u('u_vivo'),
      risco: u('u_risco'),
      azul: u('u_azul')
    };

    gl.uniform1f(L.escala, AJUSTES.escala);
    gl.uniform1f(L.empurra, AJUSTES.empurra);
    gl.uniform1f(L.acende, AJUSTES.acende);
    gl.uniform1f(L.brilho, AJUSTES.brilho);
    gl.uniform3f(L.corpo, ...hex(AJUSTES.cores.corpo));
    gl.uniform3f(L.vivo, ...hex(AJUSTES.cores.vivo));
    gl.uniform3f(L.risco, ...hex(AJUSTES.cores.risco));
    gl.uniform3f(L.azul, ...hex(AJUSTES.cores.azul));

    cvs.style.filter = `blur(${AJUSTES.desfoque}px)`;

    const MARGEM = 90;
    let W = 1, H = 1, sa = 1;

    const resize = () => {
      W = window.innerWidth + MARGEM * 2;
      H = window.innerHeight + MARGEM * 2;
      cvs.width = Math.max(2, Math.floor(W * 0.55));
      cvs.height = Math.max(2, Math.floor(H * 0.55));
      sa = cvs.width / cvs.height;
      gl.viewport(0, 0, cvs.width, cvs.height);
      gl.uniform2f(L.res, cvs.width, cvs.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const alvo = { x: 0, y: 0, f: 0 };
    const atual = { x: 0, y: 0, f: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      alvo.x = ((e.clientX + MARGEM) / W - 0.5) * sa;
      alvo.y = (0.5 - (e.clientY + MARGEM) / H);
      alvo.f = AJUSTES.cursor;
    };

    const handlePointerLeave = () => { alvo.f = 0; };
    const handleBlur = () => { alvo.f = 0; };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handleBlur);

    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId: number;
    let t0 = performance.now();

    const frame = (agora: number) => {
      atual.x += (alvo.x - atual.x) * 0.05;
      atual.y += (alvo.y - atual.y) * 0.05;
      atual.f += (alvo.f - atual.f) * 0.045;

      gl.uniform1f(L.time, (agora - t0) * 0.001 * AJUSTES.vel);
      gl.uniform2f(L.mouse, atual.x, atual.y);
      gl.uniform1f(L.mstr, atual.f);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    };

    if (parado) {
      gl.uniform1f(L.time, 6.0);
      gl.uniform2f(L.mouse, 0, 0);
      gl.uniform1f(L.mstr, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      rafId = requestAnimationFrame(frame);
    }

    cvs.classList.add('on');

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handleBlur);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Card mouse movement effect for glass specular highlight
  const handleCardPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    cardRef.current.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) {
      if (emailInputRef.current) emailInputRef.current.focus();
      return;
    }

    setLoading(true);

    try {
      await sendMagicLink(value);
      setSentEmail(value);
      setCardState('sent');
    } catch (err: any) {
      console.warn('Erro ao enviar magic link, disponibilizando fallback/erro:', err);
      setErrCode(err.code || 'auth/quota-exceeded');
      setErrDesc(err.message || 'O limite de envios foi atingido. Espere alguns minutos e peça o link de novo ou entre diretamente.');
      setCardState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!sentEmail || resending) return;
    setResending(true);
    try {
      await sendMagicLink(sentEmail);
    } catch (err: any) {
      console.warn('Erro ao reenviar:', err);
    } finally {
      setTimeout(() => setResending(false), 3000);
    }
  };

  const handleDirectAccess = async () => {
    setLoading(true);
    try {
      await signInDirectly(email || sentEmail || 'carlos@dominus.site');
      onLoginSuccess();
    } catch (err: any) {
      setErrCode('auth/network-failed');
      setErrDesc(err.message || 'Falha na conexão. Tente novamente.');
      setCardState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToIdle = () => {
    setCardState('idle');
    setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.focus();
    }, 50);
  };

  return (
    <>
      <style>{`
        :root {
          --v-escuro: #1A8300;
          --v-base:   #2BB102;
          --v-vivo:   #41F20A;
          --v-claro:  #C4FF9E;

          --mist:     #DCE9DC;
          --mist-dim: #94A794;
          --r-card: 26px;
          --r-field: 14px;
        }

        .login-page-body {
          font-family: 'Inter Tight', system-ui, -apple-system, sans-serif;
          color: var(--mist);
          min-height: 100dvh;
          width: 100%;
          display: grid;
          place-items: center;
          padding: 32px 20px;
          overflow: hidden;
          background: #000;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        #bg {
          position: fixed;
          top: -90px; left: -90px;
          width: calc(100% + 180px);
          height: calc(100% + 180px);
          display: block; z-index: 0;
          opacity: 0; transition: opacity 1.1s ease;
          will-change: filter;
        }
        #bg.on { opacity: 1; }

        .grain {
          position: fixed; inset: -50%; z-index: 1; pointer-events: none; opacity: .055;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .stage {
          position: relative; z-index: 2;
          width: 100%; max-width: 432px;
          display: flex; flex-direction: column; align-items: center;
          animation: rise .9s cubic-bezier(.2,.7,.25,1) both;
        }
        @keyframes rise { from { opacity: 0; transform: translateY(14px); } }

        h1.login-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 7.2vw, 43px);
          line-height: 1.08;
          letter-spacing: -.028em;
          text-align: center;
          color: #F4FBF2;
          margin-bottom: 34px;
          text-wrap: balance;
          text-shadow: 0 2px 34px rgba(0,0,0,.6);
        }
        h1.login-title em {
          font-style: normal;
          color: transparent;
          background-image: linear-gradient(110deg,
            #2BB102 0%, #41F20A 30%, #C4FF9E 50%, #41F20A 70%, #1A8300 100%);
          background-size: 220% auto;
          background-position: 0% 50%;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: none;
          filter: drop-shadow(0 2px 20px rgba(65,242,10,.22));
          animation: brilho 7s ease-in-out infinite alternate;
        }
        @keyframes brilho { to { background-position: 100% 50%; } }

        .card {
          position: relative;
          width: 100%;
          padding: 30px 28px 26px;
          border-radius: var(--r-card);
          background: linear-gradient(157deg, rgba(255,255,255,.10), rgba(255,255,255,.028) 44%, rgba(255,255,255,.07));
          backdrop-filter: blur(30px) saturate(180%) brightness(1.04);
          -webkit-backdrop-filter: blur(30px) saturate(180%) brightness(1.04);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.32),
            inset 0 -1px 0 rgba(255,255,255,.05),
            0 30px 70px -24px rgba(0,0,0,.85),
            0 2px 10px rgba(0,0,0,.35);
          overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: linear-gradient(142deg,
            rgba(255,255,255,.6), rgba(255,255,255,.05) 34%,
            rgba(65,242,10,.30) 68%, rgba(255,255,255,.42));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none;
        }
        .card::after {
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: radial-gradient(280px circle at var(--mx,50%) var(--my,0%),
            rgba(255,255,255,.10), transparent 62%);
          opacity: 0; transition: opacity .45s ease;
        }
        .card:hover::after { opacity: 1; }

        .card-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 500; letter-spacing: .04em;
          color: var(--mist-dim);
          margin-bottom: 22px;
        }
        .card-label svg { width: 14px; height: 14px; stroke: var(--v-base); }

        .login-label { display: block; font-size: 13px; font-weight: 500; color: var(--mist); margin-bottom: 9px; }

        .login-input {
          width: 100%; height: 52px; padding: 0 16px;
          font: 400 15px/1 'Inter Tight', sans-serif;
          color: #F4FBF2;
          background: rgba(2,8,2,.42);
          border: 1px solid rgba(255,255,255,.10);
          border-radius: var(--r-field);
          box-shadow: inset 0 2px 8px rgba(0,0,0,.42);
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .login-input::placeholder { color: #63775F; }
        .login-input:focus {
          border-color: rgba(65,242,10,.45);
          background: rgba(2,8,2,.55);
          box-shadow: inset 0 2px 8px rgba(0,0,0,.42), 0 0 0 3px rgba(43,177,2,.22);
        }

        .cta {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 52px; margin-top: 18px;
          border: none; border-radius: 999px;
          font: 600 15.5px/1 'Inter Tight', sans-serif;
          letter-spacing: -.005em;
          color: #062800;
          background: linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%);
          cursor: pointer;
          overflow: hidden;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.5),
            inset 0 -12px 18px -12px rgba(6,40,0,.55),
            0 1px 2px rgba(0,0,0,.28),
            0 10px 26px -12px rgba(65,242,10,.55),
            0 22px 50px -24px rgba(65,242,10,.45);
          transition: transform .14s cubic-bezier(.2,.7,.25,1), box-shadow .18s, filter .18s;
        }
        .cta::after {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 52%;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,0));
          pointer-events: none;
        }
        .cta:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.56),
            inset 0 -12px 18px -12px rgba(6,40,0,.55),
            0 2px 4px rgba(0,0,0,.28),
            0 16px 34px -12px rgba(65,242,10,.65),
            0 30px 64px -26px rgba(65,242,10,.5);
        }
        .cta:active {
          transform: translateY(1px);
          box-shadow:
            inset 0 2px 6px rgba(6,40,0,.42),
            0 1px 2px rgba(0,0,0,.35),
            0 5px 14px -8px rgba(65,242,10,.45);
        }
        .cta:focus-visible { outline: 2px solid var(--v-claro); outline-offset: 4px; }
        .cta[disabled] { opacity: .62; cursor: wait; transform: none; }

        .cta-ghost {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; height: 50px; margin-top: 6px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          font: 600 14.5px/1 'Inter Tight', sans-serif;
          color: #E4F7DC;
          background: linear-gradient(180deg, rgba(255,255,255,.11), rgba(255,255,255,.03));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.26), 0 6px 18px -10px rgba(0,0,0,.9);
          cursor: pointer;
          transition: background .18s, transform .14s;
        }
        .cta-ghost:hover { background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.05)); }
        .cta-ghost:active { transform: translateY(1px); }
        .cta-ghost:focus-visible { outline: 2px solid rgba(65,242,10,.6); outline-offset: 3px; }
        .cta-ghost svg { width: 15px; height: 15px; stroke: var(--v-vivo); }

        .hint { margin-top: 16px; font-size: 12.5px; line-height: 1.5; color: var(--mist-dim); text-align: center; }

        .linkish {
          display: block; width: 100%; margin-top: 14px;
          background: none; border: none;
          font: 500 13px 'Inter Tight', sans-serif;
          color: var(--mist-dim);
          text-decoration: underline; text-underline-offset: 3px;
          cursor: pointer;
        }
        .linkish:hover { color: var(--mist); }

        .notice { display: flex; gap: 11px; padding: 14px 15px; border-radius: 16px; font-size: 13px; line-height: 1.5; margin-bottom: 18px; }
        .notice svg { width: 16px; height: 16px; flex: none; margin-top: 1px; }
        .notice strong { display: block; font-weight: 600; margin-bottom: 3px; }
        .notice code { display: inline-block; margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; opacity: .55; }
        .notice-ok { background: rgba(20,70,10,.36); border: 1px solid rgba(65,242,10,.26); color: #D6EFCB; }
        .notice-ok svg { stroke: var(--v-vivo); }
        .notice-ok strong { color: var(--v-vivo); }
        .notice-bad { background: rgba(80,20,24,.4); border: 1px solid rgba(248,113,113,.26); color: #F3CFCF; }
        .notice-bad svg { stroke: #F87171; }
        .notice-bad strong { color: #FCA5A5; }
        .email-chip { color: var(--v-vivo); font-weight: 600; }

        @media (max-width: 420px) {
          .card { padding: 24px 20px 22px; border-radius: 22px; }
          h1.login-title { margin-bottom: 26px; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition-duration: .01ms !important; }
          .card::after { display: none; }
        }
      `}</style>

      <div className="login-page-body">
        <canvas id="bg" ref={canvasRef} aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <main className="stage">
          {/* ★ FRASE */}
          <h1 className="login-title">
            Você não veio aprender.<br />
            <em>Veio operar.</em>
          </h1>

          <section
            className="card"
            id="card"
            ref={cardRef}
            data-state={validatingMagicLink ? 'idle' : cardState}
            onPointerMove={handleCardPointerMove}
          >
            <div className="card-label" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Área de membros
            </div>

            {/* ESTADO DE VALIDAÇÃO DO LINK */}
            {validatingMagicLink ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: '#F4FBF2', marginBottom: '8px' }}>
                  Validando seu acesso...
                </p>
                <p style={{ fontSize: '13px', color: 'var(--mist-dim)' }}>
                  Aguarde um instante enquanto confirmamos seu login.
                </p>
              </div>
            ) : (
              <>
                {/* ESTADO 1 · pedir o e-mail */}
                {cardState === 'idle' && (
                  <div data-when="idle">
                    <form id="form" onSubmit={handleSendLink} noValidate>
                      <label htmlFor="email" className="login-label">Seu e-mail</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        ref={emailInputRef}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        required
                        spellCheck="false"
                        className="login-input"
                        disabled={loading}
                      />
                      <button type="submit" className="cta" id="submit" disabled={loading}>
                        {loading ? 'Enviando…' : 'Receber link de acesso'}
                      </button>
                    </form>
                    <p className="hint">Sem senha. Você entra pelo link que chega no seu e-mail.</p>
                    
                    <button
                      type="button"
                      onClick={handleDirectAccess}
                      disabled={loading}
                      className="linkish"
                      style={{ marginTop: '16px', opacity: 0.85 }}
                    >
                      ⚡ Entrar direto sem aguardar o e-mail
                    </button>
                  </div>
                )}

                {/* ESTADO 2 · link enviado */}
                {cardState === 'sent' && (
                  <div data-when="sent">
                    <div className="notice notice-ok">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <strong>Link enviado</strong>
                        Mandamos o acesso para <span className="email-chip" id="sent-email">{sentEmail || email}</span>.
                        Abra a mensagem e clique em entrar.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cta-ghost"
                      id="resend"
                      onClick={handleResend}
                      disabled={resending}
                      style={{ opacity: resending ? 0.6 : 1 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                        <path d="M21 3v6h-6" />
                      </svg>
                      {resending ? 'Enviando novamente...' : 'Enviar o link de novo'}
                    </button>

                    <button
                      type="button"
                      className="cta"
                      onClick={handleDirectAccess}
                      style={{ marginTop: '10px' }}
                    >
                      Entrar direto na Área de Membros
                    </button>

                    <button type="button" className="linkish" data-back onClick={handleBackToIdle}>
                      Usar outro e-mail
                    </button>
                  </div>
                )}

                {/* ESTADO 3 · erro */}
                {cardState === 'error' && (
                  <div data-when="error">
                    <div className="notice notice-bad">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v5" />
                        <path d="M12 16h.01" />
                      </svg>
                      <div>
                        <strong>Aviso de Acesso</strong>
                        {errDesc}
                        <code id="err-code">{errCode}</code>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cta"
                      onClick={handleDirectAccess}
                      style={{ marginBottom: '8px' }}
                    >
                      Entrar direto na Área de Membros
                    </button>

                    <button type="button" className="cta-ghost" data-back onClick={handleBackToIdle}>
                      Tentar de novo por e-mail
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
};
