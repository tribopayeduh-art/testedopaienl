# Painéis de afiliados e parceiros

- Entrada progressiva de cartões no desktop via IntersectionObserver e Web Animations, com movimento apenas de posição e opacidade.
- Conteúdo visível mesmo sem suporte a animação. prefers-reduced-motion desativa o movimento, inclusive ao mudar a preferência com a tela aberta.
- Microinterações de navegação, botões, foco de teclado, gráficos e cartões. Sem animações contínuas pesadas ou somas financeiras ilustrativas.
- Cabeçalho do parceiro simplificado, separando “Parceiros” do título da área.
- “Roteamento PIX” substituído no painel do parceiro por “Conferência PIX”: consulta com busca, totais da amostra e detalhes dos registros recebidos do servidor.

## Limite da mudança PIX
O fluxo anterior descrevia desvio oculto de vendas/comissões. Os formulários dessa área foram substituídos por consulta de auditoria. Não foi implementado limite de dois desvios nesse mecanismo. Um fluxo legítimo de rateio requer regras explícitas, ciência dos envolvidos e registros auditáveis.

Nenhuma configuração financeira existente foi desativada ou alterada automaticamente. A mudança de interface, por si só, não interrompe regras já ativas no backend. Os serviços de configuração e outras áreas legadas não foram reescritos nesta alteração.

## Verificação
TypeScript e build de produção passaram. Sem homologação visual em navegador ou movimentação de dinheiro real nesta alteração.
