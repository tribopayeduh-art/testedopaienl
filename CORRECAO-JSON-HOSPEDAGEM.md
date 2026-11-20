# Correção de resposta não JSON e pacote de teste

A mensagem Unexpected token T, The page c... significa que uma requisição esperava JSON e recebeu texto ou HTML. O texto parcial não identifica a URL, o status nem a causa exata. Não é possível concluir apenas por essa mensagem que o problema é senha ou chave do Supabase.

Alterações:
- Leitura centralizada de JSON nas chamadas do frontend, com mensagens úteis para respostas de hospedagem e sem exibir HTML bruto.
- Export default do Express em server.ts, mantendo a execução local por npm run dev.
- Configuração Vercel com framework Express, em vez de publicar somente o frontend Vite.
- Frontend compilado preparado em public/ no build da Vercel, incluindo admin.html.
- .env.local incluído somente no pacote privado e no bundle do servidor, fora de public/. Arquivos privados bloqueados pelas rotas do Node.
- Chaves estáveis de sessão e criptografia incluídas para esta instalação de TESTE. Ao atualizar uma instalação existente, preserve os seus JWT_SECRET e SYSTEM_ENCRYPTION_KEY anteriores para não invalidar sessões ou configurações criptografadas.

## Vercel
O vercel.json seleciona Express. Confira nas configurações do projeto se não existem overrides antigos de Framework Vite ou Output Directory dist; remova overrides conflitantes e republique. O projeto é full-stack e exige backend; uma página estática sozinha não faz login.

O .env.local deste ZIP não sobe pelo GitHub, pois continua no .gitignore. Para hospedar via importação do repositório, configure as mesmas variáveis em Settings > Environment Variables na Vercel e faça novo deploy. Para enviar este pacote de teste diretamente pela CLI Vercel, inclua .env.local no upload privado do servidor, nunca em public/ e nunca no repositório público. Não force git add .env.local.

Verifique primeiro /api/health: deve retornar JSON. Isso confirma a rota do backend, mas não comprova conexão com Supabase. Se ainda aparecer uma página de erro, registre URL solicitada e código HTTP na aba Network; a mensagem de erro agora informa quando não é JSON.

O callback Pixup continua usando o domínio anteriormente configurado. Troque PIXUP_POSTBACK_URL pela URL HTTPS pública correta da instalação de teste antes de gerar cobranças. Não misture webhooks de instalações diferentes.

Limitações: a correção foi validada localmente; não foi implantada na sua conta. Processos contínuos, automações Baileys, conexões de tempo real, persistência de arquivos locais e execução de filas exigem validação específica no runtime gerenciado. Este pacote não promete tornar esses serviços permanentes em um ambiente com reinicializações ou múltiplas instâncias.
