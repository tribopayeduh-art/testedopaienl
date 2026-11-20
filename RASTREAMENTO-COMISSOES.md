# Rastreamento de comissões

Acesso: Administração → Financeiro → Comissões, ou /admin.html?tab=commissions.

## Recursos
- Origem, beneficiário, comprador, valor do lançamento e base da transação.
- Percentual efetivo calculado a partir dos valores históricos disponíveis. Não usa a configuração atual para inventar uma taxa contratada no passado.
- Categorias de afiliado, influenciador, parceiro, rede indireta e retenção inferidas dos identificadores usados pelo sistema. Não representam uma classificação CPA/RevShare historicamente comprovada.
- Filtros de período e estado, busca por nomes/códigos, paginação de 25 registros e totais calculados sobre todos os registros filtrados.
- Detalhes com IDs, estado da origem e verificações de vínculos, valores inválidos e possíveis duplicidades. A mesma transação pode gerar comissões legítimas para diferentes beneficiários ou níveis.
- Atualização pelos eventos administrativos de comissões, transações, afiliados e usuários, além do botão manual. A infraestrutura já existente alterna entre Realtime e consulta periódica.
- Exportação CSV da página atual, protegida pela permissão de exportar relatórios. Células de texto recebem proteção contra fórmulas de planilha.
- Novos lançamentos recebem trackingVersion=1; registros anteriores permanecem intactos.

## Significado dos estados
Registrada: há um registro de comissão com vínculos válidos nas verificações desta tela. Não comprova independentemente o crédito da carteira ou um pagamento bancário.
Retida: o registro existente está marcado isKilled e passou pelas verificações de vínculos; o valor exibido é o que está salvo, inclusive zero.
Revisar: falta de vínculo, origem não aprovada, titular divergente, valor/data inválida ou possível duplicidade. A sinalização não altera dinheiro, apaga registros ou decide automaticamente se uma comissão é devida.

## Permissões e limites
A consulta exige login administrativo e canManageCommissions ou canViewMetrics. O navegador recebe apenas a projeção de auditoria, sem credenciais, documentos pessoais ou objetos completos de usuário. O endpoint lê as coleções existentes no servidor; não houve migração de esquema. A paginação é feita após a leitura, e esta alteração não inclui testes de carga para grandes históricos.

O processamento financeiro legado continua separado da projeção: esta alteração não torna atômico o crédito de todas as comissões, não reprocessa comissões antigas e não prova conciliação integral entre saldo e histórico. Corrigir eventuais diferenças exige analisar os lançamentos apontados, sem recreditar valores automaticamente.

## Validação
Testes de projeção (origem, hierarquia, estados, filtros, totais e valores inválidos) e testes de domínio em Postgres isolado. TypeScript e build verificados. Sem transferências reais ou homologação visual em navegador.
