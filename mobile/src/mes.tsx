import React, { createContext, useContext, useMemo, useState } from 'react';
import { somarMeses, ymAtual } from '@/datas';

// Guarda qual mês está sendo visto (Painel e Extrato usam o mesmo).
type Ctx = { ym: string; voltar: () => void; avancar: () => void; hoje: () => void };
const MesCtx = createContext<Ctx | null>(null);

export function MesProvider({ children }: { children: React.ReactNode }) {
  const [ym, setYm] = useState(ymAtual());
  const valor = useMemo<Ctx>(
    () => ({
      ym,
      voltar: () => setYm((v) => somarMeses(v, -1)),
      avancar: () => setYm((v) => somarMeses(v, 1)),
      hoje: () => setYm(ymAtual()),
    }),
    [ym],
  );
  return <MesCtx.Provider value={valor}>{children}</MesCtx.Provider>;
}

export function useMes(): Ctx {
  const c = useContext(MesCtx);
  if (!c) throw new Error('useMes precisa estar dentro de MesProvider');
  return c;
}
