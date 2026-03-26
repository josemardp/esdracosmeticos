import React from 'react';
import CrediarioCalculator from '../../components/crediario/CrediarioCalculator';
import AdminLayout from '../../components/layout/AdminLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LayoutDashboard, ScrollText } from 'lucide-react';

const CrediarioPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Calculadora de Crediário</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Calculadora de Crediário</h1>
          <p className="text-muted-foreground">
            Simule parcelamentos, descontos por pontualidade e cálculos de atraso para vendas internas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <CrediarioCalculator />
        </div>
        
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
                <ScrollText className="h-5 w-5" />
                Regulamento Oficial
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-foreground/80 leading-relaxed">
              <section>
                <h4 className="font-bold text-primary mb-1">1. OBJETIVO</h4>
                <p>Estabelecer regras claras para vendas no crediário, garantindo segurança financeira e transparência ao cliente.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">2. FORMAS DE PAGAMENTO</h4>
                <p>A empresa trabalha com preço à vista e preço no crediário. O crediário possui acréscimo referente à venda a prazo.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">3. DESCONTO POR PONTUALIDADE</h4>
                <p>Pagando cada parcela até o vencimento, o cliente recebe desconto previamente informado. Este desconto não se confunde com o preço à vista.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">4. ATRASO NO PAGAMENTO</h4>
                <p>Em caso de atraso, perde-se o desconto da parcela e incidem multa de 2% e juros de 1% ao mês, conforme legislação.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">5. LIMITE DE CRÉDITO</h4>
                <p>Cada cliente possui limite definido. Não é permitido comprar com parcelas vencidas.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">6. BLOQUEIO</h4>
                <p>Clientes em atraso podem ter o crediário bloqueado até regularização.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">7. EVOLUÇÃO DE CRÉDITO</h4>
                <p>Clientes pontuais podem ter aumento de limite e melhores condições.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">8. TRANSPARÊNCIA</h4>
                <p>Todos os valores são informados no momento da compra.</p>
              </section>
              
              <section>
                <h4 className="font-bold text-primary mb-1">9. ACEITE</h4>
                <p>Ao utilizar o crediário, o cliente concorda com as regras acima.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrediarioPage;
