# iNEX — Count Masters e catálogo com curva 3D

## Conteúdo desta versão
- Seis banners horizontais em WebP, 1932 × 814 pixels, organizados em uma coluna.
- Inclinação com perspectiva conforme a posição do banner na rolagem; mantém scroll nativo, teclado, toque e preferência por movimento reduzido. Não sequestra a rolagem.
- Os botões permitem abrir o jogo, indicar e consultar suas métricas.
- Count Masters cadastrado como `g_count_masters` no mesmo Supabase da iNEX.
- Regras no admin: ativação/pausa, valor mínimo/máximo, RTP teórico, multiplicador máximo e rodadas recentes. Os controles de física e retenção de outros motores não são apresentados como funcionais neste jogo.
- Cadastro, atribuição de afiliado, depósito e saldo reutilizam o fluxo da iNEX. Conta de parceiro continua impedida de apostar.

## Sobre o arquivo enviado
O ZIP de captura continha HTML, CSS, imagens e o bundle principal. Faltavam `Game-CaGRPsiH.js`, `TutorialGame-GrLL0UlI.js` e o backend referenciado. Por isso, esta entrega implementa um novo jogo inspirado na temática Count Masters, não recupera nem reproduz integralmente o motor original.

A versão integrada é uma corrida por etapas com ilustração Canvas em perspectiva. O jogador seleciona um portal e decide avançar ou resgatar. Os portais alteram a multidão visual; os confrontos são aleatórios e definidos no servidor, com chance da próxima etapa exibida. A jogabilidade e as regras foram escritas de novo e não equivalem ao original ausente.

## Persistência e financeiro
O servidor valida a sessão e a conta novamente em cada operação. Entradas, rodadas, saldo e estatísticas são gravados numa transação otimista do Supabase. Há uma rodada ativa por jogador, retomada ao voltar, chave de idempotência no início e controle de versão de etapa. Repetir uma solicitação não repete débito ou crédito.

- `gameConfigs/g_count_masters`: controles e acumuladores.
- `games/g_count_masters`: catálogo.
- `gameBets`: histórico compartilhado dos jogos, relatórios e painel ao vivo.
- `countRounds`: estado privado da rodada, tabela e semente do servidor.
- `countActive`: referência à última rodada por jogador.
- `gameReceipts`: comprovantes de entrada e prêmio. Usam tipos bet/win e ficam separados de depósitos/saques PIX para não inflar o faturamento e as comissões por depósito.
- `users.balance`: saldo compartilhado do jogador, em reais com operações em centavos inteiros.

O backend utiliza as RPCs e as restrições de acesso já existentes; não foi aberta permissão pública às carteiras ou às sementes. A semente fica oculta até a rodada encerrar. A tabela e o RTP são fixados ao iniciar e não mudam durante a rodada. RTP teórico não garante retorno por sessão. Não há certificação independente do RNG ou do jogo.

## Como testar no Windows CMD
Baixe `inex-admin-realtime-local.zip` em Downloads. Pare o servidor anterior com Ctrl+C. Cole uma vez:

```bat
cd /d "%USERPROFILE%\Downloads" && powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath 'inex-admin-realtime-local.zip' -DestinationPath 'inex-admin-realtime-local' -Force" && cd /d "%USERPROFILE%\Downloads\inex-admin-realtime-local" && npm ci && npm run dev
```

- Plataforma: http://localhost:3000
- Admin: http://localhost:3000/admin
- Count Masters com login/cadastro de jogador: http://localhost:3000/?site=countmasters

No painel de parceiro, a área Jogos mostra os banners e permite indicar cada jogo. A opção de explorar Count Masters não libera apostas para contas de parceiro. Crie/use uma conta de jogador para testar com saldo real. Não há crédito fictício automático nesta versão.

## Verificação
TypeScript, compilação de produção e 53 testes automatizados passaram, incluindo testes PostgreSQL isolados de início repetido, retomada, resgate repetido/simultâneo, perda, encerramento, tentativa com rodada de outro usuário, conta bloqueada/afiliada, pausa, preservação de regras por rodada e preservação dos acumuladores ao salvar no admin.

Os seis arquivos WebP foram decodificados e suas dimensões conferidas. Cadastro/configuração no projeto Supabase foram gravados e relidos. Nenhuma aposta real foi realizada durante os testes. A validação visual/interativa em navegador e celulares não foi executada neste ambiente; precisa ser feita no localhost antes do uso público. Integrações de pagamento e demais jogos mantêm os limites de verificação descritos em VERIFICACAO-JOGOS.md.

O pacote mantém a configuração privada de servidor que você pediu anteriormente. Não publique o ZIP nem os arquivos de ambiente em um repositório público.
