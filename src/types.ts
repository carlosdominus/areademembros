export interface Aula {
  id: string;
  moduloId: string;
  ordem: number;
  titulo: string;
  descricao: string;
  duracaoMin: number;
  vturbEmbedId: string;
  materialUrl: string | null;
  publicado: boolean;
  concluida?: boolean;
  avaliacao?: number | null;
  materialAnexo?: {
    nome: string;
    url: string;
  } | null;
}

export interface Modulo {
  id: string;
  ordem: number;
  titulo: string;
  capaUrl?: string;
  publicado: boolean;
  aulas: Aula[];
}

export interface ProgressoAula {
  concluida: boolean;
  avaliacao: number | null;
  atualizadoEm?: any;
}

export interface Autorizado {
  nome: string;
  ativo: boolean;
  turma?: string;
  criadoEm?: any;
}

export interface UserSession {
  uid: string;
  email: string;
  nome: string;
  turma?: string;
}

// Compatibility types for unused auxiliary components
export type Lesson = Aula;
export type Module = Modulo;

export interface Comment {
  id: string;
  lessonId: string;
  userEmail: string;
  userName: string;
  text: string;
  createdAt: string;
  avatarInitials: string;
}

export interface WhitelistEntry {
  id: string;
  email: string;
  name: string;
  purchaseDate: string;
  status: 'active' | 'suspended';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  email: string;
  ip: string;
  action: string;
  details: string;
  success: boolean;
}

export interface CourseData {
  modules: Modulo[];
  totalLessons: number;
}
