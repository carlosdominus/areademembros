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
      nome: 'Carlos Gabriel',
      ativo: true,
      turma: 'Turma 1 - Mentoria Dominus'
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
  const aulas = [
    {
      id: 'aula-1-1',
      moduloId: 'mod-1',
      ordem: 1,
      titulo: 'Apresentação do curso',
      descricao: 'Boas-vindas oficiais à mentoria, visão geral da jornada, estrutura do treinamento e alinhamento do método.',
      duracaoMin: 6,
      vturbEmbedId: '6a95dfa8ce382b7f4fcc9073',
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-1',
      moduloId: 'mod-2',
      ordem: 1,
      titulo: '1. Nível ético',
      descricao: 'Diretrizes éticas e fundamentos essenciais para espionagem e modelagem de ofertas com inteligência e responsabilidade.',
      duracaoMin: 8,
      vturbEmbedId: '6a95dfd67e1edfe862b04295',
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-2',
      moduloId: 'mod-2',
      ordem: 2,
      titulo: '2. Escolhendo ofertas',
      descricao: 'Como minerar, filtrar e escolher as melhores ofertas validadas com alta conversão e potencial de escala imediata.',
      duracaoMin: 15,
      vturbEmbedId: '6a95e05d672b403ce783c154',
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-3',
      moduloId: 'mod-2',
      ordem: 3,
      titulo: '3. Métodos de espionagem',
      descricao: 'Ferramentas práticas e métodos avançados para mapear criativos, copys e páginas que mais vendem no mercado.',
      duracaoMin: 18,
      vturbEmbedId: '6a95e0b93d6810235ec56d20',
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-4',
      moduloId: 'mod-2',
      ordem: 4,
      titulo: '4. Camuflagem',
      descricao: 'Técnicas de camuflagem e diferenciação para blindar sua esteira, proteger suas páginas e evitar saturação.',
      duracaoMin: 12,
      vturbEmbedId: '6a95e03601d8c35eb9bcc39e',
      materialUrl: null,
      publicado: true
    },
    {
      id: 'aula-2-5',
      moduloId: 'mod-2',
      ordem: 5,
      titulo: '5. Próximo passo',
      descricao: 'Orientações práticas de execução, checklist das etapas concluídas e direcionamento para a próxima fase.',
      duracaoMin: 10,
      vturbEmbedId: '6a95e000390d4bd1764abbea',
      materialUrl: null,
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
