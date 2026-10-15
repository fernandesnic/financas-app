// Funções de data. Mês sempre no formato "AAAA-MM" (ex: "2026-10").
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const dois = (n: number) => String(n).padStart(2, '0');

export function ymAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}`;
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export function somarMeses(ym: string, n: number): string {
  const [a, m] = ym.split('-').map(Number);
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${dois((t % 12) + 1)}`;
}

// Quantos meses de "de" até "ate" (pode ser negativo)
export function difMeses(de: string, ate: string): number {
  const [a1, m1] = de.split('-').map(Number);
  const [a2, m2] = ate.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

export function nomeMes(ym: string): string {
  const [a, m] = ym.split('-').map(Number);
  const nome = MESES[m - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${a}`;
}

export function mesCurto(ym: string): string {
  return MESES_CURTOS[Number(ym.split('-')[1]) - 1];
}

// "2027-06" -> "junho de 2027"
export function mesExtenso(ym: string): string {
  const [a, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
}

// "2026-10-15" -> "15 de outubro"
export function diaExtenso(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

// Monta a data do dia "dia" no mês "ym" (se o mês não tem esse dia, usa o último)
export function dataDoMes(ym: string, dia: number): string {
  const [a, m] = ym.split('-').map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  return `${ym}-${dois(Math.min(dia, ultimo))}`;
}

// Converte o que a pessoa digitou ("1.234,56" ou "1234.56") em número
export function lerValor(texto: string): number {
  let t = texto.replace(/[^\d.,]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

// "06/2027" -> "2027-06" (ou null se inválido)
export function lerMesAno(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!m) return null;
  const mes = Number(m[1]);
  if (mes < 1 || mes > 12) return null;
  return `${m[2]}-${dois(mes)}`;
}
