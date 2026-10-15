import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Bolinha } from '@/components/Bolinha';
import { Chip } from '@/components/Chip';
import { MesSwitcher } from '@/components/MesSwitcher';
import { excluirLancamento, garantirMes, lancamentosDoMes, paraClassificar, reclassificar, type Lancamento } from '@/db';
import { useDados } from '@/db/useDados';
import { diaExtenso } from '@/datas';
import { brl } from '@/format';
import { useMes } from '@/mes';
import { colors } from '@/theme';

type Filtro = 'todos' | 'entrada' | 'saida';
const filtros: { id: Filtro; nome: string }[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'entrada', nome: 'Entradas' },
  { id: 'saida', nome: 'Saídas' },
];

export default function Extrato() {
  const { ym } = useMes();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { dados, recarregar, db } = useDados(
    async (d) => {
      await garantirMes(d, ym);
      return { lancs: await lancamentosDoMes(d, ym), pendentes: (await paraClassificar(d)).length };
    },
    { lancs: [] as Lancamento[], pendentes: 0 },
    [ym],
  );

  const lista = dados.lancs.filter((l) => filtro === 'todos' || l.tipo === filtro);
  const dias: string[] = [];
  lista.forEach((l) => { if (!dias.includes(l.data)) dias.push(l.data); });

  function abrir(l: Lancamento) {
    Alert.alert(l.descricao, `${l.tipo === 'entrada' ? '+' : '−'} ${brl(l.valor)}`, [
      { text: 'Fechar', style: 'cancel' },
      {
        text: 'Mudar categoria',
        onPress: async () => { await reclassificar(db, l.id); router.push('/classificar'); },
      },
      {
        text: 'Excluir este lançamento', style: 'destructive',
        onPress: async () => { await excluirLancamento(db, l.id); recarregar(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.topo}>
          <View>
            <MesSwitcher />
            <Text style={s.titulo}>Lançamentos</Text>
          </View>
          <Pressable style={s.botaoNovo} accessibilityLabel="Novo lançamento" onPress={() => router.push('/novo')}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={s.filtros}>
          {filtros.map((f) => (
            <Chip key={f.id} texto={f.nome} ativo={f.id === filtro} onPress={() => setFiltro(f.id)} />
          ))}
        </View>

        {dados.pendentes > 0 && (
          <Pressable style={s.aviso} onPress={() => router.push('/classificar')}>
            <Feather name="bell" size={20} color="#3730A3" />
            <Text style={s.avisoTxt}>{dados.pendentes} lançamento{dados.pendentes > 1 ? 's' : ''} para classificar</Text>
            <Feather name="chevron-right" size={18} color="#3730A3" />
          </Pressable>
        )}

        <View style={s.card}>
          {dias.length === 0 && <Text style={s.vazio}>Nenhum lançamento neste mês.</Text>}
          {dias.map((dia) => (
            <View key={dia}>
              <Text style={s.dia}>{diaExtenso(dia)}</Text>
              {lista.filter((l) => l.data === dia).map((l) => (
                <Pressable key={l.id} style={s.linha} onPress={() => abrir(l)}>
                  <Bolinha cor={l.cor} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.nome}>{l.descricao}</Text>
                    <Text style={s.sub}>
                      {l.categoria ?? 'Sem categoria'}
                      {l.detalhe ? ` · ${l.detalhe}` : ''}
                    </Text>
                  </View>
                  <Text style={[s.valor, l.tipo === 'entrada' && { color: colors.green }]}>
                    {l.tipo === 'entrada' ? '+ ' : '− '}{brl(l.valor)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 14, fontWeight: '500', color: colors.muted, paddingLeft: 8 },
  botaoNovo: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  filtros: { flexDirection: 'row', gap: 8 },
  aviso: {
    minHeight: 44, backgroundColor: '#EAE8FD', borderRadius: 14, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avisoTxt: { flex: 1, color: '#3730A3', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16, paddingBottom: 4 },
  vazio: { color: colors.muted, paddingVertical: 20, textAlign: 'center' },
  dia: { fontSize: 12, fontWeight: '600', color: colors.muted, paddingTop: 12, paddingBottom: 4 },
  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: '#EEF1F5',
  },
  nome: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted },
  valor: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
