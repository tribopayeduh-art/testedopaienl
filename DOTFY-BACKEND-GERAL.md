# Dotfy — backend geral da iNEX

## Fonte e escopo

Integração revisada a partir de https://app.dotfy.com.br/docs/pt/index.html e /docs/pt/reference/index.html. Foram obtidos o OpenAPI 3.1 e a referência completa (125 seções: 11 guias, 113 operações e o contrato de eventos). As cópias oficiais estão em docs/dotfy. O catálogo gerado em server/dotfy/operations.ts cobre as 113 operações não virtuais. data da consulta: 22/10/2026 UTC.

## O que foi conectado

As 27 chamadas upstream existentes no server.ts — depósitos de Bubble, Raspa Fortuna, GEN DINO, Subway, carteira geral/Block, saques, cadastro de chaves e consultas administrativas — usam server/dotfy/client.ts. Não restam fetches diretos à API Dotfy nesses fluxos. Chaves são resolvidas no servidor; uma requisição de jogador não escolhe mais a conta do gateway por apiKey no corpo/query.

O DotfyClient.execute permite usar internamente todas as operações documentadas, inclusive cobranças PIX/boleto, cartão, assinaturas, internacional, saldo, saques, chaves, webhooks, produtos, links, clientes, splits, subcontas, disputas/MEDs, vendas, analytics e notificações. Isso oferece o cliente de backend: não cria telas de checkout, regras de negócio de cada produto, nem habilitações comerciais na conta. O catálogo não é um proxy público de escrita.

O transporte limita chamadas por chave/rota na instância atual, aplica timeout, recusa redirecionamento/host externo e não repete automaticamente escritas após erro de rede. Os tetos entre várias instâncias continuam dependendo da limitação do gateway; este pacote não inclui um limitador distribuído. Não presume Idempotency-Key upstream porque a documentação detalhada diz que ele não existe, apesar da menção na página comercial. Uma falha de rede em escrita continua ambígua: concilie antes de repetir.

Valores de cobrança e saque saem em reais, sem multiplicação indevida; confirmações de cobrança chegam em centavos e são comparadas com o depósito local. Telefone PIX normalizado para DDD + 10/11 dígitos. O prefixo vk_test_ não gera saldo fictício nem é bloqueado como sandbox: a documentação informa que pode movimentar dinheiro real. A simulação local exige ALLOW_PAYMENT_SIMULATION=true e ambiente diferente de production.

## Webhooks de todos os jogos

POST /api/webhooks/dotfy (alias /api/webhooks/pix) valida X-Webhook-Signature no formato t=<epoch_ms>,v1=<HMAC-SHA256 de t.rawBody>, com comparação em tempo constante e tolerância de cinco minutos. Exige o evento e identificador documentados nos cabeçalhos e o corpo event/timestamp/data.

O evento é gravado em dotfy_webhook_events no armazenamento privado Supabase antes do HTTP 200. X-Webhook-ID deduplica entregas; conteúdo divergente com o mesmo ID é recusado. Worker retoma jobs persistidos após reinício, usa leases transacionais e repete a conciliação com espera progressiva. Falhas após 12 tentativas ficam para revisão administrativa. Nenhuma nova tabela ou política pública foi criada; a coleção usa o inex_documents/RPC existente e suas restrições.

Para creditar PIX, consulta a cobrança novamente na API, confere ID, correlationID e valor, e usa o crédito atômico/idempotente existente. O corpo do webhook sozinho não aprova saldo. Eventos de saque consultam a API e só finalizam COMPLETED/FAILED; NEEDS_REVIEW, valores divergentes e divisão explícita em pernas exigem revisão, sem liberar uma reserva inteira automaticamente. O handler nunca procura saques por texto da descrição.

Outras famílias (MED/disputa, internacional, recorrência, splits, KYC) são registradas com state=recorded para auditoria, sem inventar movimentação em BRL a partir de valores internacionais ou de comissões. Não há estorno financeiro automático por disputa; precisa da regra de negócio apropriada. Eventos PIX de estorno/expiração também ficam registrados, sem debitar saldos históricos automaticamente. O ledger do jogador conserva as proteções existentes; processamento de comissões e notificações posterior ao crédito continua no fluxo legado e não é uma nova transação única com o webhook.

