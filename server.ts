import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'cakto-mentoria-secret-key-2026-super-secure';
const MASTER_ADMIN_KEY = process.env.ADMIN_KEY || 'cakto2026';

app.use(express.json());

// File storage path for persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Interface for database storage
interface DB {
  googleSheetUrl?: string;
  lastGoogleSheetSync?: string;
  strictGoogleSheetOnly?: boolean;
  whitelist: Array<{
    id: string;
    email: string;
    name: string;
    purchaseDate: string;
    status: 'active' | 'suspended';
    notes?: string;
  }>;
  pins: Record<string, { pin: string; expiresAt: number }>;
  sessions: Record<string, { email: string; createdAt: number }>;
  userProgress: Record<string, { completedLessonIds: string[]; ratings: Record<string, number> }>;
  comments: Array<{
    id: string;
    lessonId: string;
    userEmail: string;
    userName: string;
    text: string;
    createdAt: string;
    avatarInitials: string;
  }>;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    email: string;
    ip: string;
    action: 'LOGIN_SUCCESS' | 'LOGIN_DENIED' | 'PIN_GENERATED' | 'LOGOUT' | 'WHITELIST_UPDATED';
    details: string;
    success: boolean;
  }>;
  modules: Array<{
    id: string;
    order: number;
    title: string;
    description?: string;
    lessons: Array<{
      id: string;
      moduleId: string;
      title: string;
      videoUrl: string;
      durationMinutes: number;
      description: string;
      notes?: string;
      order: number;
      attachments?: Array<{
        id: string;
        title: string;
        url: string;
        fileType: 'pdf' | 'link' | 'zip' | 'doc';
        fileSize?: string;
      }>;
    }>;
  }>;
}

