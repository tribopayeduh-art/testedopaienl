# Identidade dos jogos

Removidas referências visuais da plataforma nos contextos de jogo: carregador/GIF, cabeçalho de Count Masters, metadados author/publisher e logotipo de login/cadastro no acesso direto. Modais compartilhados herdam o contexto neutro. A navegação do painel é ocultada durante as partidas e retorna ao sair do jogo. O catálogo usa apenas a categoria, sem o rótulo iNEX Originals.

O HTML inicial tem carregamento neutro antes de iniciar React. A abertura com GIF da plataforma permanece no portal; acessos diretos aos jogos não exibem esse GIF. Identificadores internos, eventos de sincronização e credenciais do servidor foram preservados para manter a integração com Supabase e carteiras.

Count Masters ganhou metadados próprios, evitando o fallback para a identidade do painel. Nos termos compartilhados, a identificação visual no contexto dos jogos passa a plataforma; as cláusulas permanecem.

Validação: 59 testes automatizados, TypeScript e build passaram. Inclui teste de renderização do carregamento neutro e identificação estruturada dos seis contextos de jogo existentes. Verificação visual no navegador ainda pendente. Não foi modificado o banco nem o motor do Bubble.

Para Windows CMD, extraia em uma pasta nova e execute npm ci && npm run dev. Plataforma http://localhost:3000 e admin http://localhost:3000/admin.
