// Contas do simulador de rendimento (valores brutos, antes do imposto de renda).

// Taxa anual (%) -> taxa mensal (decimal). Ex: 14 -> 0.010978...
export function taxaMensal(anualPct: number): number {
  return Math.pow(1 + anualPct / 100, 1 / 12) - 1;
}

// Poupança: ~0,5% ao mês (quando a Selic está acima de 8,5% ao ano)
export const POUPANCA_ANUAL = (Math.pow(1.005, 12) - 1) * 100;

export type Ponto = { mes: number; saldo: number; investido: number };

// Cada mês: rende sobre o saldo e depois entra o depósito mensal.
export function simular(inicial: number, mensal: number, meses: number, anualPct: number): Ponto[] {
  const i = taxaMensal(anualPct);
  const pontos: Ponto[] = [{ mes: 0, saldo: inicial, investido: inicial }];
  let saldo = inicial;
  for (let m = 1; m <= meses; m++) {
    saldo = saldo * (1 + i) + mensal;
    pontos.push({ mes: m, saldo, investido: inicial + mensal * m });
  }
  return pontos;
}
