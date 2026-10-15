import type { SQLiteDatabase } from 'expo-sqlite';
import { categoriaPorNome, conciliar, sugerirCategoria } from '@/db';
import { confirmar, lerPendentes, notificacoesDisponivel } from '../../modules/notificacoes';
import { interpretar } from './parser';

function dataLocal(ms: number): string {
  const d = new Date(ms);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// Passa as notificações guardadas pelo Android para o banco do app.
// Devolve quantos lançamentos novos foram criados.
export async function importarNotificacoes(db: SQLiteDatabase): Promise<number> {
  if (!notificacoesDisponivel) return 0;
  const itens = lerPendentes();
  if (itens.length === 0) return 0;

  let criados = 0;
  for (const n of itens) {
    // evita duplicata: mesma chave, ou mesmo texto do mesmo app em menos de 2 minutos
    const repetida = await db.getFirstAsync(
      'SELECT id FROM notificacoes_brutas WHERE chave=? OR (pacote=? AND titulo=? AND texto=? AND ABS(quando-?)<120000)',
      [n.chave, n.pacote, n.titulo, n.texto, n.quando],
    );
    if (repetida) continue;

    const r = interpretar(n);
    let resultado = 'nao_entendi';
    let lancId: number | null = null;

    if (r.tipo === 'ignorar') {
      resultado = 'ignorado';
    } else if (r.tipo === 'lancamento') {
      // é o pagamento de um fixo/parcela que já estava previsto? Então só confirma, sem duplicar.
      const previsto = r.direcao === 'saida'
        ? await conciliar(db, { valor: r.valor, data: dataLocal(n.quando), texto: `${n.titulo} ${n.texto}` })
        : null;
      if (previsto != null) {
        await db.runAsync(
          'INSERT OR IGNORE INTO notificacoes_brutas (chave, pacote, titulo, texto, quando, resultado, lancamento_id) VALUES (?,?,?,?,?,?,?)',
          [n.chave, n.pacote, n.titulo, n.texto, n.quando, 'lancado', previsto],
        );
        continue;
      }
      let categoriaId: number | null = null;
      if (r.categoriaAuto) {
        categoriaId = await categoriaPorNome(db, r.categoriaAuto, r.direcao);
      } else {
        // categoria aprendida antes (só vale se for do mesmo tipo: entrada/saída)
        const aprendida = await sugerirCategoria(db, r.descricao);
        if (aprendida != null) {
          const c = await db.getFirstAsync<{ tipo: string }>('SELECT tipo FROM categorias WHERE id=?', [aprendida]);
          if (c && c.tipo === r.direcao) categoriaId = aprendida;
        }
      }
      const ins = await db.runAsync(
        `INSERT INTO lancamentos (descricao, valor, tipo, categoria_id, data, origem)
         VALUES (?,?,?,?,?, 'notificacao')`,
        [r.descricao, r.valor, r.direcao, categoriaId, dataLocal(n.quando)],
      );
      lancId = ins.lastInsertRowId;
      resultado = 'lancado';
      criados++;
    }

    await db.runAsync(
      'INSERT OR IGNORE INTO notificacoes_brutas (chave, pacote, titulo, texto, quando, resultado, lancamento_id) VALUES (?,?,?,?,?,?,?)',
      [n.chave, n.pacote, n.titulo, n.texto, n.quando, resultado, lancId],
    );
  }

  confirmar(itens.length);
  return criados;
}
