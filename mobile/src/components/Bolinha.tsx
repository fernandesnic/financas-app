import React from 'react';
import { View } from 'react-native';

// Ícone redondo da categoria: fundo clarinho + ponto colorido.
export function Bolinha({ cor }: { cor: string | null }) {
  const c = cor ?? '#8794A6';
  return (
    <View
      style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${c}26`, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} />
    </View>
  );
}
