export interface CrediarioInputs {
  valorProduto: number;
  numeroParcelas: number;
  percentualAcrescimo: number;
  percentualDescontoPontualidade: number;
  multaPercentual: number;
  jurosAtrasoPercentual: number;
  diasAtraso: number;
}

export interface CrediarioResults {
  valorAVista: number;
  valorTotalCrediario: number;
  valorParcela: number;
  valorTotalPontual: number;
  valorParcelaPontual: number;
  valorParcelaAtraso: number;
  valorTotalAtraso: number;
  economiaPontualidade: number;
  alertaDesconto: boolean;
}

export const calcularCrediario = (inputs: CrediarioInputs): CrediarioResults => {
  const {
    valorProduto,
    numeroParcelas,
    percentualAcrescimo,
    percentualDescontoPontualidade,
    multaPercentual,
    jurosAtrasoPercentual,
    diasAtraso,
  } = inputs;

  const valorAVista = valorProduto;
  
  // Valor total com acréscimo do crediário
  const valorTotalCrediario = Number((valorAVista * (1 + percentualAcrescimo / 100)).toFixed(2));
  
  // Valor da parcela base
  const valorParcela = Number((valorTotalCrediario / numeroParcelas).toFixed(2));
  
  // Ajuste do total para evitar diferença de centavos
  const valorTotalCrediarioAjustado = Number((valorParcela * numeroParcelas).toFixed(2));

  // Valor com desconto por pontualidade
  const valorParcelaPontual = Number((valorParcela * (1 - percentualDescontoPontualidade / 100)).toFixed(2));
  const valorTotalPontual = Number((valorParcelaPontual * numeroParcelas).toFixed(2));

  // Cálculo de atraso
  // Juros de atraso proporcional aos dias (base mensal de 30 dias)
  const multa = valorParcela * (multaPercentual / 100);
  const jurosDiario = (jurosAtrasoPercentual / 100) / 30;
  const jurosTotal = valorParcela * jurosDiario * diasAtraso;
  
  const valorParcelaAtraso = diasAtraso > 0 
    ? Number((valorParcela + multa + jurosTotal).toFixed(2))
    : valorParcela;
    
  const valorTotalAtraso = Number((valorParcelaAtraso * numeroParcelas).toFixed(2));

  const economiaPontualidade = Number((valorTotalCrediarioAjustado - valorTotalPontual).toFixed(2));
  
  // Se valor com desconto <= valor à vista → exibir alerta visual
  const alertaDesconto = valorTotalPontual <= valorAVista;

  return {
    valorAVista,
    valorTotalCrediario: valorTotalCrediarioAjustado,
    valorParcela,
    valorTotalPontual,
    valorParcelaPontual,
    valorParcelaAtraso,
    valorTotalAtraso,
    economiaPontualidade,
    alertaDesconto,
  };
};
