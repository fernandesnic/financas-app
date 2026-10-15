# financas-app

App Android de controle financeiro pessoal. Ele lê as notificações do banco, anota sozinho o que entra e o que sai, sugere a categoria e mostra gráficos, metas e simulação de rendimento. Tudo fica só no celular, sem servidor.

## O que o app faz

- **Painel:** sobra do mês, entradas, saídas e gráfico por categoria.
- **Lançamentos:** lista do mês, com filtros.
- **Classificar:** o que o app não conseguir identificar sozinho, você escolhe a categoria uma vez, e ele aprende.
- **Novo lançamento:** lançar um valor na mão, com repetição (só uma vez, todo mês ou parcelado).
- **Metas:** progresso de cada meta e quanto guardar por mês para chegar no prazo.
- **Guardado:** total guardado e simulador de rendimento (por exemplo, 100% do CDI).
- **Fixos e parcelas:** gastos que se repetem todo mês e parcelas até o último mês.

## Decisões do projeto

| Tema | Escolha |
| --- | --- |
| Plataforma | Android (só ele permite ler notificações de outros apps) |
| Tecnologia | React Native com Expo |
| Dados | SQLite no próprio celular |
| Servidor | Nenhum. Os dados não saem do celular |
| Leitura de notificações | Permissão de "acesso às notificações" do Android |

## Privacidade

As notificações do banco têm dados sensíveis. O app guarda tudo localmente e não envia nada para a internet. A única busca externa prevista é a taxa do CDI do dia, para o simulador, e ela não leva nenhum dado seu.

## Etapas

1. ✅ Estrutura do projeto e telas.
2. ✅ Banco local (SQLite): lançamentos, categorias, metas, fixos e parcelas.
3. ✅ Lançamento manual e repetição mensal (fixos e parcelas).
4. ⏳ Leitura de notificações de um banco. A classificação com aprendizado já funciona, falta ler as notificações de verdade (precisa de build de desenvolvimento, não roda no Expo Go).
5. ✅ Gráficos e painel com dados reais.
6. ✅ Simulador de rendimento (CDI do dia pelo Banco Central) e metas.
7. ⏳ Outros bancos.

## Como rodar

Precisa do Node.js e do app Expo Go no Android.

```
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o Expo Go (celular e computador na mesma rede Wi-Fi).

## Leitura de notificações (versão instalada)

A leitura das notificações do Nubank e do Santander usa código Android próprio (`mobile/modules/notificacoes`) e **não roda no Expo Go**. É preciso instalar uma versão de desenvolvimento do app (development build), gerada na nuvem com o EAS:

```
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
```

Depois de instalar o APK no celular, use `npx expo start` normalmente (ele abre no app instalado, não no Expo Go). Para continuar usando o Expo Go nas telas: `npx expo start --go`.

Regras: Pix recebido da própria empresa vira Salário (você classifica uma vez e o app aprende); pagamento de fatura do cartão vira Transferência e não entra nos totais; notificações da conta PJ são ignoradas.

## Estado atual

Telas funcionando com banco local. Na primeira abertura o app carrega dados de exemplo; o botão "Apagar dados de exemplo" no Painel limpa tudo para você começar do zero.
