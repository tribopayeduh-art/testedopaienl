# Correção ERR_MODULE_NOT_FOUND na Vercel

O log de produção confirmou que server.js tentava importar server/pixupDepositIntent.ts. A função publicada não continha esse fonte TypeScript nesse caminho.

A entrada nativa agora é app.mjs. O comando npm run build compila o frontend e empacota todo o backend interno em build/backend.mjs com esbuild. Os pacotes npm continuam externos; os módulos internos .ts não precisam existir no runtime. O vercel.json aplica a configuração da função ao novo entrypoint.

npm run dev continua usando os fontes TypeScript localmente. O bundle de produção não abre porta própria; a plataforma invoca o Express exportado. O arquivo build/ é gerado no build e não precisa ser enviado ao GitHub.

O teste tests/production-bundle.test.ts inicia app.mjs com Node puro em uma pasta temporária que não contém server/ nem os fontes TypeScript. Verifica /api/health e a proteção da sessão. Não acessa banco ou gateway reais.

Depois do commit, publique o novo commit na Vercel. Confirme a presença das variáveis do servidor no ambiente Production. Chaves privadas não foram adicionadas ao repositório. Esta correção resolve a referência ausente constatada; outros erros de configuração precisam dos respectivos logs. A validação final depende de um novo deploy real.
