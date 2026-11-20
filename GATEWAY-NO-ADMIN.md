# Gateway dentro do painel admin

A área existente da Dotfy agora fica visível no grupo Financeiro, com o nome Gateway, fora do grupo recolhido de Configurações. Reúne as funções já integradas de saldo, extrato, saques, chaves PIX e credenciais. O acesso continua restrito ao superadministrador ou à permissão canManageDotfy; o backend mantém suas verificações existentes.

Acesso direto: http://localhost:3000/admin.html?tab=gateway. O login administrativo continua necessário. O indicador de conexão mostra o estado informado pelo backend, em vez de afirmar que a API está conectada sem resultado.

TypeScript e build passaram. Não foram alteradas credenciais, regras financeiras ou dados no banco. O token mais recente e todas as correções de saques e PIX foram preservados. Verificação visual no navegador pendente.
