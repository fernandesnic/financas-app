import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

// Carrega dados do banco toda vez que a tela fica visível (ou quando "deps" muda).
// Devolve também "recarregar" para chamar depois de salvar/excluir algo.
export function useDados<T>(
  carregar: (db: SQLiteDatabase) => Promise<T>,
  inicial: T,
  deps: unknown[] = [],
) {
  const db = useSQLiteContext();
  const [dados, setDados] = useState<T>(inicial);
  const fn = useRef(carregar);
  fn.current = carregar;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recarregar = useCallback(async () => setDados(await fn.current(db)), [db, ...deps]);

  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar]),
  );

  return { dados, recarregar, db };
}
