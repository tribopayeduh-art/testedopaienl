# iNEX — admin conectado e otimização do Supabase

## O que foi entregue
- Canal Supabase Realtime de metadados: o banco publica somente coleção, contador de revisão e horário. Documentos pessoais, carteiras e segredos não são publicados nesse canal.
- O servidor repassa avisos ao admin por SSE autenticado com Bearer. A chave secreta continua no servidor. Sessões e papéis são revalidados periodicamente.
- Reconexão automática, pausa quando a página fica oculta e retomada com atualização da área aberta. O cabeçalho informa Ao vivo, sincronização periódica, pausa ou reconexão.
- Verificação de revisões a cada 10 segundos recupera mudanças perdidas e funciona como alternativa ao WebSocket. Mudanças de outras instâncias ou feitas diretamente no banco também incrementam os contadores.
- Métricas, usuários, jogos, depósitos, saques, relatórios e administradores são atualizados conforme a área em uso. Jogadores ao vivo, notificações e visão financeira da gateway também recebem avisos. Formulários de configuração não são apagados por uma atualização de leitura.
- As atualizações são agrupadas para reduzir requisições. Não há garantia de latência zero: consulta, rede e renderização levam tempo. Pagamentos externos precisam chegar ao backend via integração/webhook antes de aparecer no admin.

## Mais controles reais no admin
Em Jogos, abra **Controles em lote**: selecione os jogos e pause novas entradas, reative jogos, ative manutenção ou aplique limites mínimo/máximo. O comando grava todos os jogos selecionados numa única transação ou não grava nenhum. Rodadas abertas continuam podendo terminar.

O RTP global também é gravado em uma única transação. A gravação individual detecta uma versão alterada por outro administrador. Os acumuladores de apostas, prêmios e GGR são preservados ao salvar regras. Os limites são conferidos novamente dentro da transação que debita a entrada.

Ajustes individuais de saldo de jogador/afiliado agora leem o saldo atual, aplicam centavos inteiros e gravam comprovante e movimentação na mesma transação. A interface envia uma chave de idempotência para a repetição de uma solicitação com resposta incerta. Créditos simultâneos não sobrescrevem um ao outro. Definir um saldo absoluto usa o saldo consultado como referência e recusa uma alteração se o valor já mudou.

A liquidação manual de rodada no painel ao vivo também usa o ledger atômico. Count Masters segue seu estado e sua tabela próprios. Ações exigem as permissões correspondentes; editar uma carteira não concede permissão para promover alguém a administrador.

## Otimizações
1. O dashboard recebe um resumo SQL em uma leitura consistente, em vez de baixar todos os documentos de usuários, transações e apostas para somá-los em JavaScript. O resumo observado nesta verificação tinha 3.286 bytes.
2. Consultas filtradas por campos principais usam um pré-filtro JSONB que pode aproveitar o índice GIN. A comparação exata original é mantida, inclusive para objetos, arrays, nulos e caminhos aninhados.
3. A consulta de e-mail usa o índice em letras minúsculas. Não usa um usuário em memória depois de ele ter sido removido do banco.
4. Foi removido um índice GIN duplicado; permaneceu o índice equivalente existente.
5. Solicitações simultâneas dos mesmos indicadores compartilham somente a consulta em andamento. Não foi colocado cache de saldo nem cache duradouro de dados financeiros.
6. A abertura do admin carrega a área atual. O botão Atualizar atualiza essa área. A aba de jogos preserva rascunhos e oferece a opção de descartá-los.
7. Os gráficos do dashboard usam o dia de America/Sao_Paulo. Prêmios de jogos e ajustes internos não são contados como novos depósitos PIX no dashboard.

## Verificação concluída
- 53 testes automatizados passaram, incluindo PostgreSQL isolado, concorrência financeira, idempotência, rollback de comandos em lote, comparação de filtros, permissões de RPCs, proteção dos rascunhos e contagem de totais.
- TypeScript e compilação de produção passaram.
- Supabase Realtime foi conectado de verdade e recebeu um evento de metadados gerado por um marcador técnico de saúde. O marcador foi removido por tombstone após o teste. Nenhuma carteira real foi movimentada.
- A publicação foi conferida: somente inex_collection_revisions foi adicionada; inex_documents não foi publicada.
- RLS e os bloqueios de acesso de anon/authenticated foram preservados. A última consulta aos advisors de segurança retornou zero alertas.
- Sete configurações canônicas de jogos foram localizadas. Nenhuma carteira de jogador/afiliado consultada tinha saldo negativo. Nenhum afiliado estava sem usuário atual.

### Pendência histórica encontrada
Há **1 aposta sem vínculo com um usuário atual**. O registro foi preservado. Em Segurança → Vínculos e carteiras, o admin consulta a contagem e exemplos para revisão. Não foi inventada uma conta nem alterado o resultado financeiro para esconder a pendência. Essa auditoria também pode ser refeita pelo botão Verificar.

### Limites da verificação
As medições variam com rede e aquecimento do projeto. A consulta filtrada observada no plano SQL passou de aproximadamente 735 ms a 195 ms em duas execuções pontuais; isso não é um benchmark de carga. Nas amostras HTTP do novo resumo, a primeira chamada levou 7,3–9,4 s e as chamadas seguintes cerca de 1,7–2,0 s. O menor volume transferido não elimina a latência do ambiente.

Não foram feitos testes de carga prolongados nem validação visual/interativa em navegador ou celular nesta rodada. O armazenamento continua usando documentos JSONB e serialização dos commits; não foi transformado num modelo relacional normalizado nem certificado para alta concorrência. As integrações externas e motores antigos mantêm as limitações descritas em VERIFICACAO-JOGOS.md. Esta entrega não certifica 100% de todas as operações legadas.

## Banco já atualizado
Os patches foram aplicados ao projeto Supabase shmrebownxrvruohvxcp. Para este projeto, basta usar o novo código. Para outra instalação, depois do schema base e do patch de leitura anterior, aplicar nesta ordem pelo SQL Editor:
1. supabase/patches/inex_admin_realtime.sql
2. supabase/patches/inex_admin_metrics.sql
3. supabase/patches/inex_admin_realtime_publication.sql
4. supabase/patches/inex_admin_integrity.sql

Não é necessário abrir acesso público às carteiras ou publicar inex_documents para ativar o admin.

## Localhost no Windows CMD
Pare a versão antiga com Ctrl+C. Baixe inex-admin-realtime-local.zip em Downloads e cole uma única vez:

```bat
cd /d "%USERPROFILE%\Downloads" && powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath 'inex-admin-realtime-local.zip' -DestinationPath 'inex-admin-realtime-local' -Force" && cd /d "%USERPROFILE%\Downloads\inex-admin-realtime-local" && npm ci && npm run dev
```

Abra http://localhost:3000/admin. Ao abrir a área, aguarde a restauração da sessão e a conexão do canal. Em outra sessão autorizada, faça uma alteração reversível para conferir a atualização entre as telas. Campos em edição na aba Jogos ficam protegidos até Salvar ou Descartar.

Este pacote mantém a configuração privada de servidor solicitada anteriormente. Guarde-o como arquivo privado.
