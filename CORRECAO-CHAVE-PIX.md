# Chave PIX não encontrada

A aprovação usava o pixKeyId salvo no saque sem conferir se o identificador existia na conta Dotfy da credencial atual. IDs de outra conta não identificam a mesma chave no gateway.

Agora o envio administrativo e o envio pelo afiliado responsável resolvem a chave PIX efetiva (CPF, e-mail, telefone etc.) na conta atual. O ID salvo não substitui essa consulta. Se não houver o valor real da chave, o sistema apenas valida o ID atual; um ID inexistente exige recadastro da chave do solicitante e nunca é registrado como se fosse um endereço PIX.

Chaves PENDING_APPROVAL e REJECTED bloqueiam o envio antes de reservar a tentativa financeira. Quando a chave efetiva não existe, o cadastro no gateway ocorre no fluxo de aprovação autorizado, mas uma chave recém-cadastrada só é usada se a Dotfy a devolver como APPROVED. Um novo cadastro pode precisar de liberação no gateway. Não é escolhida uma chave padrão ou de outro titular como substituta.

GET /api/pix-keys real: HTTP 200, uma chave na conta, aprovada. Não foram impressos dados da chave nem informações do titular, e não foram cadastradas chaves nem executadas transferências reais durante os testes.

79 testes, TypeScript e compilação passaram. Inclui regressão com ID de conta antiga, chave válida na conta atual, ID sem endereço real, chaves pendentes/rejeitadas e cadastro ainda não aprovado. O teste bancário de ponta a ponta e a verificação visual continuam pendentes.

As reservas de saques antigos com resultado incerto não foram liberadas: exigem conciliação antes de reenvio. O segredo do webhook continua necessário para confirmação automática.
