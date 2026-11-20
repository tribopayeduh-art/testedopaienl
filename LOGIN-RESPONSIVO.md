# Login iNEX — desktop e celular

Redesign restrito à tela de login.

Desktop: composição branca em duas colunas, apresentação com ilustração CSS sem dados financeiros simulados e formulário de 380 px.
Celular: formulário em coluna única, entradas de 56 px com fonte de 16 px, controles de toque e espaçamento adaptado a telas menores.

Campos, mostrar/ocultar senha, lembrar e-mail, callbacks de login/cadastro/recuperação e estados de erro/carregamento foram preservados. O callback de recuperação existente no aplicativo somente exibe uma mensagem: este redesign não implementa envio de e-mail de recuperação.

Login dentro dos jogos mantém identificação neutra. Cadastro não foi redesenhado. Animações respeitam movimento reduzido. Sem alterações de banco ou autenticação no backend.

Validação: TypeScript e build. O navegador automatizado não iniciou devido às restrições do ambiente; revisão visual e login real permanecem pendentes.

## Aproveitamento do desktop

A partir de 1024 px, a tela ocupa a largura disponível com margem externa de 20 px e altura mínima ajustada à janela. Conteúdo, tipografia e ilustração crescem proporcionalmente, com formulário limitado a 440 px para preservar legibilidade. Ajuste adicional para notebooks e telas baixas. Regras de celular, cadastro e login neutro dos jogos preservadas.