// Initial default database structure
const defaultModules = [
  {
    id: 'm0',
    order: 0,
    title: '0. Introdução e Suporte',
    description: 'Boas-vindas à mentoria, visão geral do programa e suporte aos alunos.',
    lessons: [
      {
        id: 'l0_1',
        moduleId: 'm0',
        order: 1,
        title: 'Introdução',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default video embed
        durationMinutes: 5,
        description: 'Seja muito bem-vindo à Mentoria Cacto! Nesta aula introdutória você aprenderá como aproveitar ao máximo a plataforma, o roadmap de conteúdos e como acelerar seus resultados.',
        notes: '📌 Pontos Chave:\n- Assistir os módulos na ordem sequencial\n- Baixar o PDF com o mapa de execução no material complementar\n- Dúvidas devem ser enviadas na seção de comentários abaixo de cada aula.',
        attachments: [
          {
            id: 'att0_1',
            title: 'Guia de Início Rápido - Mentoria Cacto.pdf',
            url: '#',
            fileType: 'pdf' as const,
            fileSize: '2.4 MB'
          },
          {
            id: 'att0_2',
            title: 'Link da Comunidade Exclusiva no Telegram',
            url: 'https://telegram.org',
            fileType: 'link' as const
          }
        ]
      },
      {
        id: 'l0_2',
        moduleId: 'm0',
        order: 2,
        title: 'Como entrar na comunidade?',
        videoUrl: 'https://www.youtube.com/embed/L_LUpnjgPso',
        durationMinutes: 8,
        description: 'Passo a passo completo para acessar nosso grupo VIP de alunos, interagir com a rede de mentorados e tirar dúvidas diretamente com os mentores.',
        notes: 'Acesse o grupo de networking e apresente-se com seu nicho e objetivos principais.',
        attachments: [
          {
            id: 'att0_3',
            title: 'Regras da Comunidade e Networking.pdf',
            url: '#',
            fileType: 'pdf' as const,
            fileSize: '1.1 MB'
          }
        ]
      }
    ]
  },
  {
    id: 'm1',
    order: 1,
    title: '1. Fornecedores e Produção',
    description: 'Encontrando os melhores parceiros, negociação de margens e escala de produtos.',
    lessons: [
      {
        id: 'l1_1',
        moduleId: 'm1',
        order: 1,
        title: 'Mapeamento de Fornecedores de Alto Padrão',
        videoUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
        durationMinutes: 15,
        description: 'Aprenda os critérios de validação de fornecedores confiáveis, prazos de entrega e como evitar problemas de estoque.',
        notes: 'Sempre peça amostras antes de fechar grandes volumes.',
        attachments: [
          {
            id: 'att1_1',
            title: 'Planilha de Validação de Fornecedores.xlsx',
            url: '#',
            fileType: 'doc' as const,
            fileSize: '540 KB'
          }
        ]
      },
      {
        id: 'l1_2',
        moduleId: 'm1',
        order: 2,
        title: 'Negociação de Margem e Prazos de Pagamento',
        videoUrl: 'https://www.youtube.com/embed/2g811KoJBUo',
        durationMinutes: 22,
        description: 'Técnicas diretas para obter melhores preços por unidade e condições facilitadas.',
        notes: 'Utilize os scripts de abordagem fornecidos no material de apoio.'
      },
      {
        id: 'l1_3',
        moduleId: 'm1',
        order: 3,
        title: 'Controle de Qualidade e Amostras de Teste',
        videoUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ',
        durationMinutes: 18,
        description: 'Como inspecionar produtos antes de disparar o tráfego pago ou campanhas orgânicas.'
      }
    ]
  },
  {
    id: 'm2',
    order: 2,
    title: '2. Como gerar tráfego orgânico pra sua loja',
    description: 'Domine a criação de conteúdo viral no TikTok, Instagram e Reels sem gastar em anúncios.',
    lessons: [
      {
        id: 'l2_1',
        moduleId: 'm2',
        order: 1,
        title: 'Estratégia de Conteúdo Viral no TikTok e Reels',
        videoUrl: 'https://www.youtube.com/embed/C0DPdy98e4c',
        durationMinutes: 25,
        description: 'Análise detalhada de ganchos (hooks) de retenção, roteiros visuais e padrões de áudio alta conversão.',
        attachments: [
          {
            id: 'att2_1',
            title: '50 Ganchos Virais para Vídeos Curtos.pdf',
            url: '#',
            fileType: 'pdf' as const,
            fileSize: '3.8 MB'
          }
        ]
      },
      {
        id: 'l2_2',
        moduleId: 'm2',
        order: 2,
        title: 'Entendendo o Algoritmo e Retenção de Audiência',
        videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        durationMinutes: 30,
        description: 'Por que seus vídeos travam em 200 visualizações e como virar a chave da distribuição orgânica.'
      },
      {
        id: 'l2_3',
        moduleId: 'm2',
        order: 3,
        title: 'Estudo de Caso: 100k Visualizações em 48 Horas',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        durationMinutes: 19,
        description: 'Desmistificando a campanha orgânica que gerou mais de R$ 12.000 em vendas sem tráfego pago.'
      },
      {
        id: 'l2_4',
        moduleId: 'm2',
        order: 4,
        title: 'Funil de Conversão Orgânico para WhatsApp e Checkout',
        videoUrl: 'https://www.youtube.com/embed/L_LUpnjgPso',
        durationMinutes: 21,
        description: 'Como direcionar a audiência curiosa das redes sociais diretamente para a finalização de compra.'
      }
    ]
  },
  {
    id: 'm3',
    order: 3,
    title: '3. Criando seu Site do Zero',
    description: 'Aprenda a construir um site moderno de alta conversão inspirado nas melhores marcas.',
    lessons: [
      {
        id: 'l3_1',
        moduleId: 'm3',
        order: 1,
        title: 'Estrutura Recomendada para Alta Conversão',
        videoUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
        durationMinutes: 18,
        description: 'Hierarquia visual, prova social, ofertas e gatilhos de escassez sem poluír o visual.'
      },
      {
        id: 'l3_2',
        moduleId: 'm3',
        order: 2,
        title: 'Configuração do Checkout Seguro e Gateways',
        videoUrl: 'https://www.youtube.com/embed/2g811KoJBUo',
        durationMinutes: 24,
        description: 'Integração de PIX transparente, cartão de crédito e recuperação de carrinho abandonado.'
      },
      {
        id: 'l3_3',
        moduleId: 'm3',
        order: 3,
        title: 'Experiência do Usuário (UX) e Velocidade Mobile',
        videoUrl: 'https://www.youtube.com/embed/fJ9rUzIMcZQ',
        durationMinutes: 15,
        description: 'Ajuste fino de performance para garantir carregamento em menos de 1.5 segundo.'
      },
      {
        id: 'l3_4',
        moduleId: 'm3',
        order: 4,
        title: 'Teste A/B e Otimização Continuada de Copy',
        videoUrl: 'https://www.youtube.com/embed/C0DPdy98e4c',
        durationMinutes: 20,
        description: 'Como testar títulos, imagens de produto e botões para dobrar a taxa de conversão.'
      }
    ]
  },
  {
    id: 'm4',
    order: 4,
    title: '4. Noções básicas de Escalar e backend',
    description: 'Ajuste de caixa, gestão de equipe e métricas para escalar seu negócio com saúde financeira.',
    lessons: [
      {
        id: 'l4_1',
        moduleId: 'm4',
        order: 1,
        title: 'Métricas Essenciais: CAC, LTV, ROAS e Margem Líquida',
        videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        durationMinutes: 28,
        description: 'Como ler a saúde do negócio em números reais sem se iludir com faturamento bruto.'
      },
      {
        id: 'l4_2',
        moduleId: 'm4',
        order: 2,
        title: 'Contratação, Automações e Delegação de Processos',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        durationMinutes: 25,
        description: 'Quando e como contratar seu primeiro suporte e gestor para liberar seu tempo focado em estratégia.'
      }
    ]
  },
  {
    id: 'm5',
    order: 5,
    title: '5. [BÔNUS] Plano até os 30k mês',
    description: 'Módulo Bônus exclusivo: Plano tático passo a passo para faturar R$ 30.000 mensais.',
    lessons: [
      {
        id: 'l5_1',
        moduleId: 'm5',
        order: 1,
        title: 'O Mapa de Ação dos 0 aos 30 Mil Reais Mensais',
        videoUrl: 'https://www.youtube.com/embed/L_LUpnjgPso',
        durationMinutes: 45,
        description: 'A estratégia completa consolidada em um plano semanal prático para você executar.',
        attachments: [
          {
            id: 'att5_1',
            title: 'Mapa Mental - Plano de Ação 30k Mês.pdf',
            url: '#',
            fileType: 'pdf' as const,
            fileSize: '4.2 MB'
          }
        ]
      }
    ]
  }
];

