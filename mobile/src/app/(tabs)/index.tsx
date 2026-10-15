import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Donut } from '@/components/Donut';
import { MesSwitcher } from '@/components/MesSwitcher';
import { ProgressBar } from '@/components/ProgressBar';
import {
  apagarExemplo, garantirMes, getGuardado, lancamentosDoMes, listarMetas, paraClassificar,
  type Guardado, type Lancamento, type Meta,
} from '@/db';
import { useDados } from '@/db/useDados';
import { brl } from '@/format';
import { useMes } from '@/mes';
import { colors } from '@/theme';

type Dados = { lancs: Lancamento[]; pendentes: number; guardado: Guardado | null; metas: Meta[] };

export default function Painel() {
  const { ym } = useMes();
  const { dados, recarregar, db } = useDados<Dados>(
    async (d) => {
      await garantirMes(d, ym);
      return {
        lancs: await lancamentosDoMes(d, ym),
        pendentes: (await paraClassificar(d)).length,
        guardado: await getGuardado(d),
        metas: await listarMetas(d),
      };
    },
    { lancs: [], pendentes: 0, guardado: null, metas: [] },
    [ym],
  );

  const { lancs, pendentes, guardado, metas } = dados;
  const entradas = lancs.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
  const saidas = lancs.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
  const sobra = entradas - saidas;
  const usado = entradas > 0 ? saidas / entradas : saidas > 0 ? 1 : 0;

  // gastos agrupados por categoria
  const porCat = new Map<string, { nome: string; cor: string; valor: number }>();
  lancs.filter((l) => l.tipo === 'saida').forEach((l) => {
    const nome = l.categoria ?? 'Sem categoria';
    const atual = porCat.get(nome) ?? { nome, cor: l.cor ?? '#B8C0CC', valor: 0 };
    atual.valor += l.valor;
    porCat.set(nome, atual);
  });
  const categorias = [...porCat.values()].sort((a, b) => b.valor - a.valor);
  const totalCat = categorias.reduce((s, c) => s + c.valor, 0);
  const meta = metas[0];

  function apagar() {
    Alert.alert('Apagar dados de exemplo?', 'Remove todos os lançamentos, fixos, parcelas e metas. As categorias ficam.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await apagarExemplo(db); recarregar(); } },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <MesSwitcher />

        <View style={s.hero}>
          <Text style={s.heroLabel}>Sobra do mês</Text>
          <Text style={s.heroValor}>{brl(sobra)}</Text>
          <View style={s.heroLinha}>
            <View>
              <Text style={s.heroLabel}>Entradas</Text>
              <Text style={s.heroSub}>{brl(entradas)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.heroLabel}>Saídas</Text>
              <Text style={s.heroSub}>{brl(saidas)}</Text>
            </View>
          </View>
          <ProgressBar progresso={usado} cor="#A5B4FC" fundo="rgba(255,255,255,0.2)" />
          <Text style={s.heroLabel}>{Math.round(usado * 100)}% da renda já saiu</Text>
        </View>

        {pendentes > 0 && (
          <Pressable style={s.aviso} onPress={() => router.push('/classificar')}>
            <Feather name="bell" size={20} color="#3730A3" />
            <Text style={s.avisoTxt}>{pendentes} lançamento{pendentes > 1 ? 's' : ''} para classificar</Text>
            <Feather name="chevron-right" size={18} color="#3730A3" />
          </Pressable>
        )}

        <View style={s.card}>
          <Text style={s.cardTitulo}>Gastos por categoria</Text>
          {totalCat === 0 ? (
            <Text style={s.mudo}>Nenhum gasto neste mês.</Text>
          ) : (
            <View style={s.donutLinha}>
              <Donut fatias={categorias}>
                <Text style={s.donutValor}>{brl(totalCat, false)}</Text>
                <Text style={s.mudo}>no mês</Text>
              </Donut>
              <View style={s.legenda}>
                {categorias.map((c) => (
                  <View key={c.nome} style={s.legendaItem}>
                    <View style={[s.dot, { backgroundColor: c.cor }]} />
                    <Text style={s.legendaNome}>{c.nome}</Text>
                    <Text style={s.mudo}>{Math.round((c.valor / totalCat) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Guardado</Text>
          <Text style={s.guardadoTotal}>{brl(guardado?.saldo ?? 0)}</Text>
          {meta ? (
            <>
              <Text style={s.legendaNome}>{meta.nome}</Text>
              <ProgressBar progresso={meta.atual / meta.alvo} cor={colors.green} />
              <Text style={s.mudo}>
                {brl(meta.atual, false)} de {brl(meta.alvo, false)} ({Math.round((meta.atual / meta.alvo) * 100)}%)
              </Text>
            </>
          ) : (
            <Text style={s.mudo}>Crie uma meta na aba Metas.</Text>
          )}
        </View>

        <Pressable onPress={apagar} style={{ padding: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Apagar dados de exemplo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: 18, gap: 8 },
  heroLabel: { color: '#C7D2FE', fontSize: 13 },
  heroValor: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  heroSub: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  heroLinha: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  aviso: {
    minHeight: 44, backgroundColor: '#EAE8FD', borderRadius: 14, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avisoTxt: { flex: 1, color: '#3730A3', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
  donutLinha: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutValor: { fontSize: 18, fontWeight: '800', color: colors.ink },
  mudo: { fontSize: 12, color: colors.muted },
  legenda: { flex: 1, gap: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendaNome: { flex: 1, color: colors.ink, fontSize: 14 },
  guardadoTotal: { fontSize: 26, fontWeight: '800', color: colors.green },
});
