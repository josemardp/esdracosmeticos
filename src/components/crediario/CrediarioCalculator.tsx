import React from 'react';
import { useCrediario } from '../../hooks/useCrediario';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, AlertCircle } from 'lucide-react';

const CrediarioCalculator: React.FC = () => {
  const { inputs, results, updateInput, updateParcelas } = useCrediario();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Crediário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorProduto">Valor do Produto (R$)</Label>
                <Input
                  id="valorProduto"
                  type="number"
                  step="0.01"
                  value={inputs.valorProduto}
                  onChange={(e) => updateInput('valorProduto', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
                <Input
                  id="numeroParcelas"
                  type="number"
                  value={inputs.numeroParcelas}
                  onChange={(e) => updateParcelas(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percentualAcrescimo">Acréscimo (%)</Label>
                <Input
                  id="percentualAcrescimo"
                  type="number"
                  step="0.1"
                  value={inputs.percentualAcrescimo}
                  onChange={(e) => updateInput('percentualAcrescimo', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentualDescontoPontualidade">Desconto Pontualidade (%)</Label>
                <Input
                  id="percentualDescontoPontualidade"
                  type="number"
                  step="0.1"
                  value={inputs.percentualDescontoPontualidade}
                  onChange={(e) => updateInput('percentualDescontoPontualidade', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="multaPercentual">Multa por Atraso (%)</Label>
                <Input
                  id="multaPercentual"
                  type="number"
                  step="0.1"
                  value={inputs.multaPercentual}
                  onChange={(e) => updateInput('multaPercentual', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurosAtrasoPercentual">Juros Mensal (%)</Label>
                <Input
                  id="jurosAtrasoPercentual"
                  type="number"
                  step="0.1"
                  value={inputs.jurosAtrasoPercentual}
                  onChange={(e) => updateInput('jurosAtrasoPercentual', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasAtraso">Dias de Atraso</Label>
              <Input
                id="diasAtraso"
                type="number"
                value={inputs.diasAtraso}
                onChange={(e) => updateInput('diasAtraso', parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Resultados da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Valor à Vista</p>
                <p className="text-lg font-bold">{formatCurrency(results.valorAVista)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Crediário</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(results.valorTotalCrediario)}</p>
                <p className="text-xs text-muted-foreground">{inputs.numeroParcelas}x de {formatCurrency(results.valorParcela)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 uppercase font-semibold">Total Pontual (Com Desc.)</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(results.valorTotalPontual)}</p>
                <p className="text-xs text-green-600">{inputs.numeroParcelas}x de {formatCurrency(results.valorParcelaPontual)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700 uppercase font-semibold">Total em Atraso</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(results.valorTotalAtraso)}</p>
                <p className="text-xs text-red-600">Parcela: {formatCurrency(results.valorParcelaAtraso)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Economia por Pontualidade</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(results.economiaPontualidade)}</span>
              </div>

              {results.alertaDesconto && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    O valor total com desconto ({formatCurrency(results.valorTotalPontual)}) é igual ou menor que o valor à vista ({formatCurrency(results.valorAVista)}). Verifique as taxas.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrediarioCalculator;