## Administração

GET /api/admin/dotfy/capabilities lista operações disponíveis.
GET /api/admin/dotfy/webhook-jobs lista os últimos 50 jobs sem corpo pessoal bruto.
POST /api/admin/dotfy/webhook-jobs/:id/retry retoma somente jobs failed.
GET /api/charges-history agora consulta registros persistidos, limitado a 200 cobranças e 100 eventos, com acesso administrativo.
Todas essas rotas exigem sessão de administrador e canManageDotfy. O pacote não adiciona novas telas para esses endpoints.

## Ativação necessária

A leitura do Supabase foi confirmada sem alterar dados reais. A inspeção detectou ausência de DOTFY_API_KEY no ambiente, chave ativa armazenada não utilizável e segredo de webhook não disponível. A configuração antiga não pôde ser decifrada com o SYSTEM_ENCRYPTION_KEY disponível. Não foram criadas cobranças, cadastradas chaves ou realizados saques reais.

1. Configure uma chave Dotfy válida pelo admin existente ou em DOTFY_API_KEY no ambiente do servidor. Para recuperar configurações criptografadas anteriores, restaure o SYSTEM_ENCRYPTION_KEY original; alternativamente, preencha novamente as credenciais pelo admin.
2. Registre na Dotfy um endpoint público HTTPS apontando para /api/webhooks/dotfy. localhost não recebe chamadas externas. O servidor local pode consultar status pela API, mas webhooks exigem URL pública/túnel configurado por você.
3. Guarde o secret retornado pelo endpoint em DOTFY_WEBHOOK_SECRET (ou no campo webhookSecret das configurações administrativas). Não use a chave de API como secret HMAC. Se usar callbacks por cobrança, configure DOTFY_WEBHOOK_URL com uma URL HTTPS pública; APP_URL HTTPS é o fallback. URLs enviadas pelo jogador/cabeçalho Host não controlam esse destino.
4. Eventos CHARGE_PAID/CREATED/EXPIRED e WITHDRAWAL_COMPLETED/FAILED usam o worker compartilhado. Inscreva demais famílias se quiser o registro para auditoria.
5. Reinicie o servidor após editar variáveis e confira as consultas de saúde. Não publique .env.local em repositório público.

## Validação

66 testes automatizados passaram, mais TypeScript e build. Os testes de integração usam Postgres isolado (PGlite); as chamadas Dotfy dos testes são simuladas por transporte injetado. Foram verificados HMAC bruto/tempo, valores, telefone, ausência de retry de saque, cobertura do catálogo, parâmetros, multipart, confirmação remota, saques ambíguos, deduplicação de evento entre workers e retomada após recriação do worker. Não houve teste bancário de ponta a ponta nem teste visual de todas as telas. Não foi possível executar /api/auth/me real da Dotfy porque não há credencial utilizável.

## Localhost (Windows CMD)

Extraia o ZIP atualizado em pasta nova e execute npm ci && npm run dev. Acesse http://localhost:3000 e http://localhost:3000/admin. O ZIP completo conserva as alterações anteriores: Count Masters fora do catálogo e banners sem botão Explorar jogo.

## Atualização da credencial

Token Dotfy fornecido pelo responsável configurado em DOTFY_API_KEY no .env.local do servidor. Verificação somente de leitura GET /api/auth/me retornou HTTP 200. Não foram criadas cobranças ou executados saques. O segredo HMAC específico do webhook continua pendente: preencher DOTFY_WEBHOOK_SECRET com o secret retornado ao cadastrar o endpoint público HTTPS na Dotfy. O token de API não substitui esse secret. Esta atualização substitui a indicação anterior de chave de API ausente; o problema de recuperação da configuração criptografada antiga permanece independente da nova chave de ambiente.

## Nova atualização do token

O token atualizado fornecido pelo responsável substituiu o DOTFY_API_KEY anterior no .env.local privado do servidor. A nova credencial retornou HTTP 200 em GET /api/auth/me. As correções de saque e resolução de chaves PIX foram preservadas. Nenhuma cobrança ou transferência foi executada nesta verificação. O segredo de assinatura do webhook é uma configuração separada e continua necessário para confirmação automática.
