// src/types.ts

export interface User {
  id?: number;
  name: string;
  email: string;
  // passwordHash removido por segurança (não deve ficar no frontend)
  role?: string;   // 'admin', 'leader', 'user'
  sector?: string; // 'SOLDA', 'GERAL', etc.
}

export type InventoryStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'INVENTARIADO' | 'REVISAO';

export interface TeamLeader {
  id: number;
  name: string;
}

// Interface atualizada para o processo de inventário
export interface InventoryItem {
  id?: number;
  user_id?: number; // Importante para saber quem criou

  // Dados do Sistema (Vêm do cadastro mestre/importação)
  codigo: string;
  cod_anterior?: string;
  descricao: string;
  tipo: string;           // ex: MC, MP, PA
  unidade_sistema: string; // Unidade cadastrada no ERP
  cod_barras?: string;

  // Dados Fiscais/Outros (Mantidos do legado)
  aliq_ipi?: number;
  seg_un_medi?: string;
  fator_conv?: number;
  tipo_de_conv?: string;
  origem?: string;
  grupo_trib?: string;
  cod_gtin?: string;
  materia_pri?: string;
  cest?: string;
  blq_de_te?: string;

  // Dados da Contagem (Preenchidos pelo Digitador)
  digitador_nome?: string;       // Quem contou
  lider_equipe: string;         // Responsável pelo setor/contagem
  armazem: string;              // 01, 02, 04, 98, 13
  codigo_etiqueta: string;      // Input manual - "Número da Ficha"
  unidade_contagem: string;     // Para conferência visual
  usou_balanca: boolean;        // Define a tolerância

  // --- AJUSTE CRÍTICO AQUI ---
  // Aceita number[] (Front) ou number (Back legado) ou any (para evitar crash)
  contagens: number[] | any;

  // Campos legados para compatibilidade
  qtde_contagem_1?: number;
  qtde_contagem_2?: number;

  // Lógica de Negócio
  diferenca: number;           // Última diferença calculada
  status: InventoryStatus;
  proxima_acao?: string;       // Ex: "Realizar 3ª Contagem"

  // Data vem como string do JSON do servidor
  created_at?: string | Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ImportStats {
  total: number;
  success: number;
  errors: number;
  timeElapsed: number;
}

// Interface auxiliar para o "Autocomplete" (Simula o ERP)
export interface ProductCatalog {
  codigo: string;
  descricao: string;
  tipo: string;
  unidade: string;
  cod_barras: string;
}