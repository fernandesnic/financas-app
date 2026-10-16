import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { importarNotificacoes } from '@/notificacoes/importar';
import { acessoConcedido, religar } from '../../modules/notificacoes';
import { useMes } from '@/mes';

// Não aparece na tela. Importa as notificações ao abrir o app e sempre que ele volta para a frente.
export function Importador() {
  const db = useSQLiteContext();
  const { atualizar } = useMes();

  useEffect(() => {
    const rodar = () => {
      if (acessoConcedido()) religar(); // garante que o serviço está ouvindo (ex: depois de atualizar o app)
      return importarNotificacoes(db).then((n) => n > 0 && atualizar()).catch(() => {});
    };
    rodar();
    const sub = AppState.addEventListener('change', (estado) => estado === 'active' && rodar());
    return () => sub.remove();
  }, [db, atualizar]);

  return null;
}
