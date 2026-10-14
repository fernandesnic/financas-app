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
