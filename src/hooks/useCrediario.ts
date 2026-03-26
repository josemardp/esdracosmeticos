import { useState, useMemo } from 'react';
import { CrediarioInputs, CrediarioResults, calcularCrediario } from '../utils/crediario';

const initialState: CrediarioInputs = {
  valorProduto: 100,
  numeroParcelas: 3,
  percentualAcrescimo: 32,
  percentualDescontoPontualidade: 12,
  multaPercentual: 2,
  jurosAtrasoPercentual: 1,
  diasAtraso: 0,
};

export const useCrediario = () => {
  const [inputs, setInputs] = useState<CrediarioInputs>(initialState);

  const results: CrediarioResults = useMemo(() => {
    return calcularCrediario(inputs);
  }, [inputs]);

  const updateInput = (key: keyof CrediarioInputs, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: Math.max(0, value), // Não permitir valores negativos
    }));
  };

  const updateParcelas = (value: number) => {
    setInputs((prev) => ({
      ...prev,
      numeroParcelas: Math.max(1, value), // Parcelas > 0
    }));
  };

  return {
    inputs,
    results,
    updateInput,
    updateParcelas,
  };
};
