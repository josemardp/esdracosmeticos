import React from 'react';
import CrediarioCalculator from '../../components/crediario/CrediarioCalculator';
import AdminLayout from '../../components/layout/AdminLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb';
import { LayoutDashboard } from 'lucide-react';

const CrediarioPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
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

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Crediário</h1>
        <p className="text-muted-foreground">
          Simule parcelamentos, descontos por pontualidade e cálculos de atraso para vendas internas.
        </p>
      </div>

      <CrediarioCalculator />
    </div>
  );
};

export default CrediarioPage;
