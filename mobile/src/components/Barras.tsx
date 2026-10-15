import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

export type Barra = { rotulo: string; topo?: string; segmentos: { valor: number; cor: string }[] };

// Gráfico de barras empilhadas simples, feito só com Views.
export function Barras({ barras, altura = 130 }: { barras: Barra[]; altura?: number }) {
  const max = Math.max(1, ...barras.map((b) => b.segmentos.reduce((s, x) => s + x.valor, 0)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: altura + 40 }}>
      {barras.map((b, i) => {
        const total = b.segmentos.reduce((s, x) => s + x.valor, 0);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 2 }} numberOfLines={1}>{b.topo ?? ''}</Text>
            <View style={{ width: '70%', height: Math.max(2, (total / max) * altura), justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden' }}>
              {[...b.segmentos].reverse().map((sg, k) => (
                <View key={k} style={{ flex: sg.valor, backgroundColor: sg.cor }} />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{b.rotulo}</Text>
          </View>
        );
      })}
    </View>
  );
}
