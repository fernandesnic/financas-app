import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';
import { NovaCategoria } from '@/components/NovaCategoria';
import { classificar, listarCategorias, paraClassificar, type Categoria, type Lancamento } from '@/db';
import { useDados } from '@/db/useDados';
import { diaExtenso } from '@/datas';
import { brl } from '@/format';
import { colors } from '@/theme';

export default function Classificar() {
  const { dados, recarregar, db } = useDados(async (d) => ({
    pend: await paraClassificar(d),
    cats: await listarCategorias(d),
  }), { pend: [] as Lancamento[], cats: [] as Categoria[] });

  async function escolher(lancId: number, catId: number) {
    await classificar(db, lancId, catId);
    recarregar();
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.topo}>
          <View>
            <Text style={s.mudo}>Detectados nas notificações</Text>
            <Text style={s.titulo}>Classificar</Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
            <Feather name="x" size={24} color={colors.ink} />
          </Pressable>
        </View>

        {dados.pend.length === 0 && (
          <View style={s.card}>
            <Text style={s.nome}>Tudo classificado ✓</Text>
            <Text style={s.mudo}>Quando o app detectar novas movimentações, elas aparecem aqui.</Text>
          </View>
        )}

        {dados.pend.map((l) => {
          const sug = dados.cats.find((c) => c.id === l.sugestao_id);
          const opcoes = dados.cats.filter((c) => c.tipo === l.tipo);
          return (
            <View key={l.id} style={s.card}>
              <View style={s.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={s.nome}>{l.descricao}</Text>
                  <Text style={s.mudo}>{l.tipo === 'entrada' ? 'Entrada' : 'Saída'} · {diaExtenso(l.data)}</Text>
                </View>
                <Text style={[s.valor, l.tipo === 'entrada' && { color: colors.green }]}>
                  {l.tipo === 'entrada' ? '+ ' : ''}{brl(l.valor)}
                </Text>
              </View>

              {sug ? (
                <View style={s.sugestao}>
                  <Text style={s.mudo}>Sugestão do app: <Text style={{ fontWeight: '700', color: colors.ink }}>{sug.nome}</Text></Text>
                  <Pressable style={s.confirmar} onPress={() => escolher(l.id, sug.id)}>
                    <Text style={s.confirmarTxt}>Confirmar</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={s.mudo}>Não consegui identificar. Escolha uma categoria:</Text>
              )}

              <View style={s.quebra}>
                {opcoes.map((c) => (
                  <Chip key={c.id} texto={c.nome} ponto={c.cor} cor={c.cor} onPress={() => escolher(l.id, c.id)} />
                ))}
                <NovaCategoria tipo={l.tipo} onCriada={(id) => escolher(l.id, id)} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 20, gap: 14 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  mudo: { fontSize: 13, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nome: { fontSize: 15, fontWeight: '600', color: colors.ink },
  valor: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sugestao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  confirmar: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center' },
  confirmarTxt: { color: '#FFFFFF', fontWeight: '700' },
  quebra: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
