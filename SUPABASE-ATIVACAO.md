# iNEX — Supabase exclusivo

Este pacote usa somente o projeto shmrebownxrvruohvxcp. O arquivo .env.local inclui a chave secreta de servidor fornecida pelo responsável. Não publique esse arquivo nem compartilhe este ZIP.

## Iniciar no Windows

Na pasta extraída, onde está package.json, execute:

```bat
npm install
npm run db:check
npm run dev
```

Abra http://localhost:3000 e http://localhost:3000/admin.

## Dados

Foram importados e verificados 19.501 documentos em 22 caminhos de coleção. Os registros permanecem no Supabase, na tabela inex_documents; o ZIP contém a aplicação e sua configuração, não uma cópia dos cadastros. Cópia de 18/10/2026 às 15h44 (Brasília); alterações na origem depois desse horário exigem reconciliação antes da troca definitiva.

Login e permissões continuam usando a autenticação da aplicação, com persistência no Supabase. Os usuários importados não são contas de Supabase Auth.

## Configuração do servidor

.env.local é lido automaticamente por Express. A chave secreta não usa prefixo VITE_ e não entra no navegador. .gitignore exclui arquivos .env.

Preserve os valores originais de JWT_SECRET e SYSTEM_ENCRYPTION_KEY do servidor anterior para reutilizar sessões e descriptografar configurações importadas. Se não estiverem disponíveis, reconfigure as credenciais dos serviços pelo painel. Não invente valores para descriptografar dados existentes.

Pagamentos, jogos e notificações dependem das credenciais dos respectivos provedores. O teste de banco não valida essas integrações externas.

## Desempenho e jogos — 19/10/2026

Consulte VERIFICACAO-JOGOS.md para as medições, validações e limites desta versão. A otimização de leitura já foi aplicada ao projeto configurado. Para outro projeto, aplique também o SQL em supabase/patches/inex_read_performance.sql após a estrutura base.


## Atualização do admin em tempo real
Os patches de metadados, métricas, publicação e integridade desta versão já foram aplicados ao projeto iNEX. Consulte ADMIN-TEMPO-REAL.md para os detalhes, a ordem de aplicação em outra instalação e as limitações da verificação.
