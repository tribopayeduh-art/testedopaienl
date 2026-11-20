# iNEX — desempenho e sincronização dos jogos

Verificação de 19/10/2026. Projeto Supabase: shmrebownxrvruohvxcp.

## Resultado medido

Uma execução no mesmo ambiente e projeto, sem movimentar saldos reais:

| Consulta | Antes | Depois |
|---|---:|---:|
| Histórico usado para mostrar 200 apostas recentes | 8.020 documentos, 12.260 ms | 200 documentos, 267 ms |
| Plano SQL da consulta ordenada com limite 200 | 26,595 ms | 2,342 ms |

A primeira linha mede a operação no cliente Node e a rede; a segunda mede a execução SQL. São amostras, não garantia de tempo para todo acesso. O histórico completo continua disponível para relatórios que precisam de todos os registros; os limites são aplicados apenas onde o chamador pede uma lista recente.

Os índices e a RPC de consulta recente já foram aplicados no projeto acima. O SQL também está em `supabase/patches/inex_read_performance.sql` para instalações em outro banco. A função é exclusiva do servidor e respeita as permissões existentes.

## Bubble

- Scripts e estilos possuem versões Brotli e gzip, com teste de equivalência dos bytes. Nesta versão: 520.876 bytes originais e 138.705 bytes em Brotli, cerca de 73% menos nessa parte do carregamento.
- Doze imagens grandes possuem variantes WebP sem perda: 17.407.407 para 12.473.180 bytes no conjunto. A equivalência dos pixels RGBA foi verificada durante a geração. O servidor mantém PNG como alternativa e negocia o formato com o navegador.
- O motor usado na página de partida agora chama a API para iniciar e liquidar partidas quando há sessão. O saldo local serve para exibição; não cria crédito real.
- Sem sessão, a partida é uma demonstração identificada com entrada virtual. Ela não é confirmação de aposta no banco.
- Rodadas autenticadas guardam o identificador da aposta. Ao retomar, consultam a propriedade e o estado no servidor. Resultado com resposta incerta pode ser confirmado novamente sem crédito duplicado.
- O formulário de entrada envia identificador de operação. O adaptador não repete POSTs automaticamente depois de falha de rede.
- O painel externo deixa de usar o histórico/saldo de demonstração como origem da carteira e consulta o servidor ao receber atualização da partida.

## Jogos verificados

| Jogo | Consulta no Supabase real | Validação isolada em Postgres |
|---|---|---|
| Bubble | Configuração carregada | Entrada, resultado, repetição, carteira e chamada do motor à API |
| Subway | Configuração carregada | Entrada/liquidação atômicas e isolamento da rodada |
| Gen Dino | Configuração carregada | Carteira, aposta e estatísticas na mesma transação |
| Block Win | Configuração carregada | Carteira, aposta e estatísticas na mesma transação |
| Zumbla | Configuração carregada | APIs genéricas preservam o identificador próprio do jogo |
| Raspa Fortuna | Configuração carregada | Preço do servidor, resultado registrado e prêmio sem crédito repetido |

A raspadinha conserva a distribuição de prêmios do algoritmo anterior, agora executada no servidor. Ela não aceita o saldo ou o prêmio alegado pelo navegador como origem financeira. A cartela só é mostrada após a compra confirmada e o saldo só muda após resposta do servidor. Não liquide automaticamente cartelas antigas que não possuem resultado registrado pelo servidor; elas exigem conciliação.

## Verificações executadas

- TypeScript e compilação de produção passaram.
- 35 testes passaram: banco Postgres isolado, concorrência, acesso público negado, atomicidade, idempotência, separação por jogo e por usuário, compressão e motor Bubble com API simulada.
- Configurações dos seis jogos foram lidas no Supabase real. Não foram criadas apostas nem alterados saldos de jogadores de produção para testar.
- Verificação de segurança do Supabase: nenhum alerta retornado nesta execução.

## Limites da validação

Não é uma certificação de funcionamento 100% em produção. O navegador automatizado não estava disponível neste ambiente; faltam inspeção visual e partidas completas em dispositivos reais. Pagamentos PIX, saques, notificações e provedores externos não foram exercitados com dinheiro real.

Os motores de arcade ainda enviam pontuação/resultado do cliente dentro de limites aceitos pelo servidor. A coerência do saldo e a unicidade da liquidação não substituem um motor de jogo totalmente autoritativo nem uma auditoria de RTP ou antifraude. A configuração do Zumbla e suas APIs foram testadas; um motor visual independente dele não foi validado.

Outras rotas financeiras legadas, como saques, precisam de revisão específica de concorrência e de conciliação com o gateway antes de afirmar cobertura financeira integral. A migração de dados realizada em 18/10 foi um snapshot: alterações posteriores na origem não são sincronizadas automaticamente.

## Executar

Use Node 20 ou superior. Na pasta com `package.json`:

```bat
npm ci
npm run db:check
npm run dev
```

Abra http://localhost:3000. Admin: http://localhost:3000/admin.

O arquivo `.env.local` mantém a chave privada autorizada pelo proprietário. Não publique o ZIP nem envie essa configuração para um repositório público. Preserve os valores originais de JWT_SECRET e SYSTEM_ENCRYPTION_KEY para sessões e configurações criptografadas.
