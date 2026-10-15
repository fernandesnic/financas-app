import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';
import { criarFixo, criarParcelamento, inserirLancamento, listarCategorias, type Tipo } from '@/db';
import { useDados } from '@/db/useDados';
import { lerValor } from '@/datas';
import { brl } from '@/format';
import { colors } from '@/theme';

type Repeticao = 'uma' | 'mensal' | 'parcelado';

export default function Novo() {
  const [tipo, setTipo] = useState<Tipo>('saida');
  const [valorTxt, setValorTxt] = useState('');
  const [descricao, setDescricao] = useState('');
  const [catId, setCatId] = useState<number | null>(null);
  const [rep, setRep] = useState<Repeticao>('uma');
  const [parcelasTxt, setParcelasTxt] = useState('');

  const { dados: cats, db } = useDados(listarCategorias, []);
  const doTipo = cats.filter((c) => c.tipo === tipo);
  const valor = lerValor(valorTxt);

  function trocarTipo(t: Tipo) {
    setTipo(t);
    setCatId(null);
    if (t === 'entrada') setRep('uma');
  }

  async function salvar() {
    if (valor <= 0) return Alert.alert('Falta o valor', 'Digite quanto foi.');
    if (catId == null) return Alert.alert('Falta a categoria', 'Escolha uma categoria.');
    const nome = descricao.trim() || doTipo.find((c) => c.id === catId)?.nome || 'Lançamento';
    const dia = new Date().getDate();

    if (rep === 'uma') {
      await inserirLancamento(db, { descricao: nome, valor, tipo, categoria_id: catId });
    } else if (rep === 'mensal') {
      await criarFixo(db, { descricao: nome, valor, categoria_id: catId, dia });
    } else {
      const total = parseInt(parcelasTxt, 10);
      if (!total || total < 2) return Alert.alert('Parcelas', 'Digite o número de parcelas (2 ou mais).');
      await criarParcelamento(db, { descricao: nome, valor_parcela: valor, total, categoria_id: catId, dia });
    }
    router.back();
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.topo}>
            <Text style={s.titulo}>Novo lançamento</Text>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
              <Feather name="x" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={s.linhaChips}>
            <Chip texto="Saída" ativo={tipo === 'saida'} onPress={() => trocarTipo('saida')} />
            <Chip texto="Entrada" ativo={tipo === 'entrada'} cor={colors.green} onPress={() => trocarTipo('entrada')} />
          </View>

          <Text style={s.rotulo}>{rep === 'parcelado' ? 'Valor de cada parcela' : 'Valor'}</Text>
          <TextInput
            style={s.valor}
            value={valorTxt}
            onChangeText={setValorTxt}
            placeholder="0,00"
            keyboardType="decimal-pad"
            autoFocus
          />
          {valor > 0 && <Text style={s.dica}>{brl(valor)}</Text>}

          <Text style={s.rotulo}>Descrição</Text>
          <TextInput style={s.input} value={descricao} onChangeText={setDescricao} placeholder="Ex: Mercado, Netflix..." />

          <Text style={s.rotulo}>Categoria</Text>
          <View style={s.quebra}>
            {doTipo.map((c) => (
              <Chip key={c.id} texto={c.nome} ativo={catId === c.id} cor={c.cor} onPress={() => setCatId(c.id)} />
            ))}
          </View>

          {tipo === 'saida' && (
            <>
              <Text style={s.rotulo}>Repetição</Text>
              <View style={s.quebra}>
                <Chip texto="Só uma vez" ativo={rep === 'uma'} onPress={() => setRep('uma')} />
                <Chip texto="Todo mês" ativo={rep === 'mensal'} onPress={() => setRep('mensal')} />
                <Chip texto="Parcelado" ativo={rep === 'parcelado'} onPress={() => setRep('parcelado')} />
              </View>
              {rep === 'parcelado' && (
                <>
                  <Text style={s.rotulo}>Quantas parcelas?</Text>
                  <TextInput style={s.input} value={parcelasTxt} onChangeText={setParcelasTxt} placeholder="Ex: 6" keyboardType="number-pad" />
                  {valor > 0 && parseInt(parcelasTxt, 10) > 1 && (
                    <Text style={s.dica}>Total: {brl(valor * parseInt(parcelasTxt, 10))}. Começa neste mês e repete até acabar.</Text>
                  )}
                </>
              )}
              {rep === 'mensal' && <Text style={s.dica}>Vai se repetir todo mês, no dia de hoje, até você apagar em Fixos.</Text>}
            </>
          )}

          <Pressable style={s.salvar} onPress={salvar}>
            <Text style={s.salvarTxt}>Salvar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 20, gap: 8 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  linhaChips: { flexDirection: 'row', gap: 8 },
  rotulo: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 12 },
  valor: { fontSize: 36, fontWeight: '800', color: colors.ink, paddingVertical: 4 },
  input: {
    minHeight: 48, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14,
    fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: '#D9DEE6',
  },
  quebra: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dica: { fontSize: 13, color: colors.muted },
  salvar: {
    minHeight: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginTop: 24,
  },
  salvarTxt: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
