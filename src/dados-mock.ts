import { Modulo, Aula } from './types';
export type { Modulo, Aula };

export const modulosIniciaisMock: Modulo[] = [
  {
    id: 'mod-0',
    ordem: 0,
    titulo: '0. Apresentação',
    capaUrl: 'https://membros.dominus.site/images/m1_converted.webp?v=2',
    mapaMentalUrl: 'https://mm.tt/map/4058967304?t=DdSrGTCUPi',
    publicado: true,
    bloqueado: false,
    aulas: [
      {
        id: 'aula-0-1',
        moduloId: 'mod-0',
        ordem: 1,
        titulo: 'Apresentação do curso',
        descricao: 'Boas-vindas oficiais à mentoria, visão geral da jornada, estrutura do treinamento e alinhamento do método.',
        duracaoMin: 9,
        vturbEmbedId: '6a95dfa8ce382b7f4fcc9073',
        materialUrl: null,
        publicado: true,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-1',
    ordem: 1,
    titulo: '1. Spy/Espionagem',
    capaUrl: 'https://membros.dominus.site/images/m2_converted.webp?v=2',
    mapaMentalUrl: 'https://mm.tt/map/4058963977?t=5Jtdtbsh1u',
    publicado: true,
    bloqueado: false,
    aulas: [
      {
        id: 'aula-1-1',
        moduloId: 'mod-1',
        ordem: 1,
        titulo: '1. Nivel Ético e escolha de nicho',
        descricao: 'Diretrizes éticas e fundamentos essenciais para espionagem e modelagem de ofertas com inteligência e responsabilidade.',
        duracaoMin: 7,
        vturbEmbedId: '6a95dfd67e1edfe862b04295',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-1-2',
        moduloId: 'mod-1',
        ordem: 2,
        titulo: '2. Escolhendo ofertas vencedoras',
        descricao: 'Como minerar, filtrar e escolher as melhores ofertas validadas com alta conversão e potencial de escala imediata.',
        duracaoMin: 8,
        vturbEmbedId: '6a95e05d672b403ce783c154',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-1-3',
        moduloId: 'mod-1',
        ordem: 3,
        titulo: '3. Métodos de Espionagem',
        descricao: 'Ferramentas práticas e métodos avançados para mapear criativos, copys e páginas que mais vendem no mercado.',
        duracaoMin: 31,
        vturbEmbedId: '6a95e0b93d6810235ec56d20',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-1-4',
        moduloId: 'mod-1',
        ordem: 4,
        titulo: '4. Camuflagem',
        descricao: 'Técnicas de camuflagem e diferenciação para blindar sua esteira, proteger suas páginas e evitar saturação.',
        duracaoMin: 15,
        vturbEmbedId: '6a95e03601d8c35eb9bcc39e',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-1-5',
        moduloId: 'mod-1',
        ordem: 5,
        titulo: '5. Espionagem na prática',
        descricao: 'Execução prática de espionagem na tela: analisando concorrentes, dissecando páginas de vendas e estruturando o funil.',
        duracaoMin: 60,
        vturbEmbedId: '6a9610f63d6810235ec58f50',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-1-6',
        moduloId: 'mod-1',
        ordem: 6,
        titulo: '6. Próximos passos',
        descricao: 'Orientações práticas de execução, checklist das etapas concluídas e direcionamento para a próxima fase.',
        duracaoMin: 4,
        vturbEmbedId: '6a95e000390d4bd1764abbea',
        materialUrl: null,
        publicado: true,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-2',
    ordem: 2,
    titulo: '2. Copywriting',
    capaUrl: 'https://membros.dominus.site/images/m3_converted.webp?v=2',
    mapaMentalUrl: 'https://mm.tt/map/4059717189?t=0LPGKnBTCE',
    publicado: true,
    bloqueado: false,
    aulas: [
      {
        id: 'aula-2-1',
        moduloId: 'mod-2',
        ordem: 1,
        titulo: '1. Conceitos e termos básicos',
        descricao: 'A ciência por trás dos desejos humanos e gatilhos mentais que acionam a decisão imediata de compra.',
        duracaoMin: 32,
        vturbEmbedId: '6a95fb7e56744c7de1306c9e',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-2-2',
        moduloId: 'mod-2',
        ordem: 2,
        titulo: '2. Modelagem de nutracêutico para info-produto',
        descricao: 'Estruturação passo a passo da narrativa de vendas: gancho, história, mecanismo único e oferta.',
        duracaoMin: 34,
        vturbEmbedId: '6a95fbe8390d4bd1764acfd4',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-2-3',
        moduloId: 'mod-2',
        ordem: 3,
        titulo: '3. Modelagem de idioma e mercado',
        descricao: 'Modelos práticos para criar títulos chamativos e desarmar as dúvidas do cliente antes do checkout.',
        duracaoMin: 6,
        vturbEmbedId: '6a95f6ecaa727d62256066f3',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-2-4',
        moduloId: 'mod-2',
        ordem: 4,
        titulo: '4. Modelando ofertas na prática.',
        descricao: 'Construção da oferta passo a passo na prática com exemplos e modelos validados.',
        duracaoMin: 0,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        emBreve: true,
        concluida: false
      },
      {
        id: 'aula-2-5',
        moduloId: 'mod-2',
        ordem: 5,
        titulo: '5. Copy para criativos.',
        descricao: 'Técnicas e roteiros para criar anúncios de alta conversão que prendem a atenção.',
        duracaoMin: 0,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        emBreve: true,
        concluida: false
      },
      {
        id: 'aula-2-6',
        moduloId: 'mod-2',
        ordem: 6,
        titulo: '6. Copy para VSL.',
        descricao: 'Estruturação completa de vídeos de vendas de alta escala para infoprodutos.',
        duracaoMin: 0,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        emBreve: true,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-3',
    ordem: 3,
    titulo: '3. Edição de vídeo',
    capaUrl: 'https://membros.dominus.site/images/m4_converted.webp?v=2',
    mapaMentalUrl: 'https://mm.tt/map/4094674389?t=ClMkMYZ2Fi',
    publicado: true,
    bloqueado: false,
    aulas: [
      {
        id: 'aula-3-1',
        moduloId: 'mod-3',
        ordem: 1,
        titulo: 'Configuração do Software e Workflow Rápido',
        descricao: 'Aprenda a organizar seus projetos de vídeo para cortar e editar na metade do tempo.',
        duracaoMin: 14,
        vturbEmbedId: '6ac7a9f3344b39bd83bb004a',
        proporcao: 2.3463,
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-3-2',
        moduloId: 'mod-3',
        ordem: 2,
        titulo: 'Cortes Dinâmicos e Ganchos nos Primeiros 3 Segundos',
        descricao: 'Técnicas de edição focadas em manter a retenção máxima do usuário nas redes sociais.',
        duracaoMin: 22,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-3-3',
        moduloId: 'mod-3',
        ordem: 3,
        titulo: 'Legendas Animadas, SFX e Efeitos de Impacto',
        descricao: 'Como aplicar efeitos sonoros e elementos visuais para destacar pontos-chave do seu anúncio.',
        duracaoMin: 19,
        vturbEmbedId: '',
        materialUrl: '#',
        publicado: true,
        concluida: false,
        materialAnexo: {
          nome: 'Pack_Efeitos_Sonoros_e_Overlay.zip',
          url: '#'
        }
      }
    ]
  },
  {
    id: 'mod-4',
    ordem: 4,
    titulo: '4. Estrutura',
    capaUrl: 'https://membros.dominus.site/images/m5_converted.webp?v=2',
    mapaMentalUrl: 'https://mm.tt/map/4094648162?t=ysFVNg2dWB',
    publicado: true,
    bloqueado: true,
    aulas: [
      {
        id: 'aula-4-1',
        moduloId: 'mod-4',
        ordem: 1,
        titulo: 'Construindo a Página de Vendas de Alta Velocidade',
        descricao: 'Layout limpo, carregamento ultrarrápido em mobile e otimização da experiência do usuário.',
        duracaoMin: 25,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-4-2',
        moduloId: 'mod-4',
        ordem: 2,
        titulo: 'Integração de Checkout, Pix e Cartão',
        descricao: 'Configuração técnica dos meios de pagamento e recuperação de vendas via WhatsApp.',
        duracaoMin: 17,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-4-3',
        moduloId: 'mod-4',
        ordem: 3,
        titulo: 'Domínios, Pixel de Rastreamento e Segurança',
        descricao: 'Instalação de scripts de métrica para garantir que seu tráfego meça todas as conversões.',
        duracaoMin: 18,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-5',
    ordem: 5,
    titulo: '5. Tráfego',
    capaUrl: 'https://membros.dominus.site/images/m6_converted.webp?v=2',
    publicado: true,
    bloqueado: true,
    aulas: [
      {
        id: 'aula-5-1',
        moduloId: 'mod-5',
        ordem: 1,
        titulo: 'Estratégia de Campanhas e Estrutura de Testes',
        descricao: 'Como organizar conjuntos de anúncios para validar criativos e públicos com baixo orçamento.',
        duracaoMin: 21,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-5-2',
        moduloId: 'mod-5',
        ordem: 2,
        titulo: 'Análise de Métricas: CPA, CTR, ROAS e CPM',
        descricao: 'Aprenda a ler o gerenciador de anúncios e tomar decisões baseadas em dados concretos.',
        duracaoMin: 26,
        vturbEmbedId: '',
        materialUrl: '#',
        publicado: true,
        concluida: false,
        materialAnexo: {
          nome: 'Planilha_Calculadora_de_ROAS.xlsx',
          url: '#'
        }
      },
      {
        id: 'aula-5-3',
        moduloId: 'mod-5',
        ordem: 3,
        titulo: 'Otimização e Escala Horizontal e Vertical',
        descricao: 'Como duplicar orçamento e expandir para novos públicos sem perder a lucratividade.',
        duracaoMin: 23,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-6',
    ordem: 6,
    titulo: '6. Gestão',
    capaUrl: 'https://membros.dominus.site/images/m7_converted.webp?v=2',
    publicado: true,
    bloqueado: true,
    aulas: [
      {
        id: 'aula-6-1',
        moduloId: 'mod-6',
        ordem: 1,
        titulo: 'Controle de Fluxo de Caixa e Margem Real',
        descricao: 'Como gerenciar receitas, custos de tráfego, impostos e taxas para manter a saúde financeira.',
        duracaoMin: 16,
        vturbEmbedId: '',
        materialUrl: '#',
        publicado: true,
        concluida: false,
        materialAnexo: {
          nome: 'Planilha_Gestao_Financeira.xlsx',
          url: '#'
        }
      },
      {
        id: 'aula-6-2',
        moduloId: 'mod-6',
        ordem: 2,
        titulo: 'Suporte ao Cliente e LTV (Lifetime Value)',
        descricao: 'Estratégias para fidelizar clientes, reduzir reembolsos e vender produtos adicionais (upsell).',
        duracaoMin: 20,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      },
      {
        id: 'aula-6-3',
        moduloId: 'mod-6',
        ordem: 3,
        titulo: 'Organização de Processos e Formação de Equipe',
        descricao: 'Como delegar tarefas operacionais e focar exclusivamente no crescimento estratégico do negócio.',
        duracaoMin: 18,
        vturbEmbedId: '',
        materialUrl: null,
        publicado: true,
        concluida: false
      }
    ]
  }
];

