# Popup de gerenciamento

“Gerenciar perfil”, na tabela de usuários, agora abre as ações em uma janela modal. Na Gestão de afiliados, “Gerenciar” abre a ficha individual usando o mesmo componente compartilhado.

O popup é renderizado em document.body para ficar acima da tabela e dos contêineres de rolagem. No desktop fica centralizado; no celular usa a folha inferior já existente, com rolagem interna. O componente compartilhado bloqueia a rolagem do fundo, mantém o foco de teclado dentro da janela, permite Esc e restaura o foco ao fechar.

Abrir uma ação que possui sua própria janela fecha a ficha anterior. As permissões e as regras de saque não foram alteradas.

Verificação: TypeScript e build passaram. Validação visual em navegador ainda pendente.
