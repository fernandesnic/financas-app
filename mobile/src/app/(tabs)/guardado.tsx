import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Barras } from '@/components/Barras';
import { Chip } from '@/components/Chip';
import { carregarCdi, CDI_PADRAO } from '@/cdi';
import { getGuardado, salvarGuardado, type Guardado as GuardadoT } from '@/db';
import { useDados } from '@/db/useDados';
import { lerValor } from '@/datas';
import { brl } from '@/format';
import { POUPANCA_ANUAL, simular } from '@/simulador';
import { colors } from '@/theme';

type Taxa = 'cdi100' | 'cdi110' | 'poupanca' | 'outro';

export default function Guardado() {
  const { dados: g, recarregar, db } = useDados<GuardadoT | null>(getGuardado, null);
  const [cdi, setCdi] = useState({ valor: CDI_PADRAO, data: null as string | null, atualizado: false });
  const [editando, setEditando] = useState(false);
  const [saldoTxt, setSaldoTxt] = useState('');

  const [inicialTxt, setInicialTxt] = useState('');
  const [mensalTxt, setMensalTxt] = useState('500');
  const [mesesTxt, setMesesTxt] = useState('12');
  const [taxa, setTaxa] = useState<Taxa>('cdi100');
  const [outroTxt, setOutroTxt] = useState('');

  useEffect(() => { carregarCdi(db).then(setCdi); }, [db]);

  const saldo = g?.saldo ?? 0;
  const inicial = inicialTxt === '' ? saldo : lerValor(inicialTxt);
  const mensal = lerValor(mensalTxt);
  const meses = Math.max(1, Math.min(600, parseInt(mesesTxt, 10) || 12));
  const anual =
    taxa === 'cdi100' ? cdi.valor : taxa === 'cdi110' ? cdi.valor * 1.1 : taxa === 'poupanca' ? POUPANCA_ANUAL : lerValor(outroTxt);

  const pontos = simular(inicial, mensal, meses, anual);
  const fim = pontos[pontos.length - 1];
  const rendimento = fim.saldo - fim.investido;

  // 5 marcas: hoje + 4 pontos igualmente espaçados
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(meses * f)).filter((m, i, a) => a.indexOf(m) === i);
  const barras = marcas.map((m) => {
    const p = pontos[m];
    return {
      rotulo: m === 0 ? 'hoje' : `${m} m`,
      topo: brl(p.saldo, false).replace('R$ ', ''),
      segmentos: [
        { valor: p.investido, cor: colors.primary },
        { valor: Math.max(0, p.saldo - p.investido), cor: colors.green },
      ],
    };
  });

  async function salvarSaldo() {
    if (g) await salvarGuardado(db, g.id, lerValor(saldoTxt));
    setEditando(false);
    recarregar();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.mudo}>Dinheiro guardado</Text>
          <Text style={s.titulo}>Guardado</Text>
        </View>

        <View style={s.hero}>
          <Text style={s.heroLabel}>Total guardado hoje</Text>
          <Text style={s.heroValor}>{brl(saldo)}</Text>
          <Text style={s.heroLabel}>{g?.nome ?? ''} · {g?.pct_cdi ?? 100}% do CDI</Text>
          {editando ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TextInput
                style={s.inputHero}
                value={saldoTxt}
                onChangeText={setSaldoTxt}
                keyboardType="decimal-pad"
                placeholder="Novo saldo"
                placeholderTextColor="#A5B4FC"
                autoFocus
              />
              <Pressable style={s.botaoHero} onPress={salvarSaldo}><Text style={s.botaoHeroTxt}>Salvar</Text></Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setSaldoTxt(String(saldo).replace('.', ',')); setEditando(true); }} style={{ marginTop: 6 }}>
              <Text style={{ color: '#C7D2FE', textDecorationLine: 'underline' }}>Atualizar saldo</Text>
            </Pressable>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Simulador de rendimento</Text>
          <Text style={s.mudo}>Quanto vai render se eu continuar guardando</Text>

          <Text style={s.rotulo}>Já tenho</Text>
          <TextInput style={s.input} value={inicialTxt} onChangeText={setInicialTxt} keyboardType="decimal-pad" placeholder={String(saldo).replace('.', ',')} />
          <Text style={s.rotulo}>Guardo por mês</Text>
          <TextInput style={s.input} value={mensalTxt} onChangeText={setMensalTxt} keyboardType="decimal-pad" />
          <Text style={s.rotulo}>Por quantos meses</Text>
          <TextInput style={s.input} value={mesesTxt} onChangeText={setMesesTxt} keyboardType="number-pad" />

          <View style={s.quebra}>
            <Chip texto="100% do CDI" ativo={taxa === 'cdi100'} onPress={() => setTaxa('cdi100')} cor={colors.primary} />
            <Chip texto="110%" ativo={taxa === 'cdi110'} onPress={() => setTaxa('cdi110')} cor={colors.primary} />
            <Chip texto="Poupança" ativo={taxa === 'poupanca'} onPress={() => setTaxa('poupanca')} cor={colors.primary} />
            <Chip texto="Outro" ativo={taxa === 'outro'} onPress={() => setTaxa('outro')} cor={colors.primary} />
          </View>
          {taxa === 'outro' && (
            <TextInput style={s.input} value={outroTxt} onChangeText={setOutroTxt} keyboardType="decimal-pad" placeholder="Taxa em % ao ano. Ex: 12,5" />
          )}
        </View>

        <View style={s.card}>
          <Text style={s.mudo}>Em {meses} meses você terá</Text>
          <Text style={s.resultado}>{brl(fim.saldo)}</Text>
          <Barras barras={barras} />
          <View style={s.linhaRes}><Text style={s.legendaNome}>Você coloca</Text><Text style={s.legendaVal}>{brl(fim.investido)}</Text></View>
          <View style={s.linhaRes}><Text style={s.legendaNome}>Rendimento bruto</Text><Text style={[s.legendaVal, { color: colors.green }]}>{brl(rendimento)}</Text></View>
          <Text style={s.mudo}>
            Valores antes do imposto de renda. Taxa usada: {anual.toFixed(2).replace('.', ',')}% ao ano.
            {taxa.startsWith('cdi')
              ? cdi.atualizado
                ? ` CDI do dia (${cdi.data}).`
                : cdi.data
                  ? ` Último CDI salvo (${cdi.data}); sem internet agora.`
                  : ' CDI de exemplo; quando houver internet o app busca o do dia.'
              : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 16, gap: 14 },
  mudo: { fontSize: 12, color: colors.muted },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  hero: { backgroundColor: colors.hero, borderRadius: 20, padding: 18, gap: 4 },
  heroLabel: { color: '#C7D2FE', fontSize: 13 },
  heroValor: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  inputHero: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', paddingHorizontal: 12, fontSize: 16 },
  botaoHero: { minHeight: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#A5B4FC', justifyContent: 'center' },
  botaoHeroTxt: { color: colors.hero, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rotulo: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 4 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: colors.ground, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  quebra: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  resultado: { fontSize: 32, fontWeight: '800', color: colors.green },
  linhaRes: { flexDirection: 'row', justifyContent: 'space-between' },
  legendaNome: { color: colors.ink, fontSize: 14 },
  legendaVal: { color: colors.ink, fontSize: 14, fontWeight: '700' },
});
