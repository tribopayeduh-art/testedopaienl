# Central de notificações iNEX

Abra o painel administrativo → Notificações. A logo X foi incorporada aos avisos push e ao banner interno.

## Enviar

1. Preencha título (até 80 caracteres), mensagem (até 300) e caminho interno de destino.
2. Selecione todos os usuários, jogadores, afiliados, afiliados com indicações/comissões, influenciadores ou um usuário específico.
3. Escolha validade de 1, 6 ou 24 horas, prioridade e entrega silenciosa quando suportada.
4. Revise a quantidade de usuários e dispositivos. Confirme para enviar imediatamente.
5. Consulte os aceites pelo serviço push, falhas e inscrições expiradas no histórico. Aceite não significa que a notificação foi lida ou exibida.

O teste para a própria conta exige que o administrador tenha permitido as notificações no seu navegador. No iPhone, use o aplicativo instalado na Tela de Início e autorize notificações. Nenhuma mensagem foi disparada a usuários como parte da preparação deste ZIP.

## Regras

- Exige sessão administrativa e permissão canSendNotifications (superadmin tem acesso).
- Não inclui usuários bloqueados nem administradores em campanhas gerais.
- Filtragem sem resultados não amplia o público.
- Apenas inscrições push vinculadas ao usuário, com endpoint HTTPS de provedor conhecido. Preferência campaigns=false é respeitada.
- Testes e alteração de preferências não podem atingir inscrições de outras contas.
- Uma campanha por minuto por administrador; limite de 250 dispositivos por envio síncrono. Para volumes maiores é necessária fila de trabalho externa.
- Identificador de envio e bloqueio de concorrência persistidos por transação no Supabase. A mesma requisição não dispara uma segunda campanha.
- Não há repetição automática de falhas. Registros interrompidos permanecem para revisão.
- Sem links externos no envio administrativo; clique no service worker também restringe a navegação à própria origem.
- Inscrições com 404/410 são removidas, contagem de falhas é preservada.
- Histórico com até 50 registros na tela, sem excluir os registros antigos do banco.

## Vercel e variáveis

Este ZIP foi preparado para envio ao repositório público e não contém .env.local nem segredos privados. As variáveis de produção já existentes na Vercel continuam sendo usadas. Não envie segredos ao GitHub.

Mantenha DATABASE_PROVIDER=supabase, SUPABASE_URL, SUPABASE_SECRET_KEY, JWT_SECRET e SYSTEM_ENCRYPTION_KEY nas variáveis Production da Vercel. O banco deve ter as funções inex_get_document, inex_commit e inex_scan_collection da migração que já acompanha a plataforma. A central usa o armazenamento documental Supabase existente; não exige uma nova tabela para cada campanha.

VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY podem ser configuradas como um par. Se não houver par explícito ou par no cofre existente, uma identidade P-256 estável é derivada com HKDF do SYSTEM_ENCRYPTION_KEY (ou JWT_SECRET), de pelo menos 32 caracteres, em domínio separado. Assim, reinícios serverless não trocam a identidade push. Não altere esses segredos sem planejar a renovação das inscrições. Nunca exponha a chave VAPID privada no cliente.

Execute npm ci, npm run lint e npm run build. Faça o deploy do commit atualizado. O build gera build/backend.mjs e o entrypoint Express app.mjs; os módulos TypeScript internos são empacotados. O limite de função solicitado é de 300 segundos e continua sujeito ao plano da hospedagem.

Confira se o projeto da Vercel está conectado a tribopayeduh-art/platazinha. Um redeploy de um projeto ligado a outro repositório continuará publicando o código desse outro repositório.

## Limites desta entrega

Campanhas desta central são de envio imediato. Agendamento automático e comprovante de leitura não foram implementados; não há timer em memória fingindo agendamento persistente. Entrega efetiva depende da permissão e disponibilidade do navegador/provedor push. Recursos financeiros, jogos e regras RTP não fazem parte desta atualização.
