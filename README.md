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

1. Estrutura do projeto e telas com dados de exemplo.
2. Banco local (SQLite): lançamentos, categorias, metas, fixos e parcelas.
3. Lançamento manual e repetição mensal.
4. Leitura de notificações de um banco e classificação.
5. Gráficos e painel com dados reais.
6. Simulador de rendimento e metas.
7. Outros bancos.

## Estado atual

Em planejamento. O desenho das telas já foi feito como mockup.
