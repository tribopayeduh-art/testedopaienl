# Responsividade e interações móveis

Esta versão mantém a central de notificações, o visual neutro e os relatórios da versão anterior.

- Cabeçalhos e botões ajustados para telas pequenas; controles principais têm áreas de toque de 44–46 pixels.
- Safe areas superiores e inferiores consideradas em dispositivos com recortes e indicador de início.
- A altura visível é acompanhada pela API visualViewport, com fallback para innerHeight. Popups e o painel acompanham o espaço disponível ao abrir o teclado.
- A navegação inferior do admin é escondida quando o teclado é detectado; o parceiro continua sem barra inferior.
- Seletor de área do parceiro no topo, com largura contida e texto legível.
- Formulários móveis com fontes de 16px e campos maiores; a página permite zoom manual para acessibilidade.
- Tabelas mantêm todas as colunas com rolagem horizontal localizada. Relatórios exibem orientação de deslize.
- Filtros, indicadores e ferramentas reorganizados em colunas menores. Moedas e títulos longos podem quebrar linha.
- Popups móveis abrem pela base com cabeçalho fixo, botão de fechar maior e altura limitada ao espaço visível.
- Seções voltam ao topo ao navegar, com entrada curta. A preferência de movimento reduzido desativa as animações.
- Ajustes específicos para largura inferior a 360px, tablets e celular deitado.
- O menu lateral do admin fecha ao mudar para a largura de desktop.

Validação: TypeScript, build de produção e os testes existentes de CSV, políticas de notificações e inicialização do backend. Não foi concluída uma inspeção visual em iPhone/Android reais; não se afirma compatibilidade perfeita com todos os navegadores.

Para publicar, envie o conteúdo extraído ao repositório tribopayeduh-art/platazinha e faça o redeploy do novo commit. Preserve as variáveis de ambiente na Vercel. Este pacote não contém chaves privadas.
