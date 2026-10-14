import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

export function Placeholder({ titulo }: { titulo: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.ground,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{titulo}</Text>
      <Text style={{ marginTop: 8, color: colors.muted }}>Em construção</Text>
    </View>
  );
}
