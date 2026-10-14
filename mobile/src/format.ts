// Formata número como dinheiro brasileiro: 1234.5 -> "R$ 1.234,50"
export function brl(value: number, withCents = true): string {
  const abs = Math.abs(value);
  const fixed = abs.toFixed(withCents ? 2 : 0);
  const [int, dec] = fixed.split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = value < 0 ? '-' : '';
  return `${sign}R$ ${intFmt}${dec ? ',' + dec : ''}`;
}
