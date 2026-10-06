/**
 * Every text the user reads, in Brazilian Portuguese. Keys stay in English like the rest of the
 * code; components and helpers read from here and never hold user-facing text themselves.
 */
export const messages = {
  map: {
    region: 'Mapa',
    tools: 'Ferramentas do mapa',
    panel: 'Painel de terrenos',
  },
  toolbar: {
    modes: 'Modo do mapa',
    listPlot: 'Anunciar terreno',
    editingPlot: 'Editando terreno',
    searchArea: 'Buscar numa área',
  },
  panel: {
    plots: 'Terrenos',
    newPlot: 'Novo terreno',
    search: 'Busca',
  },
  hints: {
    idle: 'Arraste e dê zoom no mapa para explorar. Use a barra de ferramentas para anunciar um terreno ou buscar numa área.',
    drawingPlot:
      'Clique no mapa para marcar os cantos do terreno. Dê um duplo clique para terminar.',
    drawingSearch: 'Clique no centro da área e clique de novo para definir o raio.',
    editingPlot: 'Preencha os dados do terreno que você desenhou.',
    searching: 'Mostrando só os terrenos que alcançam o círculo. Refine com os filtros.',
  },
  drawing: {
    undo: 'Desfazer último ponto',
    plotShortcuts: 'Atalhos: Esc cancela · Ctrl+Z desfaz o último ponto.',
    searchShortcuts: 'Atalho: Esc cancela.',
  },
  plotsInView: {
    mapLoading: 'Carregando o mapa…',
    zoomIn: 'Aproxime o mapa para ver os terrenos desta área.',
    failed: 'Não foi possível carregar os terrenos. Tente novamente em instantes.',
    loading: 'Carregando terrenos…',
    none: 'Ainda não há terrenos nesta área.',
    count: (count: number) =>
      count === 1 ? '1 terreno nesta área.' : `${count} terrenos nesta área.`,
  },
  plotForm: {
    label: 'Novo terreno',
    price: 'Preço',
    description: 'Descrição',
    contact: 'Contato',
    contactPlaceholder: 'Telefone ou e-mail',
    save: 'Salvar terreno',
    redraw: 'Redesenhar',
    cancel: 'Cancelar',
    saved: 'Terreno anunciado.',
    area: (area: string) => `Área: ${area}`,
    areaAndPricePerSquareMeter: (area: string, pricePerSquareMeter: string) =>
      `Área: ${area} · ${pricePerSquareMeter}`,
    technicalDetail: (detail: string) => `Detalhe técnico: ${detail}`,
    errors: {
      price:
        'Informe um preço acima de 0: só números, com até 2 casas decimais (sem separador de milhar).',
      descriptionRequired: 'Descreva o terreno.',
      descriptionTooLong: (max: number) => `Use no máximo ${max} caracteres.`,
      contactRequired: 'Informe um telefone ou e-mail.',
      contactTooLong: (max: number) => `Use no máximo ${max} caracteres.`,
      descriptionRejected: 'Descrição recusada. Use até 2.000 caracteres.',
      contactRejected: 'Contato recusado. Use até 255 caracteres.',
    },
    saveErrors: {
      highlighted: 'Confira os campos destacados.',
      rejected: 'O servidor recusou os dados do terreno.',
      overlap: 'Este terreno sobrepõe um terreno já anunciado. Redesenhe-o numa área livre.',
      invalidDrawing: 'O desenho não é um terreno válido. Confira se as bordas não se cruzam.',
      server: 'Não foi possível salvar o terreno. Tente novamente em instantes.',
      network: 'Não foi possível salvar o terreno. Confira sua conexão.',
    },
  },
  popup: {
    label: 'Detalhes do terreno',
    close: 'Fechar',
    contact: 'Contato:',
    listedOn: (date: string) => `Anunciado em ${date}`,
  },
  search: {
    radius: (radius: string) => `Raio: ${radius}`,
    capped: (limit: string) => `A busca é limitada a ${limit}.`,
    filters: 'Filtros',
    minPrice: 'Preço mín.',
    maxPrice: 'Preço máx.',
    minArea: 'Área mín.',
    maxArea: 'Área máx.',
    apply: 'Aplicar filtros',
    clear: 'Limpar',
    newCircle: 'Desenhar outro círculo',
    searching: 'Buscando…',
    failed: 'Não foi possível buscar. Tente novamente em instantes.',
    none: 'Nenhum terreno alcança este círculo.',
    count: (count: number) =>
      count === 1 ? '1 terreno alcança este círculo.' : `${count} terrenos alcançam este círculo.`,
  },
  searchFilters: {
    number: 'Use só números, com até 2 casas decimais (sem separador de milhar).',
    maxBelowMin: 'Não pode ser menor que o mínimo.',
  },
} as const;
