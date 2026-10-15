import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { somarMeses, ymAtual } from '@/datas';

// Guarda qual mês está sendo visto (Painel e Extrato usam o mesmo).
type Ctx = { ym: string; versao: number; voltar: () => void; avancar: () => void; hoje: () => void; atualizar: () => void };
const MesCtx = createContext<Ctx | null>(null);

export function MesProvider({ children }: { children: React.ReactNode }) {
  const [ym, setYm] = useState(ymAtual());
  const [versao, setVersao] = useState(0);
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);
  const valor = useMemo<Ctx>(
    () => ({
      ym,
      versao,
      atualizar,
      voltar: () => setYm((v) => somarMeses(v, -1)),
      avancar: () => setYm((v) => somarMeses(v, 1)),
      hoje: () => setYm(ymAtual()),
    }),
    [ym, versao, atualizar],
  );
  return <MesCtx.Provider value={valor}>{children}</MesCtx.Provider>;
}

export function useMes(): Ctx {
  const c = useContext(MesCtx);
  if (!c) throw new Error('useMes precisa estar dentro de MesProvider');
  return c;
}
