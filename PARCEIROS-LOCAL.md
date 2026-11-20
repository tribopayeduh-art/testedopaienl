# iNEX — painel de parceiros minimalista

Execute na pasta extraída:

```bat
npm install
npm run dev
```

Plataforma: http://localhost:3000
Admin independente: http://localhost:3000/admin
Parceiros: faça login e abra o painel de parceiro pela sua conta aprovada.

## Alterações

- Navegação agrupada no computador; no celular, Resumo, Rede, Relatórios e Mais. Eliminada a duplicação dos menus superior e inferior.
- Corrigida a aba móvel antiga `dashboards`, substituída pela entrada real `overview`.
- Resumo com quatro indicadores, gráfico de depósitos da rede, link de convite e destaques por volume. Sem dados artificiais no gráfico; os valores diários podem ser consultados em uma seção expansível.
- Corrigidos indicadores que antes referenciavam nomes incompatíveis com o contrato da API. Comissões, volume, jogadores, afiliados e primeiros depósitos agora usam os campos efetivos de PartnerDashboardData.
- Lista da rede com cartões móveis, tabela no computador, paginação e controles de ordenação, status e RevShare ligados aos filtros existentes. Corrigidos nomes de campos das linhas de afiliados e opção de status inativa incompatível com o filtro.
- Ranking simplificado para uma lista única com ordenação por volume, jogadores ou pontuação e acesso aos detalhes.
- Visual compartilhado entre todas as áreas do parceiro: cores neutras, tipografia legível, bordas suaves e controles consistentes. Popups existentes mantidos; menu Mais usa o componente de diálogo com foco controlado, Escape e abertura inferior no celular.
- Ações e endpoints existentes de comissões, convites, QR Code, comunicados, relatórios e configurações preservados. O admin continua separado.

## Validação

TypeScript, compilação e 14 testes locais passaram, incluindo contrato de campos financeiros do parceiro, dados de afiliados, gráfico, permissões e PIS IO.

A revisão visual em navegador e os fluxos ponta a ponta de Supabase, pagamentos e jogos reais continuam pendentes. Preservar as conexões não equivale a validar todas as integrações externas.
