# Atualização visual do admin e do parceiro

## Admin

- Paleta neutra para cartões, ícones, botões, indicadores e popups. Cores de erro discretas mantêm significado.
- Melhor uso da largura em computadores grandes e espaçamentos consistentes.
- Janelas compartilhadas e camadas de operação com fundo branco, bordas suaves e ações legíveis; em telas pequenas, as janelas de operação usam abertura pela base.
- Relatórios com gráfico de depósitos e saques, intervalo informado, busca por nome/e-mail/identificação e filtro de status nas transações.
- Exportar esta visão gera CSV da aba selecionada e aplica a busca/filtro nas listas. O botão de exportação de influenciadores preserva sua função anterior.
- As transações disponíveis podem ser exibidas em lotes de 50. O botão não busca dados adicionais no servidor: mostra o restante dos dados já carregados.
- O resumo de caixa é descrito como operacional, sem se apresentar como demonstrativo contábil auditado. O fluxo de caixa não equivale a lucro.

## Parceiros

- A barra inferior geral da plataforma não aparece quando o painel de parceiros está aberto.
- A antiga barra inferior própria do parceiro foi removida. No computador, a navegação lateral permanece; no celular, use o seletor de seção no topo.
- Relatórios redesenhados com gráfico neutro, totais do intervalo, detalhamento diário, ordenação de datas e exportação CSV.
- Os botões de intervalo trabalham sobre os dias retornados pelo servidor. A quantidade disponível é indicada e não são fabricados dados de dias ausentes.
- Nova seção Ferramentas e metas: convite, QR Code, comunicação, CSV da rede, relatórios, conferência PIX, simulador e ranking.
- Metas de volume acumulado e quantidade de afiliados ficam salvas somente no navegador, por parceiro. Não alteram comissões, saldos ou permissões financeiras.
- O simulador informa que seus valores são ilustrativos e não constituem promessa de ganhos.

As exportações consideram somente os dados acessíveis ao usuário no painel. Células textuais com fórmulas são neutralizadas no CSV. A exportação de rede utiliza o total de jogadores convidados e a comissão gerada para o parceiro, sem inventar métricas.

A central de notificações da versão anterior foi preservada. Não houve disparo de notificações, transação real, mudança de RTP ou migração de dados nesta atualização.

## Validar e publicar

npm ci
npm run lint
npm run build

Envie o conteúdo extraído para tribopayeduh-art/platazinha, faça commit e publique o novo commit no projeto correto da Vercel. Mantenha as variáveis de ambiente de produção na Vercel. Este ZIP não contém credenciais privadas nem node_modules.

A compilação, o TypeScript e os testes de CSV/notificações/inicialização do backend foram executados. A tentativa de revisão visual automatizada foi impedida por uma restrição de inicialização do Chromium no ambiente; a inspeção visual em dispositivos reais permanece necessária após publicar.
