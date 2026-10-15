import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Chip } from '@/components/Chip';
import { criarCategoria, type Tipo } from '@/db';
import { colors } from '@/theme';

const CORES = ['#E8A317', '#E4572E', '#7B5CE6', '#2E7FD6', '#1FA37A', '#0E8FB5', '#D6457A', '#9A5BD0', '#F2994A', '#8794A6'];

type Props = { tipo: Tipo; onCriada: (id: number) => void };

// Botão "+ Nova categoria" que abre um mini formulário (nome + cor).
export function NovaCategoria({ tipo, onCriada }: Props) {
  const db = useSQLiteContext();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES[0]);

  async function salvar() {
    if (!nome.trim()) return;
    const id = await criarCategoria(db, { nome, cor, tipo });
    setNome('');
    setAberto(false);
    onCriada(id);
  }

  if (!aberto) return <Chip texto="+ Nova categoria" onPress={() => setAberto(true)} />;

  return (
    <View style={s.caixa}>
      <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Nome da categoria" autoFocus maxLength={24} />
      <View style={s.cores}>
        {CORES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCor(c)}
            accessibilityLabel={`Cor ${c}`}
            style={[s.cor, { backgroundColor: c }, cor === c && s.corAtiva]}
          />
        ))}
      </View>
      <View style={s.linha}>
        <Pressable style={[s.botao, { backgroundColor: colors.ground }]} onPress={() => setAberto(false)}>
          <Text style={[s.botaoTxt, { color: colors.ink }]}>Cancelar</Text>
        </Pressable>
        <Pressable style={s.botao} onPress={salvar}>
          <Text style={s.botaoTxt}>Criar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caixa: { width: '100%', gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#D9DEE6' },
  input: { minHeight: 48, borderRadius: 12, backgroundColor: colors.ground, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  cores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cor: { width: 34, height: 34, borderRadius: 17 },
  corAtiva: { borderWidth: 3, borderColor: colors.ink },
  linha: { flexDirection: 'row', gap: 10 },
  botao: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  botaoTxt: { color: '#FFFFFF', fontWeight: '700' },
});
