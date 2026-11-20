# Revisão das conexões Supabase — 20/10/2026 UTC

Pacote baseado exatamente em inex-admin-realtime-local (2).zip enviado nesta conversa.

## Resultado

14 verificações somente de leitura no projeto shmrebownxrvruohvxcp passaram: documento, filtro/paginação, recentes, pesquisa de login por e-mail, revisões, métricas, integridade e os sete documentos de configuração dos jogos. Resultado com tempos em supabase-connection-check.json. São amostras de rede, não teste de carga; a chamada de métricas demorou 7,5 s nesta execução. Nenhum saldo, aposta ou dado pessoal foi alterado nos testes remotos.

O servidor mantém o único cliente privilegiado Supabase. O navegador usa as APIs autenticadas da iNEX; a autenticação existente é própria, persistida no Postgres, e não deve ser confundida com Supabase Auth. O helper público opcional não é usado pelos fluxos atuais. Não há Firebase no código ativo de src/server/scripts.

## Correções

Consultas de usuário por ID/telefone/código, de afiliados por ID/usuário/código, listas de usuários, afiliados, indicações e solicitações de influenciadores não recuperam registros antigos da memória quando o Supabase confirma resultado vazio. Listas de parceiros não misturam contas antigas da memória com o resultado atual. Exclusões e alterações feitas por outra instância passam a prevalecer nessas consultas. Não se criou cache de saldo.

npm run db:check agora verifica as 14 dependências de leitura com concorrência limitada a três. Não grava mais um documento de teste a cada execução. O diagnóstico retorna código de saída 1 se uma dependência falhar; não imprime documentos de usuários, chaves ou exemplos pessoais. Não testa escrita em produção.

## Validação e limites

57 testes automatizados passaram, incluindo exclusão externa de contas/afiliados, coleções vazias com memória antiga, carteiras concorrentes, PIS IO, liquidação idempotente, configurações atômicas, permissões e diagnóstico. TypeScript e build passaram. Testes financeiros de escrita ocorreram em Postgres isolado (PGlite), não em carteiras reais.

Auditoria remota: sete configurações canônicas; zero carteiras negativas de usuários/afiliados; zero afiliados sem usuário; uma aposta histórica sem usuário atual. Histórico preservado para revisão administrativa. Não houve alteração de schema nesta revisão.

SSE/Realtime existente foi revisado no código; não foi revalidado com eventos de escrita em produção nesta execução. Pagamentos reais, cada tela no navegador, antifraude dos jogos e carga concorrente não foram certificados. A estrutura JSONB e a serialização global dos commits permanecem.

O ZIP Bubble enviado está incompleto: faltam Game-Dji4ppkU.js, maps-CnyxLhb7.js e TutorialGame-8zF5aw3J.js. Não foi substituído o motor atual nem apresentada a captura incompleta como um jogo completo.

## Windows CMD

Extrair o ZIP atualizado em pasta nova. Dentro da pasta com package.json:

```bat
npm ci && npm run db:check && npm run dev
```

Plataforma http://localhost:3000 e admin http://localhost:3000/admin. Se o diagnóstico falhar, ele indica a dependência; verificar rede, credencial de servidor e SQL correspondente. A chave secreta permanece somente no ambiente do servidor, como solicitado anteriormente. Não publicar o arquivo de ambiente em repositório público.
