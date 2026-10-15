import type { SQLiteDatabase } from 'expo-sqlite';
import { dataDoMes, difMeses, hojeISO, somarMeses, ymAtual } from '@/datas';

// ---------- Tipos ----------
export type Tipo = 'entrada' | 'saida';

export type Categoria = { id: number; nome: string; cor: string; tipo: Tipo; ignorar: number }; // ignorar=1: não entra nos totais (ex: Transferência)

export type Lancamento = {
  id: number;
  descricao: string;
  valor: number; // sempre positivo
  tipo: Tipo;
  categoria_id: number | null; // null = precisa classificar
  sugestao_id: number | null;
  data: string; // AAAA-MM-DD
  detalhe: string | null;
  origem: 'manual' | 'notificacao' | 'fixo' | 'parcela';
  fixo_id: number | null;
  parcelamento_id: number | null;
  categoria: string | null; // nome (vem do JOIN)
  cor: string | null;
  ignorar: number | null; // 1 = categoria que não entra nos totais
  conferido: number; // 0 = fixo/parcela previsto que ainda não foi pago de fato
};

export type Fixo = { id: number; descricao: string; valor: number; categoria_id: number; dia: number; categoria: string; cor: string };

export type Parcelamento = {
  id: number; descricao: string; valor_parcela: number; total: number;
  inicio: string; dia: number; categoria_id: number; categoria: string; cor: string;
};

export type Meta = { id: number; nome: string; atual: number; alvo: number; prazo: string };

export type Guardado = { id: number; nome: string; saldo: number; pct_cdi: number };

