# iNEX — admin minimalista

Na pasta extraída, execute no CMD:

```bat
npm install
npm run dev
```

Plataforma: http://localhost:3000/
Admin: http://localhost:3000/admin
Entrada direta: http://localhost:3000/admin.html

## Interface

- Visão geral com quatro indicadores acumulados, gráfico financeiro por período, central de ações e atividade recente.
- O seletor do gráfico alterna entre depósitos, saques e saldo líquido; o controle inferior permite consultar cada ponto. Períodos sem dados exibem estado vazio.
- Detalhamento financeiro em seção expansível, sem repetir todos os indicadores na primeira tela.
- Menu por Operação, Financeiro e Configurações, com busca funcional por seção. Configurações ficam recolhidas quando nenhuma delas está ativa.
- Menu móvel com foco contido, fechamento por Escape e restauração do foco. Navegação inferior com quatro atalhos e acesso às demais seções em Mais.
- Cabeçalho com ações secundárias agrupadas; removida a busca global sem efeito em várias telas. Usuários e depósitos mantêm seus filtros próprios.
- Ações de usuário agrupadas em seções expansíveis; ajustes de saldo, perfil, comissões, permissões e rede mantêm os callbacks existentes. O histórico e a paginação permanecem nas áreas originais.
- Configuração geral de jogos recolhida; configurações por jogo, limites e integração existentes preservados.
- Estilo exclusivo do admin: fundo claro, tipografia mais legível, bordas discretas, cores neutras e sinalização de erro preservada. O painel principal continua com sua entrada e estilos independentes.

## Validação

TypeScript e build multipágina aprovados. Onze testes locais aprovados: estados de renderização com e sem dados, seleção de período, gráfico com valores negativos/vazios, permissões administrativas e transações PIS IO. Páginas compiladas verificadas via HTTP.

A revisão visual em navegador e os fluxos completos com Supabase, pagamentos e jogos reais não foram validados nesta etapa. As conexões e callbacks existentes foram mantidos; isso não equivale a uma validação ponta a ponta dessas integrações. Consulte também PIS-IO-LEIA-ME.md para configuração de transferências.
