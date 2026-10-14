import React from 'react';
import { View } from 'react-native';

type Props = { progresso: number; cor: string; fundo?: string };

export function ProgressBar({ progresso, cor, fundo = '#E3E8EF' }: Props) {
  const pct = Math.max(0, Math.min(1, progresso)) * 100;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: fundo, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: cor }} />
    </View>
  );
}
