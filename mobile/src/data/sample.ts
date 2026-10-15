import { colors } from '@/theme';

// Dados de EXEMPLO (outubro). Na etapa 2 isso vem do banco SQLite.
export const mes = {
  nome: 'Outubro 2026',
  entradas: 2950,
  saidas: 1193,
};

export const sobra = mes.entradas - mes.saidas;

export const categorias = [
  { nome: 'Cartão', valor: 740, cor: colors.cartao },
  { nome: 'Parcelas', valor: 227, cor: colors.parcelas },
  { nome: 'Assinaturas', valor: 140, cor: colors.assinaturas },
  { nome: 'Moradia', valor: 86, cor: colors.moradia },
];

export const paraClassificar = 3;

export const guardado = {
  total: 3000,
  reserva: { nome: 'Reserva de emergência', atual: 1800, meta: 6000 },
};

// Lançamentos de exemplo. tipo: 'entrada' ou 'saida'. Valor sempre positivo.
export type Lancamento = {
  id: string;
  descricao: string;
  categoria: string; // nome da categoria
  detalhe?: string; // ex: "fixo mensal"
  valor: number;
  tipo: 'entrada' | 'saida';
  dia: string; // por enquanto texto; no banco vira data
};

// Cor de fundo clarinha de cada categoria (para o ícone redondo)
export const fundoCategoria: Record<string, string> = {
  Salário: '#E3F5EE',
  Cartão: '#FDF3DB',
  Parcelas: '#FCE8E1',
  Assinaturas: '#EFEAFC',
  Moradia: '#E5F0FB',
};

export const corCategoria: Record<string, string> = {
  Salário: colors.green,
  Cartão: colors.cartao,
  Parcelas: colors.parcelas,
  Assinaturas: colors.assinaturas,
  Moradia: colors.moradia,
};

export const lancamentos: Lancamento[] = [
  { id: '1', descricao: 'Salário', categoria: 'Salário', valor: 2950, tipo: 'entrada', dia: '15 de outubro' },
  { id: '2', descricao: 'Adiantamento de parcelas', categoria: 'Cartão', valor: 580, tipo: 'saida', dia: '15 de outubro' },
  { id: '3', descricao: 'Fatura do cartão', categoria: 'Cartão', valor: 160, tipo: 'saida', dia: '15 de outubro' },
  { id: '4', descricao: 'Parcela da TV', categoria: 'Parcelas', detalhe: 'repete até jun/2027', valor: 227, tipo: 'saida', dia: '15 de outubro' },
  { id: '5', descricao: 'Claude', categoria: 'Assinaturas', detalhe: 'fixo mensal', valor: 110, tipo: 'saida', dia: '15 de outubro' },
  { id: '6', descricao: 'Conta de água', categoria: 'Moradia', valor: 86, tipo: 'saida', dia: '15 de outubro' },
  { id: '7', descricao: 'Amazon', categoria: 'Assinaturas', detalhe: 'fixo mensal', valor: 15, tipo: 'saida', dia: '15 de outubro' },
  { id: '8', descricao: 'Spotify', categoria: 'Assinaturas', detalhe: 'fixo mensal', valor: 15, tipo: 'saida', dia: '15 de outubro' },
];
