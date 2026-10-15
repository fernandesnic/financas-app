import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

type Props = { texto: string; ativo?: boolean; onPress?: () => void; cor?: string; ponto?: string };

export function Chip({ texto, ativo, onPress, cor, ponto }: Props) {
  const fundoAtivo = cor ?? colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, ativo && { backgroundColor: fundoAtivo, borderColor: fundoAtivo }]}
    >
      {ponto && <View style={[s.ponto, { backgroundColor: ativo ? '#FFFFFF' : ponto }]} />}
      <Text style={[s.txt, ativo && s.txtAtivo]}>{texto}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9DEE6',
    backgroundColor: colors.card,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  txt: { fontSize: 14, fontWeight: '500', color: colors.ink },
  txtAtivo: { color: '#FFFFFF', fontWeight: '600' },
});
