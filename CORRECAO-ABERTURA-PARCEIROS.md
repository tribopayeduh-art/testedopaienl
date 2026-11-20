# Abertura do painel de parceiros

## Problemas encontrados no código
- O navegador encerrava a requisição após 15 segundos.
- getUsersByPartnerId já consultava todos os usuários, seguido de outra leitura da mesma coleção.
- As leituras de usuários, afiliados, transações e apostas eram executadas sequencialmente.
- A montagem da rede repetia buscas completas por usuário, código e histórico para cada afiliado.

## Mudanças
- Uma leitura por coleção, iniciando as quatro consultas independentes em paralelo.
- Índices em memória por usuário e código de afiliado; históricos agrupados por titular, preservando a ordenação por data.
- Falha ao consultar apostas não é convertida em uma lista vazia com métricas financeiras zeradas.
- Espera máxima de 45 segundos e aviso após oito segundos. Tentar novamente volta a mostrar o carregamento quando ainda não há dados.
- Respostas do painel com Cache-Control no-store.
- Correção de isolamento: os registros PIX adicionais exibidos exigem identificação explícita do parceiro atual, em vez de incluir qualquer transação marcada globalmente.

## Verificação e limites
Três testes direcionados passaram: consultas paralelas iniciadas uma única vez, propagação de falha na leitura e equivalência do agrupamento sem duplicidade ou mistura de usuários. TypeScript e build passaram.
Não foi reproduzida uma sessão autenticada do usuário com o banco remoto nesta alteração. O endpoint ainda lê coleções completas no servidor e mantém o limite legado de mil apostas; não é uma otimização por consulta SQL específica da rede. Latência do banco ou indisponibilidade ainda pode exigir investigação com os logs do servidor.
