import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read firebase applet config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let projectId = 'gen-lang-client-0254253171';
let databaseId = 'ai-studio-caktomentoriarea-892b0e3b-a28a-4a10-bbe4-735db8b8db67';

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.projectId) projectId = config.projectId;
  if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId,
  });
}

const db = getFirestore(databaseId);

async function seed() {
  console.log(`🌱 Seeding Firestore database: ${databaseId} in project: ${projectId}...`);

  // 1. Autorizados
  const autorizados = [
    {
      email: 'carlos@dominus.site',
      nome: 'Carlos Guilherme',
      ativo: true,
      turma: 'Turma 1 - Mentoria Dominus'
    },
    {
      email: 'aluno@exemplo.com',
      nome: 'Aluno Exemplo',
      ativo: true,
      turma: 'Turma 1'
    },
    {
      email: 'bloqueado@exemplo.com',
      nome: 'Aluno Inativo',
      ativo: false,
      turma: 'Turma 1'
    }
  ];

  for (const auth of autorizados) {
    const docId = auth.email.toLowerCase();
    await db.collection('autorizados').doc(docId).set({
      nome: auth.nome,
      ativo: auth.ativo,
      turma: auth.turma,
      criadoEm: Timestamp.now()
    });
    console.log(`  ✅ Autorizado adicionado: ${docId} (ativo: ${auth.ativo})`);
  }

  // 2. Módulos
  const modulos = [
    {
      id: 'mod-1',
      ordem: 1,
      titulo: '1. Apresentação',
      capaUrl: 'https://membros.dominus.site/images/m1_converted.webp',
      publicado: true
    },
    {
      id: 'mod-2',
      ordem: 2,
      titulo: '2. Spy/Espionagem',
      capaUrl: 'https://membros.dominus.site/images/m2_converted.webp',
      publicado: true
    },
    {
      id: 'mod-3',
      ordem: 3,
      titulo: '3. Copywriting',
      capaUrl: 'https://membros.dominus.site/images/m3_converted.webp',
      publicado: true
    },
    {
      id: 'mod-4',
      ordem: 4,
      titulo: '4. Edição de vídeo',
      capaUrl: 'https://membros.dominus.site/images/m4_converted.webp',
      publicado: true
    },
    {
      id: 'mod-5',
      ordem: 5,
      titulo: '5. Estrutura',
      capaUrl: 'https://membros.dominus.site/images/m5_converted.webp',
      publicado: true
    },
    {
      id: 'mod-6',
      ordem: 6,
      titulo: '6. Tráfego',
      capaUrl: 'https://membros.dominus.site/images/m6_converted.webp',
      publicado: true
    },
    {
      id: 'mod-7',
      ordem: 7,
      titulo: '7. Gestão',
      capaUrl: 'https://membros.dominus.site/images/m7_converted.webp',
      publicado: true
    }
  ];

  for (const mod of modulos) {
    await db.collection('modulos').doc(mod.id).set({
      ordem: mod.ordem,
      titulo: mod.titulo,
      capaUrl: mod.capaUrl,
      publicado: mod.publicado
    });
    console.log(`  ✅ Módulo criado: ${mod.id} - ${mod.titulo}`);
  }

  // 3. Aulas
  const testVTurbId = '67041a0e9a7e02000b12b50d'; // VTurb Test Player ID

  const aulas = [
    {
      id: 'aula-1-1',
      moduloId: 'mod-1',
      ordem: 1,
      titulo: '01. Comece Por Aqui — Regras e Diretrizes da Mentoria',
      descricao: 'Apresentação oficial da mentoria, visão geral da jornada, mentalidade de alta performance e canais de suporte.',
      duracaoMin: 12,
      vturbEmbedId: testVTurbId,
      materialUrl: 'https://example.com/guia-boas-vindas.pdf',
      publicado: true
    },
    {
      id: 'aula-1-2',
      moduloId: 'mod-1',
      ordem: 2,
      titulo: '02. Como Aproveitar ao Máximo a Comunidade e Encontros Ao Vivo',
      descricao: 'Passo a passo estratégico para fazer networking com outros alunos, tirar dúvidas e participar dos encontros quinzenais.',
      duracaoMin: 18,
      vturbEmbedId: testVTurbId,
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-1',
      moduloId: 'mod-2',
      ordem: 1,
      titulo: '03. Estruturação da Oferta Irresistível de Alto Ticket',
      descricao: 'Como definir a proposta de valor, precificação premium e validação rápida no mercado sem desperdiçar recursos.',
      duracaoMin: 25,
      vturbEmbedId: testVTurbId,
      materialUrl: 'https://example.com/checklist-oferta.pdf',
      publicado: true
    },
    {
      id: 'aula-2-2',
      moduloId: 'mod-2',
      ordem: 2,
      titulo: '04. Funis de Atração e Conversão Exponencial',
      descricao: 'Engenharia de funis de alta conversão, modelos de páginas, cópias persuasivas e direcionamento de tráfego qualificado.',
      duracaoMin: 32,
      vturbEmbedId: testVTurbId,
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-3-1',
      moduloId: 'mod-3',
      ordem: 1,
      titulo: '05. Gestão de Equipe, Processos Enxutos e Automação',
      descricao: 'Sistemas de delegação, checklists operacionais, ferramentas de gestão e contratação de talentos A-player.',
      duracaoMin: 28,
      vturbEmbedId: testVTurbId,
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-3-2',
      moduloId: 'mod-3',
      ordem: 2,
      titulo: '06. Encerramento e Plano de Ação Individual para 90 Dias',
      descricao: 'Construção do seu roadmap individual para os próximos 90 dias com metas claras, marcos de receita e acompanhamento.',
      duracaoMin: 20,
      vturbEmbedId: testVTurbId,
      materialUrl: 'https://example.com/roadmap-90dias.pdf',
      publicado: true
    }
  ];

  for (const aula of aulas) {
    await db.collection('aulas').doc(aula.id).set({
      moduloId: aula.moduloId,
      ordem: aula.ordem,
      titulo: aula.titulo,
      descricao: aula.descricao,
      duracaoMin: aula.duracaoMin,
      vturbEmbedId: aula.vturbEmbedId,
      materialUrl: aula.materialUrl,
      publicado: aula.publicado
    });
    console.log(`  ✅ Aula criada: ${aula.id} - ${aula.titulo}`);
  }

  console.log('🎉 Seed concluído com sucesso!');
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