// Helper to initialize/read DB from disk
function getDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initialDB: DB = {
        whitelist: [
          {
            id: '1',
            email: 'carlos@dominus.site',
            name: 'Carlos Santos (Aluno Exemplo)',
            purchaseDate: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: 'Comprador verificado da Mentoria'
          },
          {
            id: '2',
            email: 'aluno@exemplo.com',
            name: 'Aluno VIP Mentoria',
            purchaseDate: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: 'Acesso liberado'
          },
          {
            id: '3',
            email: 'guilherme@exemplo.com',
            name: 'Guilherme Cordeiro',
            purchaseDate: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: 'Mentor Cacto'
          }
        ],
        pins: {},
        sessions: {},
        userProgress: {
          'carlos@dominus.site': {
            completedLessonIds: ['l0_1'],
            ratings: { 'l0_1': 5 }
          }
        },
        comments: [
          {
            id: 'c1',
            lessonId: 'l0_1',
            userEmail: 'carlos@dominus.site',
            userName: 'Carlos Santos',
            text: 'Excelente aula de introdução! Muito claro o direcionamento.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            avatarInitials: 'CS'
          }
        ],
        auditLogs: [
          {
            id: 'log-init',
            timestamp: new Date().toISOString(),
            email: 'system',
            ip: '127.0.0.1',
            action: 'WHITELIST_UPDATED',
            details: 'Sistema de autorização inicializado com 3 e-mails autorizados.',
            success: true
          }
        ],
        modules: defaultModules
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, using fallback', err);
    return {
      whitelist: [
        { id: '1', email: 'carlos@dominus.site', name: 'Carlos Santos', purchaseDate: '2026-08-12', status: 'active' }
      ],
      pins: {},
      sessions: {},
      userProgress: {},
      comments: [],
      auditLogs: [],
      modules: defaultModules
    };
  }
}

