import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Donut } from '@/components/Donut';
import { ProgressBar } from '@/components/ProgressBar';
import { categorias, guardado, mes, paraClassificar, sobra } from '@/data/sample';
import { brl } from '@/format';
import { colors } from '@/theme';

export default function Painel() {
  const totalCat = categorias.reduce((s, c) => s + c.valor, 0);
  const usado = mes.saidas / mes.entradas;
  const reserva = guardado.reserva;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.mes}>{mes.nome}</Text>

        {/* Cartão principal */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>Sobra do mês</Text>
          <Text style={s.heroValor}>{brl(sobra)}</Text>
          <View style={s.heroLinha}>
            <View>
              <Text style={s.heroLabel}>Entradas</Text>
              <Text style={s.heroSub}>{brl(mes.entradas)}</Text>
            </View>
            <View>
              <Text style={s.heroLabel}>Saídas</Text>
              <Text style={s.heroSub}>{brl(mes.saidas)}</Text>
            </View>
          </View>
          <ProgressBar progresso={usado} cor="#A5B4FC" fundo="rgba(255,255,255,0.2)" />
          <Text style={s.heroLabel}>{Math.round(usado * 100)}% da renda já saiu</Text>
        </View>

        {/* Aviso de classificação */}
        <View style={s.pill}>
          <Text style={s.pillTxt}>
            {paraClassificar} lançamentos para classificar
          </Text>
        </View>

        {/* Gastos por categoria */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Gastos por categoria</Text>
          <View style={s.donutLinha}>
            <Donut fatias={categorias}>
              <Text style={s.donutValor}>{brl(totalCat, false)}</Text>
              <Text style={s.donutLabel}>no mês</Text>
            </Donut>
            <View style={s.legenda}>
              {categorias.map((c) => (
                <View key={c.nome} style={s.legendaItem}>
                  <View style={[s.dot, { backgroundColor: c.cor }]} />
                  <Text style={s.legendaNome}>{c.nome}</Text>
                  <Text style={s.legendaPct}>{Math.round((c.valor / totalCat) * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Guardado */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Guardado</Text>
          <Text style={s.guardadoTotal}>{brl(guardado.total)}</Text>
          <Text style={s.legendaNome}>{reserva.nome}</Text>
          <View style={{ marginVertical: 6 }}>
            <ProgressBar progresso={reserva.atual / reserva.meta} cor={colors.green} />
          </View>
          <Text style={s.donutLabel}>
            {brl(reserva.atual, false)} de {brl(reserva.meta, false)} (
            {Math.round((reserva.atual / reserva.meta) * 100)}%)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  mes: { fontSize: 22, fontWeight: '700', color: colors.ink },
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: 18, gap: 8 },
  heroLabel: { color: '#C7D2FE', fontSize: 13 },
  heroValor: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  heroSub: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  heroLinha: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  pill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  pillTxt: { color: '#92400E', fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
  donutLinha: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutValor: { fontSize: 18, fontWeight: '800', color: colors.ink },
  donutLabel: { fontSize: 12, color: colors.muted },
  legenda: { flex: 1, gap: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendaNome: { flex: 1, color: colors.ink, fontSize: 14 },
  legendaPct: { color: colors.muted, fontSize: 13 },
  guardadoTotal: { fontSize: 26, fontWeight: '800', color: colors.green },
});
