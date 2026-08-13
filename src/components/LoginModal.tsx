import React, { useState, useEffect, useRef } from 'react';
import { signInWithPassword, resetUserPassword, checkIsMagicLink, completeMagicLinkSignIn } from '../lib/authService';

interface LoginModalProps {
  onLoginSuccess: () => void;
  initialErrorMessage?: string | null;
}

const AJUSTES = {
  desfoque:  16,     // px de blur por cima do canvas
  escala:    1.00,   // > 1 = mais faixas e mais finas
  vel:       1.00,   // velocidade do movimento
  brilho:    1.00,   // clareia/escurece tudo
  cursor:    1.00,   // 0 desliga a reação ao mouse
  empurra:   0.30,   // quanto o cursor entorta as faixas
  acende:    0.80,   // quanto o cursor ilumina o que já tem cor
  miolo:     0.10,   // 0 = miolo totalmente preto | 1 = sem escurecer
  miolo_raio:1.35,   // folga em volta do card que também escurece
  cores: {
    corpo: '#0C4A14',   // verde escuro, o corpo da faixa
    vivo:  '#2BB102',   // verde do site
    risco: '#DFFFB0',   // quina clara/amarelada
    azul:  '#0C6C93'    // o azul-petróleo da referência
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
uniform vec2  u_maskC;      /* centro do card, no espaço de p */
uniform vec2  u_maskR;      /* raio do card, no espaço de p   */
uniform float u_miolo;
uniform float u_mioloRaio;
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
  float infl = exp(-dot(md, md) * 2.4) * u_mstr;
  p += md * infl * u_empurra;

  float t = u_time;

  vec2 q = p * vec2(1.0, 0.28) * u_escala;

  float w1 = snoise(q * 0.85 + vec2( t * 0.022,  t * 0.055));
  float w2 = snoise(q * 1.70 + vec2(-t * 0.030,  t * 0.038) + w1 * 0.75);

  float leque = 3.5 + (p.y + 0.5) * 1.7;
  float fx = p.x * leque * u_escala + w1 * 2.1 + w2 * 0.85 + t * 0.05;

  float s = sin(fx * 2.15) * 0.5 + 0.5;

  float corpo  = pow(s,  6.0);
  float nucleo = pow(s, 17.0);
  float risco  = pow(s, 52.0);

  float mask = smoothstep(-0.40, 0.60, snoise(q * 0.42 + vec2(-t * 0.028, t * 0.018)));
  float alto = smoothstep(-0.30, 0.75, snoise(q * 0.62 + vec2( t * 0.031, t * 0.024) + 7.1));

  corpo  *= 0.28 + mask * 0.95;
  nucleo *= mask * (0.35 + alto * 0.85);
  risco  *= smoothstep(0.55, 1.00, mask * alto);

  float hue = smoothstep(-0.25, 0.65, snoise(q * 0.5 + vec2(-t * 0.02, t * 0.03) + 3.3));
  vec3 tom = mix(u_vivo, u_azul, hue * 0.75);

  vec3 col = vec3(0.0);
  col += u_corpo * corpo  * 0.62;
  col += tom     * nucleo * 0.95;
  col += u_risco * risco  * 0.85;

  col *= mix(0.40, 1.0, smoothstep(1.60, 0.20, length(p * vec2(0.85, 1.0))));

  col += col * infl * u_acende;

  float dm = length((p - u_maskC) / max(u_maskR, vec2(0.001)));
  col *= mix(u_miolo, 1.0, smoothstep(1.0, 1.0 + u_mioloRaio, dm));

  gl_FragColor = vec4(col * u_brilho, 1.0);
}`;

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  initialErrorMessage
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [aviso, setAviso] = useState<{
    show: boolean;
    title: string;
    text: string;
    code?: string;
    isOk?: boolean;
  }>({
    show: !!initialErrorMessage,
    title: initialErrorMessage ? 'Aviso de Acesso' : '',
    text: initialErrorMessage || ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Magic Link verification check on mount
  useEffect(() => {
    if (checkIsMagicLink()) {
      setLoading(true);
      setAviso({
        show: true,
        title: 'Validando Acesso',
        text: 'Aguarde um instante...',
        isOk: true
      });
      completeMagicLinkSignIn()
        .then(() => {
          onLoginSuccess();
        })
        .catch((err: any) => {
          setAviso({
            show: true,
            title: 'Link Expirado',
            text: err.message || 'Esse link expirou ou já foi utilizado.',
            code: err.code || ''
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [onLoginSuccess]);

  // WebGL Shader Background setup
  useEffect(() => {
    const cvs = canvasRef.current;
    const stage = stageRef.current;
    if (!cvs || !stage) return;

    const gl = (cvs.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }) ||
      cvs.getContext('experimental-webgl')) as WebGLRenderingContext | null;

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
      maskC: u('u_maskC'),
      maskR: u('u_maskR'),
      miolo: u('u_miolo'),
      mioloRaio: u('u_mioloRaio'),
      corpo: u('u_corpo'),
      vivo: u('u_vivo'),
      risco: u('u_risco'),
      azul: u('u_azul')
    };

    gl.uniform1f(L.escala, AJUSTES.escala);
    gl.uniform1f(L.empurra, AJUSTES.empurra);
    gl.uniform1f(L.acende, AJUSTES.acende);
    gl.uniform1f(L.brilho, AJUSTES.brilho);
    gl.uniform1f(L.miolo, AJUSTES.miolo);
    gl.uniform1f(L.mioloRaio, AJUSTES.miolo_raio);
    gl.uniform3f(L.corpo, ...hex(AJUSTES.cores.corpo));
    gl.uniform3f(L.vivo, ...hex(AJUSTES.cores.vivo));
    gl.uniform3f(L.risco, ...hex(AJUSTES.cores.risco));
    gl.uniform3f(L.azul, ...hex(AJUSTES.cores.azul));

    cvs.style.filter = `blur(${AJUSTES.desfoque}px)`;

    const MARGEM = 90;
    let W = 1, H = 1, sa = 1;

    const medirMascara = () => {
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const cx = ((r.left + r.width / 2 + MARGEM) / W - 0.5) * sa;
      const cy = 0.5 - (r.top + r.height / 2 + MARGEM) / H;
      const rx = ((r.width / 2 + 70) / W) * sa;
      const ry = (r.height / 2 + 50) / H;
      gl.uniform2f(L.maskC, cx, cy);
      gl.uniform2f(L.maskR, rx, ry);
    };

    const resize = () => {
      W = window.innerWidth + MARGEM * 2;
      H = window.innerHeight + MARGEM * 2;
      cvs.width = Math.max(2, Math.floor(W * 0.70));
      cvs.height = Math.max(2, Math.floor(H * 0.70));
      sa = cvs.width / cvs.height;
      gl.viewport(0, 0, cvs.width, cvs.height);
      gl.uniform2f(L.res, cvs.width, cvs.height);
      medirMascara();
    };

    resize();
    window.addEventListener('resize', resize);
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver && stage) {
      ro = new ResizeObserver(medirMascara);
      ro.observe(stage);
    }

    const alvo = { x: 0, y: 0, f: 0 }, atual = { x: 0, y: 0, f: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      alvo.x = ((e.clientX + MARGEM) / W - 0.5) * sa;
      alvo.y = 0.5 - (e.clientY + MARGEM) / H;
      alvo.f = AJUSTES.cursor;
    };
    const handlePointerLeave = () => { alvo.f = 0; };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number;
    let t0 = performance.now();

    const frame = (agora: number) => {
      atual.x += (alvo.x - atual.x) * 0.05;
      atual.y += (alvo.y - atual.y) * 0.05;
      atual.f += (alvo.f - atual.f) * 0.045;

      gl.uniform1f(L.time, (agora - t0) * 0.001 * AJUSTES.vel);
      gl.uniform2f(L.mouse, atual.x, atual.y);
      gl.uniform1f(L.mstr, atual.f);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    };

    if (parado) {
      gl.uniform1f(L.time, 6.0);
      gl.uniform2f(L.mouse, 0, 0);
      gl.uniform1f(L.mstr, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      raf = requestAnimationFrame(frame);
    }

    cvs.classList.add('on');

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handlePointerMoveCard = (e: React.PointerEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAviso((prev) => ({ ...prev, show: false }));

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@')) {
      setAviso({
        show: true,
        title: 'E-mail inválido',
        text: 'Digite o endereço completo, com @ e domínio.'
      });
      if (emailRef.current) emailRef.current.focus();
      return;
    }

    if (!password) {
      setAviso({
        show: true,
        title: 'Falta a senha',
        text: 'Digite a senha da sua conta.'
      });
      return;
    }

    setLoading(true);

    try {
      await signInWithPassword(cleanEmail, password);
      setAviso({
        show: true,
        title: 'Tudo certo',
        text: 'Entrando na área de membros…',
        isOk: true
      });
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Falha no login:', err);
      setAviso({
        show: true,
        title: err.code === 'auth/user-not-found' ? 'E-mail não cadastrado' : 'E-mail ou senha incorretos',
        text: err.message || 'Confira os dados e tente de novo.',
        code: err.code || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@')) {
      setAviso({
        show: true,
        title: 'Digite seu e-mail primeiro',
        text: 'Preencha o campo de e-mail acima e clique de novo.'
      });
      if (emailRef.current) emailRef.current.focus();
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(cleanEmail);
      setAviso({
        show: true,
        title: 'Link de troca enviado',
        text: `Veja a caixa de entrada de ${cleanEmail}.`,
        isOk: true
      });
    } catch (err: any) {
      setAviso({
        show: true,
        title: err.code === 'auth/user-not-found' ? 'E-mail não cadastrado' : 'Não foi possível enviar',
        text: err.message || 'Tente de novo em instantes.',
        code: err.code || ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --v-escuro: #1A8300;
          --v-base:   #2BB102;
          --v-vivo:   #41F20A;
          --v-claro:  #C4FF9E;

          --texto:       #EDF4EB;
          --texto-2:     #D9E4D6;
          --texto-fraco: #A7B7A4;
          --r-card: 26px;
          --r-field: 14px;
        }

        .login-page-body {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 32px 20px;
          overflow: hidden;
          background: #000;
          font-family: 'Inter Tight', system-ui, -apple-system, sans-serif;
          color: var(--texto);
          -webkit-font-smoothing: antialiased;
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
          position: fixed; inset: -50%; z-index: 1; pointer-events: none; opacity: .05;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .stage {
          position: relative; z-index: 2;
          width: 100%; max-width: 432px;
          display: flex; flex-direction: column; align-items: center;
          animation: rise .9s cubic-bezier(.2,.7,.25,1) both;
        }
        @keyframes rise { from { opacity:0; transform:translateY(14px); } }

        h1.main-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 7.2vw, 43px);
          line-height: 1.08;
          letter-spacing: -.028em;
          text-align: center;
          color: #F6FBF5;
          margin-bottom: 34px;
          text-wrap: balance;
          text-shadow: 0 2px 34px rgba(0,0,0,.7);
        }
        h1.main-title em {
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
          font-size: 12.5px; font-weight: 500; letter-spacing: .03em;
          color: var(--texto-2);
          margin-bottom: 22px;
        }
        .card-label svg { width: 14px; height: 14px; stroke: var(--v-vivo); }

        .campo { margin-bottom: 14px; }
        .campo:last-of-type { margin-bottom: 0; }

        .linha-label { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 9px; }
        label { font-size: 13px; font-weight: 500; color: var(--texto-2); }

        .esqueci {
          background: none; border: none; padding: 0;
          font: 500 12px 'Inter Tight', sans-serif;
          color: var(--texto-2);
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-color: rgba(217,228,214,.45);
          cursor: pointer;
          transition: color .18s, text-decoration-color .18s;
        }
        .esqueci:hover { color: var(--v-vivo); text-decoration-color: rgba(65,242,10,.6); }
        .esqueci:focus-visible { outline: 2px solid rgba(65,242,10,.6); outline-offset: 3px; border-radius: 4px; }

        .wrap-senha { position: relative; }

        input[type=email], input[type=password], input[type=text] {
          width: 100%; height: 52px; padding: 0 16px;
          font: 400 15px/1 'Inter Tight', sans-serif;
          color: #F6FBF5;
          background: rgba(2,8,2,.44);
          border: 1px solid rgba(255,255,255,.11);
          border-radius: var(--r-field);
          box-shadow: inset 0 2px 8px rgba(0,0,0,.42);
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .wrap-senha input { padding-right: 74px; }
        input::placeholder { color: #6C7F69; }
        input:focus {
          border-color: rgba(65,242,10,.45);
          background: rgba(2,8,2,.56);
          box-shadow: inset 0 2px 8px rgba(0,0,0,.42), 0 0 0 3px rgba(43,177,2,.22);
        }

        .ver-senha {
          position: absolute; right: 6px; top: 6px;
          height: 40px; padding: 0 12px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 10px;
          font: 500 12.5px 'Inter Tight', sans-serif;
          color: var(--texto-2);
          cursor: pointer;
          transition: background .18s;
        }
        .ver-senha:hover { background: rgba(255,255,255,.13); }

        .cta {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 52px; margin-top: 20px;
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

        .hint {
          margin-top: 16px;
          font-size: 12.5px; line-height: 1.5;
          color: var(--texto-2);
          text-align: center;
        }

        .aviso {
          display: flex; gap: 11px;
          padding: 13px 15px; margin-bottom: 18px;
          border-radius: 16px;
          font-size: 13px; line-height: 1.5;
          background: rgba(80,20,24,.42);
          border: 1px solid rgba(248,113,113,.26);
          color: #F5D6D6;
        }
        .aviso svg { width: 16px; height: 16px; flex: none; margin-top: 1px; stroke: #F87171; }
        .aviso strong { display: block; font-weight: 600; margin-bottom: 3px; color: #FCA5A5; }
        .aviso code { display: inline-block; margin-top: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; opacity: .5; }

        .aviso.ok { background: rgba(20,70,10,.36); border-color: rgba(65,242,10,.26); color: #D8EFCE; }
        .aviso.ok svg { stroke: var(--v-vivo); }
        .aviso.ok strong { color: var(--v-vivo); }

        @media (max-width: 420px) {
          .card { padding: 24px 20px 22px; border-radius: 22px; }
          h1.main-title { margin-bottom: 26px; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition-duration: .01ms !important; }
          .card::after { display: none; }
        }
      `}</style>

      <div className="login-page-body">
        <canvas id="bg" ref={canvasRef} aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <main className="stage" ref={stageRef}>
          <h1 className="main-title">
            Você não veio aprender.<br />
            <em>Veio operar.</em>
          </h1>

          <section
            className="card"
            ref={cardRef}
            onPointerMove={handlePointerMoveCard}
          >
            <div className="card-label">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Área de membros
            </div>

            {aviso.show && (
              <div className={`aviso ${aviso.isOk ? 'ok' : ''}`} role="alert">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {aviso.isOk ? (
                    <>
                      <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
                      <path d="m9 11 3 3L22 4" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v5" />
                      <path d="M12 16h.01" />
                    </>
                  )}
                </svg>
                <div>
                  <strong>{aviso.title}</strong>
                  <span>{aviso.text}</span>
                  {aviso.code && <code>{aviso.code}</code>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="campo">
                <div className="linha-label">
                  <label htmlFor="email">Seu e-mail</label>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  ref={emailRef}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (aviso.show) setAviso((prev) => ({ ...prev, show: false }));
                  }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  spellCheck="false"
                  disabled={loading}
                />
              </div>

              <div className="campo">
                <div className="linha-label">
                  <label htmlFor="senha">Senha</label>
                  <button
                    type="button"
                    className="esqueci"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="wrap-senha">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    name="senha"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (aviso.show) setAviso((prev) => ({ ...prev, show: false }));
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ver-senha"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? 'esconder' : 'mostrar'}
                  </button>
                </div>
              </div>

              <button type="submit" className="cta" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="hint">Use o e-mail que você cadastrou na compra.</p>
          </section>
        </main>
      </div>
    </>
  );
};
