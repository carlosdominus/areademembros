export type Aula = {
  id: string;
  titulo: string;
  descricao: string;
  duracaoMin: number;
  concluida: boolean;
  materialAnexo?: {
    nome: string;
    url: string;
  };
};

export type Modulo = {
  id: string;
  ordem: number;
  titulo: string;
  capaUrl?: string;
  aulas: Aula[];
};

export const modulosIniciaisMock: Modulo[] = [
  {
    id: 'mod-1',
    ordem: 1,
    titulo: '1. Apresentação',
    capaUrl: '/capas/m1.webp',
    aulas: [
      {
        id: 'aula-1-1',
        titulo: 'Bem-vindo à Mentoria e Visão Geral',
        descricao: 'Entenda os pilares do método, como funciona o suporte e o passo a passo para extrair o máximo de resultado da plataforma.',
        duracaoMin: 6,
        concluida: false,
        materialAnexo: {
          nome: 'Guia_de_Inicio_Rapido.pdf',
          url: '#'
        }
      },
      {
        id: 'aula-1-2',
        titulo: 'Mentalidade e Foco de Execução',
        descricao: 'Como alinhar suas expectativas, organizar sua rotina semanal e manter a consistência até o resultado.',
        duracaoMin: 12,
        concluida: false
      },
      {
        id: 'aula-1-3',
        titulo: 'Acesso à Comunidade VIP e Canais Oficiais',
        descricao: 'Como interagir com mentores, tirar dúvidas diariamente e participar dos encontros ao vivo.',
        duracaoMin: 8,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-2',
    ordem: 2,
    titulo: '2. Spy/Espionagem',
    capaUrl: '/capas/m2.webp',
    aulas: [
      {
        id: 'aula-2-1',
        titulo: 'Ferramentas Secretas de Espionagem de Anúncios',
        descricao: 'Aprenda a mapear ofertas validadas em tempo real utilizando bibliotecas de anúncios e mineradores.',
        duracaoMin: 18,
        concluida: false,
        materialAnexo: {
          nome: 'Lista_Ferramentas_Espionagem.pdf',
          url: '#'
        }
      },
      {
        id: 'aula-2-2',
        titulo: 'Como Desconstruir Funis Campeões dos Concorrentes',
        descricao: 'Análise detalhada de páginas, copys, criativos e upsells das operações que mais faturam no mercado.',
        duracaoMin: 24,
        concluida: false
      },
      {
        id: 'aula-2-3',
        titulo: 'Mapeamento de Métricas e Padrões de Sucesso',
        descricao: 'Identifique os elementos visuais e ganchos que estão gerando engajamento e alta conversão no momento.',
        duracaoMin: 16,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-3',
    ordem: 3,
    titulo: '3. Copywriting',
    capaUrl: '/capas/m3.webp',
    aulas: [
      {
        id: 'aula-3-1',
        titulo: 'Fundamentos da Copy de Alta Conversão',
        descricao: 'A ciência por trás dos desejos humanos e gatilhos mentais que acionam a decisão imediata de compra.',
        duracaoMin: 20,
        concluida: false
      },
      {
        id: 'aula-3-2',
        titulo: 'Roteiros de VSL e Copys Magnéticas',
        descricao: 'Estruturação passo a passo da narrativa de vendas: gancho, história, mecanismo único e oferta.',
        duracaoMin: 28,
        concluida: false,
        materialAnexo: {
          nome: 'Template_Roteiro_VSL_Editavel.docx',
          url: '#'
        }
      },
      {
        id: 'aula-3-3',
        titulo: 'Headlines, Bullets e Quebra de Objeções',
        descricao: 'Modelos práticos para criar títulos chamativos e desarmar as dúvidas do cliente antes do checkout.',
        duracaoMin: 15,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-4',
    ordem: 4,
    titulo: '4. Edição de vídeo',
    capaUrl: '/capas/m4.webp',
    aulas: [
      {
        id: 'aula-4-1',
        titulo: 'Configuração do Software e Workflow Rápido',
        descricao: 'Aprenda a organizar seus projetos de vídeo para cortar e editar na metade do tempo.',
        duracaoMin: 14,
        concluida: false
      },
      {
        id: 'aula-4-2',
        titulo: 'Cortes Dinâmicos e Ganchos nos Primeiros 3 Segundos',
        descricao: 'Técnicas de edição focadas em manter a retenção máxima do usuário nas redes sociais.',
        duracaoMin: 22,
        concluida: false
      },
      {
        id: 'aula-4-3',
        titulo: 'Legendas Animadas, SFX e Efeitos de Impacto',
        descricao: 'Como aplicar efeitos sonoros e elementos visuais para destacar pontos-chave do seu anúncio.',
        duracaoMin: 19,
        concluida: false,
        materialAnexo: {
          nome: 'Pack_Efeitos_Sonoros_e_Overlay.zip',
          url: '#'
        }
      }
    ]
  },
  {
    id: 'mod-5',
    ordem: 5,
    titulo: '5. Estrutura',
    capaUrl: '/capas/m5.webp',
    aulas: [
      {
        id: 'aula-5-1',
        titulo: 'Construindo a Página de Vendas de Alta Velocidade',
        descricao: 'Layout limpo, carregamento ultrarrápido em mobile e otimização da experiência do usuário.',
        duracaoMin: 25,
        concluida: false
      },
      {
        id: 'aula-5-2',
        titulo: 'Integração de Checkout, Pix e Cartão',
        descricao: 'Configuração técnica dos meios de pagamento e recuperação de vendas via WhatsApp.',
        duracaoMin: 17,
        concluida: false
      },
      {
        id: 'aula-5-3',
        titulo: 'Domínios, Pixel de Rastreamento e Segurança',
        descricao: 'Instalação de scripts de métrica para garantir que seu tráfego meça todas as conversões.',
        duracaoMin: 18,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-6',
    ordem: 6,
    titulo: '6. Tráfego',
    capaUrl: '/capas/m6.webp',
    aulas: [
      {
        id: 'aula-6-1',
        titulo: 'Estratégia de Campanhas e Estrutura de Testes',
        descricao: 'Como organizar conjuntos de anúncios para validar criativos e públicos com baixo orçamento.',
        duracaoMin: 21,
        concluida: false
      },
      {
        id: 'aula-6-2',
        titulo: 'Análise de Métricas: CPA, CTR, ROAS e CPM',
        descricao: 'Aprenda a ler o gerenciador de anúncios e tomar decisões baseadas em dados concretos.',
        duracaoMin: 26,
        concluida: false,
        materialAnexo: {
          nome: 'Planilha_Calculadora_de_ROAS.xlsx',
          url: '#'
        }
      },
      {
        id: 'aula-6-3',
        titulo: 'Otimização e Escala Horizontal e Vertical',
        descricao: 'Como duplicar orçamento e expandir para novos públicos sem perder a lucratividade.',
        duracaoMin: 23,
        concluida: false
      }
    ]
  },
  {
    id: 'mod-7',
    ordem: 7,
    titulo: '7. Gestão',
    capaUrl: '/capas/m7.webp',
    aulas: [
      {
        id: 'aula-7-1',
        titulo: 'Controle de Fluxo de Caixa e Margem Real',
        descricao: 'Como gerenciar receitas, custos de tráfego, impostos e taxas para manter a saúde financeira.',
        duracaoMin: 16,
        concluida: false,
        materialAnexo: {
          nome: 'Planilha_Gestao_Financeira.xlsx',
          url: '#'
        }
      },
      {
        id: 'aula-7-2',
        titulo: 'Suporte ao Cliente e LTV (Lifetime Value)',
        descricao: 'Estratégias para fidelizar clientes, reduzir reembolsos e vender produtos adicionais (upsell).',
        duracaoMin: 20,
        concluida: false
      },
      {
        id: 'aula-7-3',
        titulo: 'Organização de Processos e Formação de Equipe',
        descricao: 'Como delegar tarefas operacionais e focar exclusivamente no crescimento estratégico do negócio.',
        duracaoMin: 18,
        concluida: false
      }
    ]
  }
];
