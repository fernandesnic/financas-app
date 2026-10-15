import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ultimasNotificacoes, type NotificacaoBruta } from '@/db';
import { useDados } from '@/db/useDados';
import { importarNotificacoes } from '@/notificacoes/importar';
import { abrirConfiguracoes, acessoConcedido, notificacoesDisponivel } from '../../modules/notificacoes';
import { useMes } from '@/mes';
import { colors } from '@/theme';

const ROTULO: Record<string, string> = {
  lancado: 'virou lançamento',
  ignorado: 'ignorada',
  nao_entendi: 'não entendi',
};

export default function Notificacoes() {
  const { atualizar } = useMes();
  const { dados: lista, recarregar, db } = useDados<NotificacaoBruta[]>((d) => ultimasNotificacoes(d, 40), []);
  const [liberado, setLiberado] = useState(acessoConcedido());

  const conferir = useCallback(async () => {
    setLiberado(acessoConcedido());
    if (await importarNotificacoes(db)) atualizar();
    recarregar();
  }, [db, atualizar, recarregar]);

  // quando a pessoa volta da tela de configurações do Android, confere de novo
  useEffect(() => {
    const sub = AppState.addEventListener('change', (e) => e === 'active' && conferir());
    return () => sub.remove();
  }, [conferir]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.topo}>
          <Text style={s.titulo}>Notificações</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Fechar">
            <Feather name="x" size={24} color={colors.ink} />
          </Pressable>
        </View>

        {!notificacoesDisponivel ? (
          <View style={s.card}>
            <Text style={s.nome}>Indisponível no Expo Go</Text>
            <Text style={s.mudo}>A leitura das notificações só funciona na versão instalada do app (development build).</Text>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.nome}>{liberado ? 'Leitura ligada ✓' : 'Leitura desligada'}</Text>
            <Text style={s.mudo}>
              {liberado
                ? 'O app guarda só as notificações do Nubank e do Santander. As de outros apps nunca são lidas.'
                : 'Ligue o acesso às notificações para o app anotar o que entra e sai.'}
            </Text>
            {!liberado && (
              <>
                <Pressable style={s.botao} onPress={abrirConfiguracoes}>
                  <Text style={s.botaoTxt}>Abrir configurações do Android</Text>
                </Pressable>
                <Text style={s.mudo}>
                  Se a opção do Finanças estiver cinza ou aparecer um aviso de "configuração restrita": vá em Configurações › Apps › Finanças › menu (⋮) › "Permitir configurações restritas" e tente de novo.
                </Text>
              </>
            )}
            <Pressable onPress={conferir}>
              <Text style={s.link}>Atualizar agora</Text>
            </Pressable>
          </View>
        )}

        <Text style={s.secao}>Últimas notificações lidas</Text>
        {lista.length === 0 && <Text style={s.mudo}>Ainda nada. Quando o banco avisar uma compra ou Pix, aparece aqui.</Text>}
        {lista.map((n) => (
          <View key={n.id} style={s.card}>
            <Text style={s.mudo}>
              {n.pacote} · {new Date(n.quando).toLocaleString('pt-BR')}
            </Text>
            <Text style={s.nome}>{n.titulo}</Text>
            <Text style={s.texto}>{n.texto}</Text>
            <Text style={[s.etiqueta, n.resultado === 'nao_entendi' && { color: colors.red }]}>{ROTULO[n.resultado] ?? n.resultado}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: 20, gap: 12 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink },
  secao: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 6 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.ink },
  texto: { fontSize: 14, color: colors.ink },
  mudo: { fontSize: 12, color: colors.muted },
  etiqueta: { fontSize: 12, fontWeight: '700', color: colors.green },
  botao: { minHeight: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  botaoTxt: { color: '#FFFFFF', fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '600', paddingVertical: 6 },
});
