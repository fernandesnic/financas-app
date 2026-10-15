// "Tradutor" das notificações dos bancos: lê o texto e descobre se foi entrada ou saída, quanto e com quem.
// ATENÇÃO: os textos reais do Nubank e do Santander mudam com o tempo. As regras abaixo são um ponto de
// partida e devem ser ajustadas olhando as notificações reais (tela "Notificações" do app).

export type Entrada = { pacote: string; titulo: string; texto: string };

export type Resultado =
  | { tipo: 'lancamento'; direcao: 'entrada' | 'saida'; valor: number; descricao: string; categoriaAuto?: string }
  | { tipo: 'ignorar'; motivo: string }
  | { tipo: 'nao_entendi' };

// minúsculo e sem acento, para comparar textos
function simples(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const REGEX_VALOR = /R\$\s?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/;

// Palavras que indicam que o dinheiro ENTROU / SAIU (já sem acento)
const PALAVRAS_ENTRADA = ['recebeu', 'recebido', 'recebida', 'recebimento', 'deposito', 'creditado', 'credito em conta', 'estorno', 'reembolso', 'caiu na sua conta'];
const PALAVRAS_SAIDA = ['enviou', 'enviado', 'enviada', 'voce fez um pix', 'fez uma transferencia', 'transferiu', 'pagou', 'pagamento', 'compra', 'aprovada', 'debito', 'saque', 'boleto pago'];

// Avisos que NÃO são movimentação de dinheiro
const IGNORAR = [
  /fatura (fechou|fechada|vence|vencimento|disponivel|aberta|atrasada|em aberto|ja esta|chegou|fecha)/,
  /sua fatura/,
  /limite/,
  /oferta|promo|convite|indique|cashback|sorteio|premio/,
  /codigo|token|senha|seguranca|autentic|atualiz/,
  /rendimento|rendeu|rende /,
  /lembrete|vence (hoje|amanha)|vencimento/,
];

export function interpretar(n: Entrada): Resultado {
  const bruto = `${n.titulo}. ${n.texto}`;
  const s = simples(bruto);

  // Conta PJ não entra no controle pessoal
  if (/\bpj\b|nubank empresas|conta pj|nupj/.test(s)) return { tipo: 'ignorar', motivo: 'conta PJ' };

  const ehNubank = n.pacote.startsWith('com.nu') || n.pacote.includes('nubank');

  // Pagamento de fatura: o Nubank avisa do lado dele (duplicado), o Santander mostra a saída real
  const pagouFatura = /pagamento (da |de )?fatura|fatura (foi )?paga|pagou a fatura/.test(s);
  if (pagouFatura && ehNubank) return { tipo: 'ignorar', motivo: 'pagamento de fatura (aviso do Nubank)' };

  if (!pagouFatura) {
    for (const r of IGNORAR) if (r.test(s)) return { tipo: 'ignorar', motivo: 'aviso sem movimentação' };
  }

  const m = bruto.match(REGEX_VALOR);
  if (!m) return { tipo: 'ignorar', motivo: 'sem valor em reais' };
  const valor = parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`);
  if (!(valor > 0)) return { tipo: 'ignorar', motivo: 'valor zero' };

  let direcao: 'entrada' | 'saida' | null = null;
  if (PALAVRAS_ENTRADA.some((p) => s.includes(p))) direcao = 'entrada';
  else if (PALAVRAS_SAIDA.some((p) => s.includes(p))) direcao = 'saida';
  if (!direcao) return { tipo: 'nao_entendi' };

  // Quem recebeu / pagou: o que vem depois do valor ("para X", "de X", "em X")
  const depois = bruto.slice((m.index ?? 0) + m[0].length);
  const quem = depois.match(/\b(?:para|de|em|no|na)\s+([^.,;\n]+)/i);
  let contraparte = quem ? quem[1] : '';
  contraparte = contraparte.replace(/\s+(no cart[aã]o|cart[aã]o|final|[aà]s \d|em \d|via|com|usando).*$/i, '').trim();

  const rotulo = n.titulo.trim() || (direcao === 'entrada' ? 'Recebido' : 'Pago');
  const descricao = contraparte ? `${rotulo} · ${contraparte}` : rotulo;

  // Pagar o cartão Nubank pelo Santander = transferência (as compras já foram contadas)
  const cs = simples(contraparte);
  const paraNubank = direcao === 'saida' && (cs.includes('nu pagamentos') || cs.includes('nubank'));
  if (pagouFatura || paraNubank) {
    return { tipo: 'lancamento', direcao: 'saida', valor, descricao, categoriaAuto: 'Transferência' };
  }

  return { tipo: 'lancamento', direcao, valor, descricao };
}