function saveDB(db: DB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing database file', err);
  }
}

// Generate HMAC token for session
function createSessionToken(email: string): string {
  const payload = `${email}:${Date.now()}:${Math.random().toString(36).substring(2)}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return `${Buffer.from(email).toString('base64')}.${hmac}`;
}

// Verify HMAC token & return email if valid
function verifySessionToken(token: string): string | null {
  if (!token) return null;
  try {
    const [base64Email] = token.split('.');
    if (!base64Email) return null;
    const email = Buffer.from(base64Email, 'base64').toString('utf-8');
    
    // Check if session exists in DB
    const db = getDB();
    if (db.sessions[token] && db.sessions[token].email === email) {
      // Also verify if email is STILL active in whitelist
      const isAuthorized = db.whitelist.some(
        entry => entry.email.toLowerCase() === email.toLowerCase() && entry.status === 'active'
      );
      if (isAuthorized) {
        return email;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Middleware: Require Auth
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso Não Autorizado. Token de sessão ausente.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const email = verifySessionToken(token);
  if (!email) {
    res.status(403).json({ error: 'Sessão inválida ou e-mail não autorizado na lista da mentoria.' });
    return;
  }
  (req as any).userEmail = email;
  (req as any).sessionToken = token;
  next();
}

// Helper log audit
function addAuditLog(email: string, ip: string, action: DB['auditLogs'][0]['action'], details: string, success: boolean) {
  const db = getDB();
  db.auditLogs.unshift({
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    email,
    ip: ip || '127.0.0.1',
    action,
    details,
    success
  });
  // keep last 200 logs
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDB(db);
}

// Helper to fetch and synchronize Google Sheet CSV
async function syncFromGoogleSheet(sheetUrl: string): Promise<{ success: boolean; count: number; emails: string[]; error?: string }> {
  try {
    if (!sheetUrl) return { success: false, count: 0, emails: [], error: 'URL do Google Sheets não fornecida.' };
    
    let csvUrl = sheetUrl.trim();
    if (csvUrl.includes('docs.google.com/spreadsheets')) {
      const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }

    const response = await fetch(csvUrl, {
      headers: { 'User-Agent': 'CaktoMembersServer/1.0' },
      redirect: 'follow'
    });

    if (!response.ok) {
      return {
        success: false,
        count: 0,
        emails: [],
        error: `Erro ao acessar planilha Google (Status ${response.status}). Certifique-se de que o link está compartilhado como "Qualquer pessoa com o link pode ler" ou publicado na web.`
      };
    }

    const csvText = await response.text();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = Array.from(new Set((csvText.match(emailRegex) || []).map((e) => e.toLowerCase().trim())));

    if (foundEmails.length === 0) {
      return { success: false, count: 0, emails: [], error: 'Nenhum endereço de e-mail foi encontrado na planilha.' };
    }

    const db = getDB();
    db.googleSheetUrl = sheetUrl;
    let addedCount = 0;

    foundEmails.forEach((email) => {
      const existing = db.whitelist.find((item) => item.email.toLowerCase() === email);
      if (!existing) {
        db.whitelist.push({
          id: 'gs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          email,
          name: email.split('@')[0],
          purchaseDate: new Date().toISOString().split('T')[0],
          status: 'active',
          notes: 'Sincronizado automaticamente via Google Sheets'
        });
        addedCount++;
      } else {
        existing.status = 'active';
      }
    });

    db.lastGoogleSheetSync = new Date().toISOString();
    saveDB(db);

    return { success: true, count: addedCount, emails: foundEmails };
  } catch (err: any) {
    return { success: false, count: 0, emails: [], error: err.message || 'Falha ao conectar com o Google Sheets.' };
  }
}

// In-Memory Rate Limiting for brute force protection
const loginAttempts: Record<string, { count: number; resetAt: number }> = {};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts[ip];
  if (!record) return true;
  if (now > record.resetAt) {
    delete loginAttempts[ip];
    return true;
  }
  return record.count < 10; // Max 10 attempts per 15 minutes per IP
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  if (!loginAttempts[ip] || now > loginAttempts[ip].resetAt) {
    loginAttempts[ip] = { count: 1, resetAt: now + 15 * 60 * 1000 };
  } else {
    loginAttempts[ip].count++;
  }
}

// --- API ROUTES ---

// 1. Check if email is in whitelist and generate PIN
app.post('/api/auth/check-email', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Muitas tentativas malsucedidas de acesso. Por razões de segurança, aguarde 15 minutos.'
    });
    return;
  }

  const emailRaw = req.body?.email;
  if (!emailRaw || typeof emailRaw !== 'string') {
    res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
    return;
  }
  const email = emailRaw.trim().toLowerCase();
  let db = getDB();

  // If a Google Sheet URL is configured, auto-sync live before checking whitelist
  if (db.googleSheetUrl) {
    try {
      await syncFromGoogleSheet(db.googleSheetUrl);
      db = getDB(); // refresh state
    } catch (e) {
      // ignore sync error and continue with local whitelist
    }
  }

  const entry = db.whitelist.find((item) => item.email.toLowerCase() === email && item.status === 'active');

  if (!entry) {
    recordFailedAttempt(clientIp);
    addAuditLog(email, clientIp, 'LOGIN_DENIED', 'Tentativa de login com e-mail não cadastrado na lista de compradores.', false);
    res.status(403).json({
      authorized: false,
      error: 'E-mail não autorizado para esta mentoria. Somente compradores cadastrados na planilha do mentor têm acesso.'
    });
    return;
  }

  // Generate 6-digit PIN code
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  db.pins[email] = {
    pin,
    expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
  };
  saveDB(db);

  addAuditLog(email, clientIp, 'PIN_GENERATED', `Código de verificação gerado para ${entry.name}.`, true);

  // Return success info + PIN for seamless testing & simulation
  res.json({
    authorized: true,
    email: entry.email,
    name: entry.name,
    message: `Código de verificação gerado com sucesso para ${entry.email}!`,
    // For seamless testing in AI Studio preview, send PIN in response
    devPinHint: pin
  });
});

// 2. Verify PIN and issue token
app.post('/api/auth/verify-pin', (req, res) => {
  const { email: emailRaw, pin, masterKey } = req.body || {};
  if (!emailRaw || typeof emailRaw !== 'string') {
    res.status(400).json({ error: 'E-mail é obrigatório.' });
    return;
  }
  const email = emailRaw.trim().toLowerCase();
  const db = getDB();
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

  // Check whitelist status
  const entry = db.whitelist.find(item => item.email.toLowerCase() === email && item.status === 'active');
  if (!entry) {
    addAuditLog(email, clientIp, 'LOGIN_DENIED', 'Tentativa de verificação com e-mail sem licença ativa.', false);
    res.status(403).json({ error: 'Acesso negado: Este e-mail não possui licença ativa.' });
    return;
  }

  // Master key override or valid PIN check
  let isValid = false;
  if (masterKey && masterKey === MASTER_ADMIN_KEY) {
    isValid = true;
  } else {
    const pinData = db.pins[email];
    if (pinData && pinData.pin === pin && pinData.expiresAt > Date.now()) {
      isValid = true;
      delete db.pins[email]; // single-use
    }
  }

  if (!isValid) {
    addAuditLog(email, clientIp, 'LOGIN_DENIED', 'Código de verificação incorreto ou expirado.', false);
    res.status(401).json({ error: 'Código de verificação incorreto ou expirado.' });
    return;
  }

  // Create session
  const token = createSessionToken(email);
  db.sessions[token] = {
    email,
    createdAt: Date.now()
  };
  saveDB(db);

  addAuditLog(email, clientIp, 'LOGIN_SUCCESS', `Login efetuado com sucesso por ${entry.name} (${email}).`, true);

  const progress = db.userProgress[email] || { completedLessonIds: [], ratings: {} };

  res.json({
    sessionToken: token,
    user: {
      email: entry.email,
      name: entry.name,
      isAdmin: masterKey === MASTER_ADMIN_KEY || email === 'guilherme@exemplo.com' || email === 'carlos@dominus.site',
      completedLessonIds: progress.completedLessonIds || [],
      ratings: progress.ratings || {}
    }
  });
});

// 3. Auth Me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const email = (req as any).userEmail;
  const db = getDB();
  const entry = db.whitelist.find(item => item.email.toLowerCase() === email.toLowerCase());
  const progress = db.userProgress[email] || { completedLessonIds: [], ratings: {} };

  res.json({
    email,
    name: entry ? entry.name : email.split('@')[0],
    isAdmin: email === 'guilherme@exemplo.com' || email === 'carlos@dominus.site',
    completedLessonIds: progress.completedLessonIds || [],
    ratings: progress.ratings || {}
  });
});

// 4. Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req as any).sessionToken;
  const email = (req as any).userEmail;
  const db = getDB();
  delete db.sessions[token];
  saveDB(db);

  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  addAuditLog(email, clientIp, 'LOGOUT', 'Usuário encerrou a sessão.', true);

  res.json({ success: true });
});

// 5. GET Course Content (Gated)
app.get('/api/content/course', requireAuth, (req, res) => {
  const email = (req as any).userEmail;
  const db = getDB();
  const progress = db.userProgress[email] || { completedLessonIds: [], ratings: {} };

  // Calculate stats & mark completion in returned payload
  let totalLessonsCount = 0;
  const modulesWithCompletion = db.modules.map(mod => {
    const lessons = mod.lessons.map(les => {
      totalLessonsCount++;
      return {
        ...les,
        completed: progress.completedLessonIds?.includes(les.id) || false
      };
    });
    return {
      ...mod,
      lessons
    };
  });

  res.json({
    modules: modulesWithCompletion,
    totalLessons: totalLessonsCount
  });
});

// 6. Toggle Complete Lesson
app.post('/api/content/lessons/:id/complete', requireAuth, (req, res) => {
  const lessonId = req.params.id;
  const email = (req as any).userEmail;
  const db = getDB();

  if (!db.userProgress[email]) {
    db.userProgress[email] = { completedLessonIds: [], ratings: {} };
  }
  const completed = db.userProgress[email].completedLessonIds || [];
  const index = completed.indexOf(lessonId);

  let isCompletedNow = false;
  if (index > -1) {
    completed.splice(index, 1);
    isCompletedNow = false;
  } else {
    completed.push(lessonId);
    isCompletedNow = true;
  }

  db.userProgress[email].completedLessonIds = completed;
  saveDB(db);

  res.json({
    lessonId,
    completed: isCompletedNow,
    completedLessonIds: completed
  });
});

// 7. Lesson Comments (Get & Post)
app.get('/api/content/lessons/:id/comments', requireAuth, (req, res) => {
  const lessonId = req.params.id;
  const db = getDB();
  const comments = db.comments.filter(c => c.lessonId === lessonId);
  res.json(comments);
});

app.post('/api/content/lessons/:id/comments', requireAuth, (req, res) => {
  const lessonId = req.params.id;
  const email = (req as any).userEmail;
  const { text } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Texto do comentário não pode estar em branco.' });
    return;
  }

  const db = getDB();
  const entry = db.whitelist.find(i => i.email.toLowerCase() === email.toLowerCase());
  const name = entry ? entry.name : email.split('@')[0];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const newComment = {
    id: 'c-' + Date.now(),
    lessonId,
    userEmail: email,
    userName: name,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    avatarInitials: initials || 'AL'
  };

  db.comments.unshift(newComment);
  saveDB(db);

  res.json(newComment);
});

// 8. Lesson Rating
app.post('/api/content/lessons/:id/rating', requireAuth, (req, res) => {
  const lessonId = req.params.id;
  const email = (req as any).userEmail;
  const { rating } = req.body || {};

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Avaliação deve ser de 1 a 5 estrelas.' });
    return;
  }

  const db = getDB();
  if (!db.userProgress[email]) {
    db.userProgress[email] = { completedLessonIds: [], ratings: {} };
  }
  db.userProgress[email].ratings[lessonId] = rating;
  saveDB(db);

  res.json({ lessonId, rating });
});

// --- ADMIN ROUTES (WHITELIST & SECURITY MANAGEMENT) ---

function checkAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const providedKey = req.headers['x-admin-key'] as string || req.query.adminKey as string;
  const authHeader = req.headers.authorization;
  
  let isAuthorizedUser = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const email = verifySessionToken(token);
    if (email === 'guilherme@exemplo.com' || email === 'carlos@dominus.site') {
      isAuthorizedUser = true;
    }
  }

  if (providedKey === MASTER_ADMIN_KEY || isAuthorizedUser) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado ao painel de administração. Chave de administrador incorreta.' });
  }
}

// Get Whitelist
app.get('/api/admin/whitelist', checkAdminKey, (req, res) => {
  const db = getDB();
  res.json(db.whitelist);
});

// Add single email or Bulk Import CSV / Text
app.post('/api/admin/whitelist', checkAdminKey, (req, res) => {
  const { emails, name, notes, action } = req.body || {};
  const db = getDB();
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

  if (action === 'bulk_import' && typeof emails === 'string') {
    // Parse newline or comma separated emails
    const lines = emails.split(/[\n,;]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'));
    let addedCount = 0;
    
    lines.forEach(email => {
      if (!db.whitelist.some(item => item.email.toLowerCase() === email)) {
        db.whitelist.push({
          id: 'w-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          email,
          name: email.split('@')[0],
          purchaseDate: new Date().toISOString().split('T')[0],
          status: 'active',
          notes: 'Importado em lote da planilha'
        });
        addedCount++;
      }
    });

    saveDB(db);
    addAuditLog('admin', clientIp, 'WHITELIST_UPDATED', `Importação em lote realizada: ${addedCount} novos e-mails adicionados.`, true);
    res.json({ success: true, count: addedCount, total: db.whitelist.length });
    return;
  }

  // Single add
  const emailRaw = req.body?.email;
  if (!emailRaw || typeof emailRaw !== 'string' || !emailRaw.includes('@')) {
    res.status(400).json({ error: 'E-mail inválido.' });
    return;
  }
  const email = emailRaw.trim().toLowerCase();

  const existingIndex = db.whitelist.findIndex(i => i.email.toLowerCase() === email);
  if (existingIndex > -1) {
    // update status
    db.whitelist[existingIndex].status = req.body?.status || 'active';
    db.whitelist[existingIndex].name = name || db.whitelist[existingIndex].name;
    db.whitelist[existingIndex].notes = notes || db.whitelist[existingIndex].notes;
  } else {
    db.whitelist.push({
      id: 'w-' + Date.now(),
      email,
      name: name || email.split('@')[0],
      purchaseDate: new Date().toISOString().split('T')[0],
      status: req.body?.status || 'active',
      notes: notes || 'Adicionado manualmente pelo Admin'
    });
  }

  saveDB(db);
  addAuditLog('admin', clientIp, 'WHITELIST_UPDATED', `E-mail ${email} atualizado/adicionado na lista de autorizados.`, true);

  res.json({ success: true, whitelist: db.whitelist });
});

// Delete from whitelist
app.delete('/api/admin/whitelist/:id', checkAdminKey, (req, res) => {
  const id = req.params.id;
  const db = getDB();
  const clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

  const entry = db.whitelist.find(i => i.id === id);
  db.whitelist = db.whitelist.filter(i => i.id !== id);
  saveDB(db);

  if (entry) {
    addAuditLog('admin', clientIp, 'WHITELIST_UPDATED', `Removido e-mail ${entry.email} da lista de autorizados.`, true);
  }

  res.json({ success: true, whitelist: db.whitelist });
});

// Get Google Sheet Sync Config
app.get('/api/admin/google-sheet-config', checkAdminKey, (req, res) => {
  const db = getDB();
  res.json({
    googleSheetUrl: db.googleSheetUrl || '',
    lastGoogleSheetSync: db.lastGoogleSheetSync || null,
    strictGoogleSheetOnly: db.strictGoogleSheetOnly || false,
    totalSyncedCount: db.whitelist.length
  });
});

// Update Google Sheet URL & Trigger Sync
app.post('/api/admin/google-sheet-sync', checkAdminKey, async (req, res) => {
  const { sheetUrl, strictGoogleSheetOnly } = req.body || {};
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const db = getDB();

  const targetUrl = sheetUrl || db.googleSheetUrl;
  if (!targetUrl) {
    res.status(400).json({ error: 'Insira o link da planilha do Google Sheets.' });
    return;
  }

  if (strictGoogleSheetOnly !== undefined) {
    db.strictGoogleSheetOnly = Boolean(strictGoogleSheetOnly);
    saveDB(db);
  }

  const result = await syncFromGoogleSheet(targetUrl);

  if (result.success) {
    addAuditLog('admin', clientIp, 'WHITELIST_UPDATED', `Sincronização com Google Sheets realizada. Total de alunos autorizados: ${result.emails.length}.`, true);
    res.json({
      success: true,
      googleSheetUrl: targetUrl,
      count: result.count,
      totalSyncedCount: result.emails.length,
      lastGoogleSheetSync: new Date().toISOString()
    });
  } else {
    addAuditLog('admin', clientIp, 'WHITELIST_UPDATED', `Falha na sincronização com Google Sheets: ${result.error}`, false);
    res.status(400).json({ error: result.error });
  }
});

// Get Audit Logs
app.get('/api/admin/audit-logs', checkAdminKey, (req, res) => {
  const db = getDB();
  res.json(db.auditLogs);
});

// Update Lesson Video URL / Info
app.put('/api/admin/lessons/:id', checkAdminKey, (req, res) => {
  const lessonId = req.params.id;
  const { title, videoUrl, description, notes } = req.body || {};
  const db = getDB();

  let updated = false;
  for (const mod of db.modules) {
    const les = mod.lessons.find(l => l.id === lessonId);
    if (les) {
      if (title) les.title = title;
      if (videoUrl) les.videoUrl = videoUrl;
      if (description) les.description = description;
      if (notes !== undefined) les.notes = notes;
      updated = true;
      break;
    }
  }

  if (updated) {
    saveDB(db);
    res.json({ success: true, message: 'Aula atualizada com sucesso!' });
  } else {
    res.status(404).json({ error: 'Aula não encontrada.' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
