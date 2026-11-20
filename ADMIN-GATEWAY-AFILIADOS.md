# Admin — gateway, afiliados e saque automático

## Onde acessar
- /admin.html?tab=affiliates — Gestão de afiliados.
- /admin.html?tab=gateway — Gateway Dotfy.

## Afiliados
Nova lista com busca, filtro por modo de saque, paginação, carteira de comissões, acumulado e acesso à rede. A ficha individual configura Automático ou Manual para novas solicitações.

A alteração exige canManageUsers e canApproveWithdrawals, ou superadmin. O vínculo da carteira é validado no servidor. O salvamento verifica se o estado mudou desde a consulta e grava usuário e auditoria atomicamente. Ajustes de saldo continuam sujeitos a canManageBalances. Nenhum saldo é movimentado ao salvar a política.

O automático não supera bloqueios de conta, saque desativado, saldo de demonstração, afiliação inativa ou condição de influenciador. Também depende da chave Dotfy e do segredo de assinatura do webhook. Sem essa configuração, pedidos seguem para análise manual. Ativar a preferência não paga solicitações anteriores nem agenda repasses.

## Gateway
Central com origem da credencial ativa, estado da URL e da assinatura de webhook e política global. Mantidos saldos, extrato, chaves PIX, saques e controles de conexão. Chave ativa e segredo HMAC não são mais devolvidos ao navegador, inclusive para superadmin; campos vazios preservam os segredos anteriores.

A chave DOTFY_API_KEY do servidor tem prioridade sobre uma chave salva pelo painel. Isso aparece na interface. Salvar a URL local não registra automaticamente um endpoint no provedor: o webhook precisa estar cadastrado na Dotfy e seu segredo correspondente precisa estar configurado. A presença dos campos não certifica a entrega de callbacks.

O botão global envia o estado desejado explicitamente, evitando inversão acidental em uma repetição do mesmo comando. Campos de modo aceitam booleanos, sem converter a string “false” para verdadeiro.

Os indicadores de saques automáticos separam pendentes e volume marcado como aprovado no histórico. Registros legados aprovados não são automaticamente considerados prova bancária; não foram migrados ou reclassificados.

## Fluxo financeiro de novas solicitações
1. O formulário envia um identificador de solicitação; o servidor o vincula à conta autenticada e aos dados do pedido.
2. Em transação única, valida política/conta/taxa/saldo, reserva o valor na carteira de comissões e cria o pedido pendente. Repetir o mesmo identificador retorna o registro existente.
3. Há apenas uma nova solicitação pendente por afiliado neste fluxo. Novos pedidos ficam bloqueados enquanto houver análise ou confirmação pendente. Saques antigos não foram reprocessados.
4. No automático, o envio reutiliza a aprovação com tentativa persistente, validação da chave PIX e proteção contra repetição. O formulário não chama a Dotfy diretamente.
5. Aceitação do gateway mantém o saque pendente. A conclusão depende da conciliação bancária; respostas ambíguas preservam a reserva e não são reenviadas automaticamente.
6. Uma recusa ou falha anterior ao envio mantém o pedido para análise. O admin pode corrigir a causa e aprovar explicitamente ou rejeitar quando não houver tentativa incerta/saque enviado.
7. Rejeição de pedido ainda não enviado devolve o valor à carteira de comissões; confirmação de falha bancária usa a liquidação existente. Não credita a carteira de jogador por engano.

O novo campo requestId exige o frontend atualizado; clientes antigos precisam recarregar a página. Novos registros usam as coleções privadas JSONB existentes e a coleção interna affiliate_cashout_requests para controle de pedidos; não há tabela pública nova ou migração de esquema. A coleção foi incluída no exportador administrativo.

## Verificação
95 testes da suíte passaram, incluindo testes em Postgres isolado para configuração, auditoria, reserva única, repetição concorrente, recusa e carteira de estorno. Após os últimos ajustes, 31 testes direcionados e o build também passaram. TypeScript validado. Nenhuma chave PIX, transferência ou configuração de produção foi criada/alterada por estes testes. Homologação visual no navegador e pagamento real continuam pendentes.

Este pacote não implementa varredura programada de saldos, não altera automaticamente políticas de contas no banco remoto e não certifica 100% dos fluxos financeiros legados.
