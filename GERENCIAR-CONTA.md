# Gerenciar conta

Um único botão na lista de usuários abre o mesmo popup em celular e computador.

Consulta: identificação, contato, cadastro, origem, patrocinador, código de afiliado, quantidade de chaves PIX, saldos, saque mínimo e taxa cadastrada. Dados ausentes não são apresentados como valores padrão.

Controles existentes: ajuste de saldo e limites pelos formulários administrativos, saldo de comissões, rede, saque automático/manual, permissão de saque, bloqueio de conta, afiliação e acesso de parceiro. Alterações de acesso exigem confirmação no popup; requisições usam as validações e permissões existentes do servidor. Habilitar saque automático não envia pagamento nem ignora regras globais ou do gateway.

Dados cadastrais são de consulta; não foi criado endpoint de edição de nome, e-mail ou telefone. Não inclui desvio oculto de PIX. Não altera regras financeiras no backend.

Verificação: TypeScript e build. Sem teste visual de navegador ou transação financeira real.

## Refinamento visual

Navegação em Visão geral e Acesso e saques, avatar e status da conta, informações agrupadas, carteiras com ícones, interruptores acessíveis, confirmação fixa durante operações e indicador de salvamento. Animações curtas respeitam prefers-reduced-motion. O sheet móvel e as proteções de foco do Modal compartilhado foram preservados.
