# Correção da aprovação de saques

A aprovação administrativa e a aprovação pelo afiliado responsável agora compartilham server/dotfy/withdrawalApproval.ts.

Problemas corrigidos: a reserva de envio acontecia antes de validar a chave PIX; erros conhecidos eram ocultados por uma mensagem genérica; chave salva como objeto podia virar [object Object]; valor líquido em string podia causar erro em toFixed; o painel marcava o saque como aprovado imediatamente depois do envio, sem confirmação bancária.

A validação de conta, valor líquido e destino ocorre antes da reserva. O claim transacional registra um identificador por tentativa e valida se o solicitante e os valores não mudaram desde a leitura. O resultado só atualiza essa mesma tentativa: uma resposta atrasada não libera o processamento de outra tentativa.

Recusas explícitas e documentadas do gateway mantêm a solicitação pendente e liberam somente o bloqueio de envio para uma nova tentativa manual, depois de corrigida a causa. Nenhum saldo é recreditado nessa liberação. Timeout, erro 5xx, resposta inválida e WITHDRAWAL_ALREADY_PENDING mantêm o saque reservado para conciliação. Não existe retry automático de transferência. Saque já vinculado a um ID Dotfy retorna o mesmo ID sem enviar outro PIX.

O painel distingue Pendente, Enviado à Dotfy e Em conciliação. Aprovar e Rejeitar ficam desabilitados quando a transferência está reservada ou já foi enviada. Aprovação em lote usa apenas solicitações ainda não enviadas. A mensagem real de recusa é exibida e a lista é atualizada após a tentativa. Envio não é liquidação: aprovação financeira final continua dependendo da confirmação bancária.

Conciliação de saques divididos em pernas conserva a reserva inteira para revisão; metadados de divisão da criação são persistidos e considerados no worker.

Verificação de produção somente de leitura: 6 solicitações pendentes, 1 marcada como em processamento sem ID Dotfy vinculado, zero dessas pendentes com valor inválido. Não foi possível determinar se esse registro é o mesmo que gerou a mensagem do usuário, pois o erro original não trouxe o ID. Nenhum saque existente foi aprovado, desbloqueado, rejeitado ou estornado nesta revisão. Para o saque antigo sem confirmação, confira o histórico na Dotfy antes de qualquer reenvio; a correção não presume que uma tentativa antiga falhou.

Validação: 75 testes automatizados passaram; TypeScript e build passaram. Testes novos cobrem falha de chave antes do claim, valores decimais armazenados como texto, recusas conhecidas, resposta ambígua, replay sem segundo POST, divisão em pernas e proteção de tentativas concorrentes em Postgres isolado. Nenhuma transferência ou cadastro de chave PIX real foi realizado durante os testes. Verificação visual no navegador pendente.

Credencial Dotfy do servidor e configurações Supabase foram preservadas. O segredo do webhook mencionado no guia anterior continua necessário para as confirmações automáticas.

Extraia este ZIP em pasta nova, execute npm ci && npm run dev e abra http://localhost:3000/admin.
