import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  corCategoria,
  fundoCategoria,
  lancamentos,
  mes,
  paraClassificar,
} from '@/data/sample';
import { brl } from '@/format';
import { colors } from '@/theme';

type Filtro = 'todos' | 'entrada' | 'saida';

const filtros: { id: Filtro; nome: string }[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'entrada', nome: 'Entradas' },
  { id: 'saida', nome: 'Saídas' },
];

export default function Extrato() {
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const lista = lancamentos.filter((l) => filtro === 'todos' || l.tipo === filtro);

  // agrupa por dia (mantém a ordem em que aparecem)
  const dias: string[] = [];
  lista.forEach((l) => {
    if (!dias.includes(l.dia)) dias.push(l.dia);
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.topo}>
          <View>
            <Text style={s.mes}>{mes.nome}</Text>
            <Text style={s.titulo}>Lançamentos</Text>
          </View>
          <Pressable style={s.botaoNovo} accessibilityLabel="Novo lançamento">
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={s.filtros}>
          {filtros.map((f) => {
            const ativo = f.id === filtro;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFiltro(f.id)}
                style={[s.chip, ativo && s.chipAtivo]}
              >
                <Text style={[s.chipTxt, ativo && s.chipTxtAtivo]}>{f.nome}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.aviso}>
          <Feather name="bell" size={20} color="#3730A3" />
          <Text style={s.avisoTxt}>{paraClassificar} lançamentos para classificar</Text>
          <Feather name="chevron-right" size={18} color="#3730A3" />
        </View>

        <View style={s.card}>
          {dias.map((dia) => (
            <View key={dia}>
              <Text style={s.dia}>{dia}</Text>
              {lista
                .filter((l) => l.dia === dia)
                .map((l) => (
                  <View key={l.id} style={s.linha}>
                    <View style={[s.bolinha, { backgroundColor: fundoCategoria[l.categoria] }]}>
                      <View style={[s.miolo, { backgroundColor: corCategoria[l.categoria] }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.nome}>{l.descricao}</Text>
                      <Text style={s.sub}>
                        {l.categoria}
                        {l.detalhe ? ` · ${l.detalhe}` : ''}
                      </Text>
                    </View>
                    <Text style={[s.valor, l.tipo === 'entrada' && { color: colors.green }]}>
                      {l.tipo === 'entrada' ? '+ ' : '− '}
                      {brl(l.valor)}
                    </Text>
                  </View>
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
  mes: { fontSize: 12, fontWeight: '500', color: colors.muted },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  botaoNovo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtros: { flexDirection: 'row', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9DEE6',
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipTxt: { fontSize: 14, fontWeight: '500', color: colors.ink },
  chipTxtAtivo: { color: '#FFFFFF', fontWeight: '600' },
  aviso: {
    minHeight: 44,
    backgroundColor: '#EAE8FD',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avisoTxt: { flex: 1, color: '#3730A3', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16, paddingBottom: 4 },
  dia: { fontSize: 12, fontWeight: '600', color: colors.muted, paddingTop: 12, paddingBottom: 4 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  bolinha: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  miolo: { width: 12, height: 12, borderRadius: 6 },
  nome: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted },
  valor: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
