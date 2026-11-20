# Central de WhatsApp

A interface foi organizada em Conexão, Automações, Campanhas e Histórico. Os campos permanecem montados ao trocar de área, preservando os rascunhos da sessão.

- Cabeçalho curto “WhatsApp”, estado da conexão e ações essenciais.
- Removidos selo ENTERPRISE, taxa fixa de entrega de 99,4% e garantias visuais de proteção contra bloqueio.
- Contagens calculadas a partir dos registros carregados, com estados de consulta e erro. “Enviada” é o estado registrado no servidor, não prova de entrega/leitura pelo destinatário.
- Automações selecionadas calculadas pelos sete controles atuais, identificando alterações não salvas.
- Conexão não confirmada ou indisponível não é apresentada como “pronta”.
- Salvamento bloqueado durante carregamento, falha de leitura ou ausência de alterações. Os endpoints e regras do backend permanecem os mesmos.
- Layout branco com menos contraste decorativo, foco acessível, abas responsivas e transição que respeita movimento reduzido.
- A atualização periódica da conexão pausa com a página oculta. Histórico mantém atualização manual; não é apresentado como confirmação instantânea de todos os envios.

Validação: TypeScript, build e verificação dos novos estados e áreas. Sem envio de mensagens reais e sem homologação visual em navegador.
