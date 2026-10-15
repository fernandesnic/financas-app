import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

type Props = { texto: string; ativo?: boolean; onPress?: () => void; cor?: string };

export function Chip({ texto, ativo, onPress, cor }: Props) {
  const fundoAtivo = cor ?? colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, ativo && { backgroundColor: fundoAtivo, borderColor: fundoAtivo }]}
    >
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
  },
  txt: { fontSize: 14, fontWeight: '500', color: colors.ink },
  txtAtivo: { color: '#FFFFFF', fontWeight: '600' },
});