// ---------- Criação do banco ----------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL, cor TEXT NOT NULL, tipo TEXT NOT NULL,
  UNIQUE(nome, tipo)
);
CREATE TABLE IF NOT EXISTS lancamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL, valor REAL NOT NULL, tipo TEXT NOT NULL,
  categoria_id INTEGER, sugestao_id INTEGER,
  data TEXT NOT NULL, detalhe TEXT, origem TEXT NOT NULL DEFAULT 'manual',
  fixo_id INTEGER, parcelamento_id INTEGER
);
CREATE INDEX IF NOT EXISTS ix_lanc_data ON lancamentos(data);
CREATE TABLE IF NOT EXISTS fixos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL, valor REAL NOT NULL, categoria_id INTEGER NOT NULL, dia INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS parcelamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL, valor_parcela REAL NOT NULL, total INTEGER NOT NULL,
  inicio TEXT NOT NULL, dia INTEGER NOT NULL, categoria_id INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL, atual REAL NOT NULL DEFAULT 0, alvo REAL NOT NULL, prazo TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guardado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL, saldo REAL NOT NULL DEFAULT 0, pct_cdi REAL NOT NULL DEFAULT 100
);
CREATE TABLE IF NOT EXISTS regras (
  padrao TEXT PRIMARY KEY, categoria_id INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS config (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
`;

const CATEGORIAS: [string, string, Tipo][] = [
  ['Cartão', '#E8A317', 'saida'],
  ['Parcelas', '#E4572E', 'saida'],
  ['Assinaturas', '#7B5CE6', 'saida'],
  ['Moradia', '#2E7FD6', 'saida'],
  ['Alimentação', '#1FA37A', 'saida'],
  ['Transporte', '#0E8FB5', 'saida'],
  ['Saúde', '#D6457A', 'saida'],
  ['Lazer', '#9A5BD0', 'saida'],
  ['Outros', '#8794A6', 'saida'],
  ['Salário', '#087A55', 'entrada'],
  ['Reembolso', '#3B9C73', 'entrada'],
  ['Outros', '#6E8B7F', 'entrada'],
];

export async function migrar(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versao = v?.user_version ?? 0;

  if (versao < 1) {
    await db.execAsync(SCHEMA);
    const total = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM categorias');
    if (!total || total.n === 0) {
      for (const [nome, cor, tipo] of CATEGORIAS) {
        await db.runAsync('INSERT INTO categorias (nome, cor, tipo) VALUES (?,?,?)', [nome, cor, tipo]);
      }
    }
    const jaSemeou = await getConfig(db, 'exemplo_carregado');
    if (!jaSemeou) {
      await carregarExemplo(db);
      await setConfig(db, 'exemplo_carregado', '1');
    }
    await db.execAsync('PRAGMA user_version = 1');
  }

  if (versao < 2) {
    // Notificações: categoria "Transferência" (não entra nos totais) e registro das notificações lidas
    await db.execAsync('ALTER TABLE categorias ADD COLUMN ignorar INTEGER NOT NULL DEFAULT 0');
    for (const tipo of ['saida', 'entrada']) {
      await db.runAsync('INSERT OR IGNORE INTO categorias (nome, cor, tipo, ignorar) VALUES (?,?,?,1)', ['Transferência', '#9AA5B5', tipo]);
    }
    await db.execAsync(`CREATE TABLE IF NOT EXISTS notificacoes_brutas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT NOT NULL UNIQUE, pacote TEXT NOT NULL, titulo TEXT NOT NULL, texto TEXT NOT NULL,
      quando INTEGER NOT NULL, resultado TEXT NOT NULL, lancamento_id INTEGER
    )`);
    await db.execAsync('PRAGMA user_version = 2');
  }

  if (versao < 3) {
    // conferido=0: fixo/parcela "previsto". Vira 1 quando a notificação do pagamento chega (ou você marca como pago).
    await db.execAsync('ALTER TABLE lancamentos ADD COLUMN conferido INTEGER NOT NULL DEFAULT 1');
    await db.runAsync("UPDATE lancamentos SET conferido=0 WHERE origem IN ('fixo','parcela') AND substr(data,1,7) >= ?", [ymAtual()]);
    await db.execAsync('PRAGMA user_version = 3');
  }
}

async function catId(db: SQLiteDatabase, nome: string, tipo: Tipo): Promise<number> {
  const r = await db.getFirstAsync<{ id: number }>('SELECT id FROM categorias WHERE nome=? AND tipo=?', [nome, tipo]);
  return r!.id;
}

// Dados de exemplo (os mesmos do mockup). Dá para apagar pelo Painel.
async function carregarExemplo(db: SQLiteDatabase) {
  const ym = ymAtual();
  const cartao = await catId(db, 'Cartão', 'saida');
  const moradia = await catId(db, 'Moradia', 'saida');
  const assin = await catId(db, 'Assinaturas', 'saida');
  const parc = await catId(db, 'Parcelas', 'saida');
  const alim = await catId(db, 'Alimentação', 'saida');
  const salario = await catId(db, 'Salário', 'entrada');

  const add = (d: string, v: number, t: Tipo, c: number | null, dia: number, sug: number | null = null, origem = 'manual') =>
    db.runAsync(
      'INSERT INTO lancamentos (descricao, valor, tipo, categoria_id, sugestao_id, data, origem) VALUES (?,?,?,?,?,?,?)',
      [d, v, t, c, sug, dataDoMes(ym, dia), origem],
    );
  await add('Salário', 2950, 'entrada', salario, 15);
  await add('Adiantamento de parcelas', 580, 'saida', cartao, 15);
  await add('Fatura do cartão', 160, 'saida', cartao, 15);
  await add('Conta de água', 86, 'saida', moradia, 15);
  // Detectados nas notificações (sem categoria, para classificar)
  await add('Compra aprovada · MERCADO CENTRAL', 87.9, 'saida', null, 15, alim, 'notificacao');
  await add('Pix enviado · J. SILVA', 42, 'saida', null, 15, null, 'notificacao');
  await add('Pix recebido · M. SOUZA', 30, 'entrada', null, 15, null, 'notificacao');

  for (const [nome, valor] of [['Claude', 110], ['Amazon', 15], ['Spotify', 15]] as const) {
    await db.runAsync('INSERT INTO fixos (descricao, valor, categoria_id, dia) VALUES (?,?,?,?)', [nome, valor, assin, 15]);
  }
  await db.runAsync(
    'INSERT INTO parcelamentos (descricao, valor_parcela, total, inicio, dia, categoria_id) VALUES (?,?,?,?,?,?)',
    ['TV', 227, 9, '2026-10', 15, parc],
  );
  await db.runAsync(
    'INSERT INTO parcelamentos (descricao, valor_parcela, total, inicio, dia, categoria_id) VALUES (?,?,?,?,?,?)',
    ['Memória RAM', 736, 6, '2026-11', 15, parc],
  );
  await db.runAsync('INSERT INTO metas (nome, atual, alvo, prazo) VALUES (?,?,?,?)', ['Reserva de emergência', 1800, 6000, '2027-06']);
  await db.runAsync('INSERT INTO metas (nome, atual, alvo, prazo) VALUES (?,?,?,?)', ['Mudança de apartamento', 1200, 15000, '2027-10']);
  await db.runAsync('INSERT INTO guardado (nome, saldo, pct_cdi) VALUES (?,?,?)', ['Caixinha Santander', 3000, 100]);
}

export async function apagarExemplo(db: SQLiteDatabase) {
  for (const t of ['lancamentos', 'fixos', 'parcelamentos', 'metas', 'guardado', 'regras']) {
    await db.runAsync(`DELETE FROM ${t}`);
  }
  await db.runAsync('INSERT INTO guardado (nome, saldo, pct_cdi) VALUES (?,?,?)', ['Caixinha', 0, 100]);
}

// ---------- Config ----------
export async function getConfig(db: SQLiteDatabase, chave: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM config WHERE chave=?', [chave]);
  return r ? r.valor : null;
}
export async function setConfig(db: SQLiteDatabase, chave: string, valor: string) {
  await db.runAsync('INSERT INTO config (chave, valor) VALUES (?,?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor', [chave, valor]);
}

// ---------- Categorias ----------
export function listarCategorias(db: SQLiteDatabase, tipo?: Tipo): Promise<Categoria[]> {
  return tipo
    ? db.getAllAsync<Categoria>('SELECT * FROM categorias WHERE tipo=? ORDER BY id', [tipo])
    : db.getAllAsync<Categoria>('SELECT * FROM categorias ORDER BY id');
}

// ---------- Lançamentos ----------
const SELECT_LANC = `SELECT l.*, c.nome AS categoria, c.cor AS cor, c.ignorar AS ignorar
  FROM lancamentos l LEFT JOIN categorias c ON c.id = l.categoria_id`;

// Cria os lançamentos de fixos e parcelas que ainda não existem naquele mês.
export async function garantirMes(db: SQLiteDatabase, ym: string) {
  if (difMeses(ymAtual(), ym) > 24) return; // não gera muito longe no futuro
  const fixos = await db.getAllAsync<{ id: number; descricao: string; valor: number; categoria_id: number; dia: number }>('SELECT * FROM fixos');
  for (const f of fixos) {
    const ja = await db.getFirstAsync('SELECT id FROM lancamentos WHERE fixo_id=? AND substr(data,1,7)=?', [f.id, ym]);
    if (!ja) {
      await db.runAsync(
        `INSERT INTO lancamentos (descricao, valor, tipo, categoria_id, data, detalhe, origem, fixo_id, conferido)
         VALUES (?,?,'saida',?,?,?,'fixo',?,0)`,
        [f.descricao, f.valor, f.categoria_id, dataDoMes(ym, f.dia), 'fixo mensal', f.id],
      );
    }
  }
  const parcs = await db.getAllAsync<{ id: number; descricao: string; valor_parcela: number; total: number; inicio: string; dia: number; categoria_id: number }>('SELECT * FROM parcelamentos');
  for (const p of parcs) {
    const idx = difMeses(p.inicio, ym);
    if (idx < 0 || idx >= p.total) continue;
    const ja = await db.getFirstAsync('SELECT id FROM lancamentos WHERE parcelamento_id=? AND substr(data,1,7)=?', [p.id, ym]);
    if (!ja) {
      await db.runAsync(
        `INSERT INTO lancamentos (descricao, valor, tipo, categoria_id, data, detalhe, origem, parcelamento_id, conferido)
         VALUES (?,?,'saida',?,?,?,'parcela',?,0)`,
        [p.descricao, p.valor_parcela, p.categoria_id, dataDoMes(ym, p.dia), `parcela ${idx + 1}/${p.total}`, p.id],
      );
    }
  }
}

export function lancamentosDoMes(db: SQLiteDatabase, ym: string): Promise<Lancamento[]> {
  return db.getAllAsync<Lancamento>(`${SELECT_LANC} WHERE substr(l.data,1,7)=? ORDER BY l.data DESC, l.id DESC`, [ym]);
}

export function paraClassificar(db: SQLiteDatabase): Promise<Lancamento[]> {
  return db.getAllAsync<Lancamento>(`${SELECT_LANC} WHERE l.categoria_id IS NULL ORDER BY l.data DESC, l.id DESC`);
}

export async function inserirLancamento(
  db: SQLiteDatabase,
  d: { descricao: string; valor: number; tipo: Tipo; categoria_id: number | null; data?: string; origem?: string },
) {
  const sug = d.categoria_id == null ? await sugerirCategoria(db, d.descricao) : null;
  await db.runAsync(
    'INSERT INTO lancamentos (descricao, valor, tipo, categoria_id, sugestao_id, data, origem) VALUES (?,?,?,?,?,?,?)',
    [d.descricao, d.valor, d.tipo, d.categoria_id, sug, d.data ?? hojeISO(), d.origem ?? 'manual'],
  );
}

export async function excluirLancamento(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM lancamentos WHERE id=?', [id]);
}

// ---------- Aprendizado de categorias ----------
// Deixa a descrição "limpa": minúscula, sem acento, sem números nem símbolos.
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sugerirCategoria(db: SQLiteDatabase, descricao: string): Promise<number | null> {
  const r = await db.getFirstAsync<{ categoria_id: number }>('SELECT categoria_id FROM regras WHERE padrao=?', [normalizar(descricao)]);
  return r ? r.categoria_id : null;
}

// Define a categoria e "aprende": da próxima vez a mesma descrição já vem sugerida.
export async function classificar(db: SQLiteDatabase, lancId: number, categoriaId: number) {
  const l = await db.getFirstAsync<{ descricao: string }>('SELECT descricao FROM lancamentos WHERE id=?', [lancId]);
  await db.runAsync('UPDATE lancamentos SET categoria_id=? WHERE id=?', [categoriaId, lancId]);
  if (l) {
    await db.runAsync(
      'INSERT INTO regras (padrao, categoria_id) VALUES (?,?) ON CONFLICT(padrao) DO UPDATE SET categoria_id=excluded.categoria_id',
      [normalizar(l.descricao), categoriaId],
    );
    // aplica a regra nos outros pendentes com a mesma descrição
    await db.runAsync('UPDATE lancamentos SET sugestao_id=? WHERE categoria_id IS NULL AND id<>? AND sugestao_id IS NULL AND lower(descricao)=lower(?)', [categoriaId, lancId, l.descricao]);
  }
}

// ---------- Fixos e parcelamentos ----------
export function listarFixos(db: SQLiteDatabase): Promise<Fixo[]> {
  return db.getAllAsync<Fixo>('SELECT f.*, c.nome AS categoria, c.cor AS cor FROM fixos f JOIN categorias c ON c.id=f.categoria_id ORDER BY f.id');
}
export function listarParcelamentos(db: SQLiteDatabase): Promise<Parcelamento[]> {
  return db.getAllAsync<Parcelamento>('SELECT p.*, c.nome AS categoria, c.cor AS cor FROM parcelamentos p JOIN categorias c ON c.id=p.categoria_id ORDER BY p.inicio, p.id');
}

export async function criarFixo(db: SQLiteDatabase, d: { descricao: string; valor: number; categoria_id: number; dia: number }) {
  await db.runAsync('INSERT INTO fixos (descricao, valor, categoria_id, dia) VALUES (?,?,?,?)', [d.descricao, d.valor, d.categoria_id, d.dia]);
  await garantirMes(db, ymAtual());
}

export async function criarParcelamento(
  db: SQLiteDatabase,
  d: { descricao: string; valor_parcela: number; total: number; categoria_id: number; dia: number; inicio?: string },
) {
  await db.runAsync(
    'INSERT INTO parcelamentos (descricao, valor_parcela, total, inicio, dia, categoria_id) VALUES (?,?,?,?,?,?)',
    [d.descricao, d.valor_parcela, d.total, d.inicio ?? ymAtual(), d.dia, d.categoria_id],
  );
  await garantirMes(db, ymAtual());
}

// Ao apagar, some a partir deste mês; o que já passou fica no histórico.
export async function excluirFixo(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM lancamentos WHERE fixo_id=? AND substr(data,1,7)>=?', [id, ymAtual()]);
  await db.runAsync('UPDATE lancamentos SET fixo_id=NULL WHERE fixo_id=?', [id]);
  await db.runAsync('DELETE FROM fixos WHERE id=?', [id]);
}
export async function excluirParcelamento(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM lancamentos WHERE parcelamento_id=? AND substr(data,1,7)>=?', [id, ymAtual()]);
  await db.runAsync('UPDATE lancamentos SET parcelamento_id=NULL WHERE parcelamento_id=?', [id]);
  await db.runAsync('DELETE FROM parcelamentos WHERE id=?', [id]);
}

// Quanto já está comprometido em cada mês (fixos + parcelas), sem depender de lançamentos gerados.
export async function comprometido(db: SQLiteDatabase, inicio: string, meses: number) {
  const fixos = await listarFixos(db);
  const parcs = await listarParcelamentos(db);
  const totalFixos = fixos.reduce((s, f) => s + f.valor, 0);
  return Array.from({ length: meses }, (_, i) => {
    const ym = somarMeses(inicio, i);
    const itens = parcs
      .filter((p) => {
        const idx = difMeses(p.inicio, ym);
        return idx >= 0 && idx < p.total;
      })
      .map((p) => ({ nome: p.descricao, valor: p.valor_parcela }));
    return { ym, fixos: totalFixos, parcelas: itens, total: totalFixos + itens.reduce((s, x) => s + x.valor, 0) };
  });
}

// ---------- Metas ----------
export function listarMetas(db: SQLiteDatabase): Promise<Meta[]> {
  return db.getAllAsync<Meta>('SELECT * FROM metas ORDER BY prazo, id');
}
export async function criarMeta(db: SQLiteDatabase, d: { nome: string; alvo: number; atual: number; prazo: string }) {
  await db.runAsync('INSERT INTO metas (nome, atual, alvo, prazo) VALUES (?,?,?,?)', [d.nome, d.atual, d.alvo, d.prazo]);
}
export async function somarNaMeta(db: SQLiteDatabase, id: number, valor: number) {
  await db.runAsync('UPDATE metas SET atual = atual + ? WHERE id=?', [valor, id]);
}
export async function excluirMeta(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM metas WHERE id=?', [id]);
}

// ---------- Guardado ----------
export async function getGuardado(db: SQLiteDatabase): Promise<Guardado> {
  const g = await db.getFirstAsync<Guardado>('SELECT * FROM guardado ORDER BY id LIMIT 1');
  if (g) return g;
  await db.runAsync('INSERT INTO guardado (nome, saldo, pct_cdi) VALUES (?,?,?)', ['Caixinha', 0, 100]);
  return (await db.getFirstAsync<Guardado>('SELECT * FROM guardado ORDER BY id LIMIT 1'))!;
}
export async function salvarGuardado(db: SQLiteDatabase, id: number, saldo: number) {
  await db.runAsync('UPDATE guardado SET saldo=? WHERE id=?', [saldo, id]);
}

// ---------- Notificações ----------
export async function reclassificar(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE lancamentos SET categoria_id=NULL, sugestao_id=NULL WHERE id=?', [id]);
}

export type NotificacaoBruta = {
  id: number; chave: string; pacote: string; titulo: string; texto: string;
  quando: number; resultado: string; lancamento_id: number | null;
};

export function ultimasNotificacoes(db: SQLiteDatabase, limite = 30): Promise<NotificacaoBruta[]> {
  return db.getAllAsync<NotificacaoBruta>('SELECT * FROM notificacoes_brutas ORDER BY quando DESC LIMIT ?', [limite]);
}

export async function categoriaPorNome(db: SQLiteDatabase, nome: string, tipo: Tipo): Promise<number | null> {
  const r = await db.getFirstAsync<{ id: number }>('SELECT id FROM categorias WHERE nome=? AND tipo=?', [nome, tipo]);
  return r ? r.id : null;
}

// ---------- Categorias criadas pela pessoa ----------
export async function criarCategoria(db: SQLiteDatabase, d: { nome: string; cor: string; tipo: Tipo }): Promise<number> {
  const nome = d.nome.trim();
  await db.runAsync('INSERT OR IGNORE INTO categorias (nome, cor, tipo) VALUES (?,?,?)', [nome, d.cor, d.tipo]);
  const r = await db.getFirstAsync<{ id: number }>('SELECT id FROM categorias WHERE nome=? AND tipo=?', [nome, d.tipo]);
  return r!.id;
}

// ---------- Fixos/parcelas x pagamento real ----------
function diasEntre(a: string, b: string): number {
  return Math.abs(new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime()) / 86400000;
}

// Quando chega uma notificação de pagamento, procura um fixo/parcela "previsto" do mês que seja
// esse mesmo gasto. Se achar, atualiza o previsto (valor e data reais) em vez de criar outro lançamento.
// Casa pelo NOME (ex: "vivo" aparece na notificação) ou, na falta dele, pelo VALOR exato em até 7 dias.
export async function conciliar(db: SQLiteDatabase, d: { valor: number; data: string; texto: string }): Promise<number | null> {
  const cands = await db.getAllAsync<{ id: number; descricao: string; valor: number; data: string }>(
    "SELECT id, descricao, valor, data FROM lancamentos WHERE conferido=0 AND origem IN ('fixo','parcela') AND tipo='saida' AND substr(data,1,7)=?",
    [d.data.slice(0, 7)],
  );
  const palavrasTexto = new Set(normalizar(d.texto).split(' '));
  let melhor: number | null = null;
  let notaMelhor = 0;
  for (const c of cands) {
    const palavras = normalizar(c.descricao).split(' ').filter((p) => p.length >= 3);
    const nome = palavras.some((p) => palavrasTexto.has(p));
    const exato = Math.abs(c.valor - d.valor) < 0.01;
    let nota = 0;
    if (nome) nota = 2 + (exato ? 2 : 0) + (Math.abs(c.valor - d.valor) / c.valor <= 0.2 ? 1 : 0);
    else if (exato && diasEntre(c.data, d.data) <= 7) nota = 2;
    if (nota > notaMelhor) { notaMelhor = nota; melhor = c.id; }
  }
  if (melhor != null) {
    await db.runAsync('UPDATE lancamentos SET valor=?, data=?, conferido=1 WHERE id=?', [d.valor, d.data, melhor]);
  }
  return melhor;
}

export async function marcarComoPago(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE lancamentos SET conferido=1 WHERE id=?', [id]);
}
