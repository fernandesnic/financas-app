import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { migrar } from '@/db';
import { MesProvider } from '@/mes';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="financas.db" onInit={migrar}>
      <MesProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="novo" options={{ presentation: 'modal' }} />
          <Stack.Screen name="classificar" options={{ presentation: 'modal' }} />
        </Stack>
      </MesProvider>
    </SQLiteProvider>
  );
}
