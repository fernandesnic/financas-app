import { requireOptionalNativeModule } from 'expo-modules-core';

// Ponte com o código Android que lê as notificações dos bancos.
// No Expo Go este módulo não existe (só na versão instalada do app).
type Nativo = {
  acessoConcedido(): boolean;
  abrirConfiguracoes(): void;
  lerPendentes(): string;
  confirmar(qtd: number): void;
};

const nativo = requireOptionalNativeModule<Nativo>('Notificacoes');

export const notificacoesDisponivel = nativo != null;
export const acessoConcedido = (): boolean => (nativo ? nativo.acessoConcedido() : false);
export const abrirConfiguracoes = (): void => nativo?.abrirConfiguracoes();
export const confirmar = (qtd: number): void => nativo?.confirmar(qtd);

export type NotificacaoCrua = {
  chave: string;
  pacote: string;
  titulo: string;
  texto: string;
  quando: number; // milissegundos
};

export function lerPendentes(): NotificacaoCrua[] {
  if (!nativo) return [];
  try {
    return JSON.parse(nativo.lerPendentes()) as NotificacaoCrua[];
  } catch {
    return [];
  }
}
