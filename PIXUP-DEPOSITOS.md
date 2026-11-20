# Depósitos PIX via Pixup

Esta versão usa o seletor de depósitos em Admin > Gateway de pagamentos.
A escolha é salva no banco, aplica-se às novas cobranças e não muda PIX antigos.

## Configuração
Preserve o .env.local da instalação anterior. Este pacote não contém segredos.
Configure PIXUP_CLIENT_ID, PIXUP_CLIENT_SECRET e:
PIXUP_POSTBACK_URL=https://SEU_DOMINIO_REAL/api/webhooks/pixup

Não use seu-dominio.com literalmente. O endpoint precisa receber POST público HTTPS.
Se houver proxy reverso diretamente ligado ao Node, configure PIXUP_TRUSTED_PROXY_IP
apenas com o IP real desse proxy, que deve acrescentar a origem ao X-Forwarded-For.
O webhook verifica a origem Pixup documentada; não basta trocar o domínio no .env.

## Áreas atendidas
- Carteira financeira e /api/charges (painel e Block Win).
- Bubble Win, Gen Dino, Subway Pay e Raspa Fortuna: criação e consulta de PIX.
- /api/finance/deposit: gera cobrança; não credita dinheiro sem confirmação.
- Admin: seletor, consultas da conta e listagem de cobranças pendentes/confirmadas.

Só contas autenticadas e elegíveis podem gerar PIX.
QR Code é gerado localmente a partir do texto retornado pelo provedor.
Uma cobrança pendente do mesmo jogador/valor é reutilizada enquanto válida.
Clientes podem enviar Idempotency-Key para fixar explicitamente uma operação.
Após falha de rede, repita com o mesmo valor e chave; não troque de provedor
para a mesma operação sem verificar o resultado anterior.

A confirmação valida referência local, ID remoto, moeda, tipo e valor.
O crédito e o recibo do extrato são atômicos; webhook repetido não soma novamente.
Sandbox não altera carteira real. A lista de depósitos do admin mostra as cobranças.

## Validação antes de ativar
1. Carregar banco e credenciais no servidor público.
2. Selecionar Pixup e salvar depósitos como superadmin.
3. Gerar um PIX de teste autorizado e conferir código e expiração.
4. Confirmar a entrega do webhook e o crédito único no extrato.
5. Reentregar o evento e confirmar que não houve novo crédito.
6. Testar cada tela de jogo e conferir que ela consulta a referência da própria conta.

Não foi feito pagamento real nesta entrega. Não houve troca do roteamento no banco
de produção. RTP, comissões, saques e bônus não são alterados por esta revisão.
