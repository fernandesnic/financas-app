import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme';

type Icone = React.ComponentProps<typeof Feather>['name'];

function aba(name: string, title: string, icon: Icone) {
  return (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarIcon: ({ color, size }) => <Feather name={icon} size={size} color={color} />,
      }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
      }}
    >
      {aba('index', 'Painel', 'home')}
      {aba('extrato', 'Extrato', 'list')}
      {aba('guardado', 'Guardado', 'trending-up')}
      {aba('metas', 'Metas', 'target')}
      {aba('fixos', 'Fixos', 'repeat')}
    </Tabs>
  );
}
