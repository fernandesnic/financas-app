import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/ProgressBar';
import { criarMeta, excluirMeta, listarMetas, somarNaMeta, type Meta } from '@/db';
import { useDados } from '@/db/useDados';
import { difMeses, lerMesAno, lerValor, mesExtenso, ymAtual } from '@/datas';
import { brl } from '@/format';
import { colors } from '@/theme';

// Quanto precisa guardar por mês para chegar no prazo
function porMes(m: Meta): number {
  const falta = Math.max(0, m.alvo - m.atual);
  const meses = Math.max(1, difMeses(ymAtual(), m.prazo));
  return falta / meses;
}

export default function Metas() {
  const { dados: metas, recarregar, db } = useDados<Meta[]>(listarMetas, []);
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [alvoTxt, setAlvoTxt] = useState('');
  const [atualTxt, setAtualTxt] = useState('');
  const [prazoTxt, setPrazoTxt] = useState('');
  const [somandoId, setSomandoId] = useState<number | null>(null);
  const [somaTxt, setSomaTxt] = useState('');

  const totalMes = metas.reduce((s, m) => s + porMes(m), 0);

  async function salvarMeta() {
    const prazo = lerMesAno(prazoTxt);
    const alvo = lerValor(alvoTxt);
    if (!nome.trim() || alvo <= 0) return Alert.alert('Falta algo', 'Preencha o nome e o valor da meta.');
    if (!prazo) return Alert.alert('Prazo', 'Digite o prazo como mês/ano. Ex: 06/2027');
    await criarMeta(db, { nome: nome.trim(), alvo, atual: lerValor(atualTxt), prazo });
    setNovo(false); setNome(''); setAlvoTxt(''); setAtualTxt(''); setPrazoTxt('');
    recarregar();
  }

  async function somar(id: number) {
    const v = lerValor(somaTxt);
    if (v > 0) await somarNaMeta(db, id, v);
    setSomandoId(null); setSomaTxt('');
    recarregar();
  }

  function apagar(m: Meta) {
    Alert.alert(`Apagar "${m.nome}"?`, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => { await excluirMeta(db, m.id); recarregar(); } },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.mudo}>Seus objetivos</Text>
          <Text style={s.titulo}>Metas</Text>
        </View>

        {metas.length > 0 && (
          <View style={s.hero}>
            <Text style={s.heroLabel}>Para bater {metas.length > 1 ? 'as metas' : 'a meta'} no prazo</Text>
            <Text style={s.heroValor}>{brl(totalMes, false)} <Text style={s.heroLabel}>por mês</Text></Text>
          </View>
        )}

        {metas.map((m) => {
          const pct = m.atual / m.alvo;
          const falta = Math.max(0, m.alvo - m.atual);
          return (
            <Pressable key={m.id} style={s.card} onLongPress={() => apagar(m)}>
              <View style={s.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={s.nome}>{m.nome}</Text>
                  <Text style={s.mudo}>Prazo: {mesExtenso(m.prazo)}</Text>
                </View>
                <Text style={s.pct}>{Math.round(pct * 100)}%</Text>
              </View>
              <ProgressBar progresso={pct} cor={colors.green} />
              <Text style={s.valores}>{brl(m.atual)} <Text style={s.mudo}>de {brl(m.alvo)}</Text></Text>
              {falta > 0 ? (
                <Text style={s.mudo}>
                  Faltam <Text style={s.forte}>{brl(falta)}</Text>. Guardando <Text style={s.forte}>{brl(porMes(m), false)} por mês</Text> você chega no prazo.
                </Text>
              ) : (
                <Text style={[s.forte, { color: colors.green }]}>Meta batida! 🎉</Text>
              )}

              {somandoId === m.id ? (
                <View style={s.linha}>
                  <TextInput style={[s.input, { flex: 1 }]} value={somaTxt} onChangeText={setSomaTxt} keyboardType="decimal-pad" placeholder="Quanto guardou?" autoFocus />
                  <Pressable style={s.botao} onPress={() => somar(m.id)}><Text style={s.botaoTxt}>Somar</Text></Pressable>
                </View>
              ) : (
                <Pressable onPress={() => { setSomandoId(m.id); setSomaTxt(''); }}>
                  <Text style={s.link}>+ Adicionar valor guardado</Text>
                </Pressable>
              )}
            </Pressable>
          );
        })}

        {metas.length === 0 && !novo && <Text style={s.mudo}>Você ainda não tem metas.</Text>}

        {novo ? (
          <View style={s.card}>
            <Text style={s.nome}>Nova meta</Text>
            <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Nome. Ex: Viagem" />
            <TextInput style={s.input} value={alvoTxt} onChangeText={setAlvoTxt} keyboardType="decimal-pad" placeholder="Valor da meta" />
            <TextInput style={s.input} value={atualTxt} onChangeText={setAtualTxt} keyboardType="decimal-pad" placeholder="Quanto já tenho (opcional)" />
            <TextInput style={s.input} value={prazoTxt} onChangeText={setPrazoTxt} keyboardType="numbers-and-punctuation" placeholder="Prazo (mês/ano). Ex: 06/2027" />
            <View style={s.linha}>
              <Pressable style={[s.botao, { backgroundColor: colors.ground }]} onPress={() => setNovo(false)}>
                <Text style={[s.botaoTxt, { color: colors.ink }]}>Cancelar</Text>
              </Pressable>
              <Pressable style={s.botao} onPress={salvarMeta}><Text style={s.botaoTxt}>Salvar meta</Text></Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={s.novaMeta} onPress={() => setNovo(true)}>
            <Text style={s.novaMetaTxt}>+ Nova meta</Text>
          </Pressable>
        )}
        {metas.length > 0 && <Text style={[s.mudo, { textAlign: 'center' }]}>Segure o dedo numa meta para apagar.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  mudo: { fontSize: 13, color: colors.muted },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: 18, gap: 4 },
  heroLabel: { color: '#C7D2FE', fontSize: 13, fontWeight: '400' },
  heroValor: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nome: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pct: { fontSize: 20, fontWeight: '800', color: colors.green },
  valores: { fontSize: 18, fontWeight: '700', color: colors.ink },
  forte: { fontWeight: '700', color: colors.ink },
  link: { color: colors.primary, fontWeight: '600', paddingVertical: 6 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: colors.ground, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  botao: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  botaoTxt: { color: '#FFFFFF', fontWeight: '700' },
  novaMeta: { minHeight: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  novaMetaTxt: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});
