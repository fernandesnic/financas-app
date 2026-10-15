import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { nomeMes } from '@/datas';
import { useMes } from '@/mes';
import { colors } from '@/theme';

export function MesSwitcher() {
  const { ym, voltar, avancar } = useMes();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Pressable onPress={voltar} hitSlop={8} accessibilityLabel="Mês anterior" style={{ padding: 8 }}>
        <Feather name="chevron-left" size={22} color={colors.ink} />
      </Pressable>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{nomeMes(ym)}</Text>
      <Pressable onPress={avancar} hitSlop={8} accessibilityLabel="Próximo mês" style={{ padding: 8 }}>
        <Feather name="chevron-right" size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}
