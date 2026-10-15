import type { SQLiteDatabase } from 'expo-sqlite';
import { getConfig, setConfig } from '@/db';

export const CDI_PADRAO = 14.0; // usado enquanto não conseguir buscar o do dia

// Busca o CDI anual (% a.a.) do dia no Banco Central (série 4389) e guarda no celular.
// Se não houver internet, devolve o último valor guardado.
export async function carregarCdi(db: SQLiteDatabase): Promise<{ valor: number; data: string | null; atualizado: boolean }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json', { signal: ctrl.signal });
    clearTimeout(t);
    const j = (await r.json()) as { data: string; valor: string }[];
    const valor = parseFloat(j[0].valor);
    if (Number.isFinite(valor) && valor > 0) {
      await setConfig(db, 'cdi_anual', String(valor));
      await setConfig(db, 'cdi_data', j[0].data);
      return { valor, data: j[0].data, atualizado: true };
    }
  } catch {
    // sem internet ou API fora do ar: usa o guardado
  }
  const v = await getConfig(db, 'cdi_anual');
  return { valor: v ? parseFloat(v) : CDI_PADRAO, data: await getConfig(db, 'cdi_data'), atualizado: false };
}
