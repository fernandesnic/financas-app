import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Barras } from '@/components/Barras';
import { Bolinha } from '@/components/Bolinha';
import {
  comprometido, excluirFixo, excluirParcelamento, garantirMes, listarFixos, listarParcelamentos,
  type Fixo, type Parcelamento,
} from '@/db';
import { useDados } from '@/db/useDados';
import { mesCurto, mesExtenso, somarMeses, ymAtual } from '@/datas';
import { brl } from '@/format';
import { colors } from '@/theme';

const CORES_PARCELAS = [colors.parcelas, colors.tv, '#D6457A', '#0E8FB5', '#9A5BD0', '#1FA37A'];

type Dados = {
  fixos: Fixo[]; parcs: Parcelamento[];
  meses: Awaited<ReturnType<typeof comprometido>>;
};

export default function Fixos() {
  const { dados, recarregar, db } = useDados<Dados>(
    async (d) => {
      await garantirMes(d, ymAtual());
      return { fixos: await listarFixos(d), parcs: await listarParcelamentos(d), meses: await comprometido(d, ymAtual(), 8) };
    },
    { fixos: [], parcs: [], meses: [] },
  );
  const { fixos, parcs, meses } = dados;

  const totalFixos = fixos.reduce((s, f) => s + f.valor, 0);
  const totalParcs = parcs
    .filter((p) => meses[0]?.parcelas.some((x) => x.nome === p.descricao))
    .reduce((s, p) => s + p.valor_parcela, 0);

  // cor de cada parcelamento no gráfico
  const corDe = (nome: string) => CORES_PARCELAS[Math.max(0, parcs.findIndex((p) => p.descricao === nome)) % CORES_PARCELAS.length];
  const barras = meses.map((m) => ({
    rotulo: mesCurto(m.ym),
    topo: Math.round(m.total).toString(),
    segmentos: [
      { valor: m.fixos, cor: colors.assinaturas },
      ...m.parcelas.map((p) => ({ valor: p.valor, cor: corDe(p.nome) })),
    ],
  }));

  // primeiro mês em que o total cai: avisa o alívio
  let alivio: string | null = null;
  for (let i = 1; i < meses.length; i++) {
    if (meses[i].total < meses[i - 1].total) {
        const acabou = meses[i - 1].parcelas.filter((p) => !meses[i].parcelas.some((q) => q.nome === p.nome)).map((p) => p.nome);
      alivio = `Em ${mesExtenso(meses[i].ym).split(' de ')[0]} cai ${brl(meses[i - 1].total - meses[i].total, false)}, quando ${acabou.join(' e ')} termina`;
      break;
    }
  }

  function apagarFixo(f: Fixo) {
    Alert.alert(`Apagar "${f.descricao}"?`, 'Some a partir deste mês. O histórico dos meses passados fica.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await excluirFixo(db, f.id); recarregar(); } },
    ]);
  }
  function apagarParc(p: Parcelamento) {
    Alert.alert(`Apagar "${p.descricao}"?`, 'Some a partir deste mês. O histórico dos meses passados fica.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await excluirParcelamento(db, p.id); recarregar(); } },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.topo}>
          <View>
            <Text style={s.mudo}>Se repetem todo mês</Text>
            <Text style={s.titulo}>Fixos e parcelas</Text>
          </View>
          <Pressable style={s.botaoNovo} onPress={() => router.push('/novo')} accessibilityLabel="Adicionar">
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Já comprometido nos próximos meses</Text>
          {alivio && <Text style={s.mudo}>{alivio}</Text>}
          {meses.length > 0 && <Barras barras={barras} />}
        </View>

        <View style={s.card}>
          <View style={s.cabecalho}>
            <Text style={s.cardTitulo}>Gastos fixos</Text>
            <Text style={s.mudo}>{brl(totalFixos, false)} por mês</Text>
          </View>
          {fixos.length === 0 && <Text style={s.mudo}>Nenhum gasto fixo. Toque no + e escolha "Todo mês".</Text>}
          {fixos.map((f) => (
            <Pressable key={f.id} style={s.linha} onLongPress={() => apagarFixo(f)}>
              <Bolinha cor={f.cor} />
              <View style={{ flex: 1 }}>
                <Text style={s.nome}>{f.descricao}</Text>
                <Text style={s.mudo}>todo dia {f.dia}</Text>
              </View>
              <Text style={s.valor}>{brl(f.valor)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.cabecalho}>
            <Text style={s.cardTitulo}>Parcelas</Text>
            <Text style={s.mudo}>{brl(totalParcs, false)} por mês</Text>
          </View>
          {parcs.length === 0 && <Text style={s.mudo}>Nenhuma parcela. Toque no + e escolha "Parcelado".</Text>}
          {parcs.map((p) => {
            const fim = somarMeses(p.inicio, p.total - 1);
            return (
              <Pressable key={p.id} style={s.linha} onLongPress={() => apagarParc(p)}>
                <Bolinha cor={corDe(p.descricao)} />
                <View style={{ flex: 1 }}>
                  <Text style={s.nome}>{p.descricao}</Text>
                  <Text style={s.mudo}>
                    {mesCurto(p.inicio)}/{p.inicio.slice(0, 4)} a {mesCurto(fim)}/{fim.slice(0, 4)} · {p.total} parcelas · termina em {mesExtenso(fim)}
                  </Text>
                </View>
                <Text style={s.valor}>{brl(p.valor_parcela)}</Text>
              </Pressable>
            );
          })}
        </View>
        {(fixos.length > 0 || parcs.length > 0) && (
          <Text style={[s.mudo, { textAlign: 'center' }]}>Segure o dedo num item para apagar.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  mudo: { fontSize: 12, color: colors.muted },
  botaoNovo: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#EEF1F5' },
  nome: { fontSize: 15, fontWeight: '600', color: colors.ink },
  valor: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
