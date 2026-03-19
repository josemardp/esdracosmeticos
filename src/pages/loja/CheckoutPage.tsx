import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Dados de Contato</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs">Nome completo</Label><Input placeholder="Seu nome" /></div>
                <div><Label className="font-body text-xs">E-mail</Label><Input type="email" placeholder="seu@email.com" /></div>
                <div><Label className="font-body text-xs">Telefone</Label><Input placeholder="(18) 99999-9999" /></div>
                <div><Label className="font-body text-xs">CPF</Label><Input placeholder="000.000.000-00" /></div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Endereço de Entrega</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="font-body text-xs">CEP</Label><Input placeholder="00000-000" /></div>
                <div className="sm:col-span-2"><Label className="font-body text-xs">Rua</Label><Input placeholder="Nome da rua" /></div>
                <div><Label className="font-body text-xs">Número</Label><Input placeholder="123" /></div>
                <div><Label className="font-body text-xs">Complemento</Label><Input placeholder="Apto, bloco..." /></div>
                <div><Label className="font-body text-xs">Bairro</Label><Input placeholder="Bairro" /></div>
                <div><Label className="font-body text-xs">Cidade</Label><Input placeholder="Cidade" /></div>
                <div><Label className="font-body text-xs">Estado</Label><Input placeholder="SP" /></div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-body text-sm font-semibold text-foreground mb-4">Pagamento</h2>
              <div className="space-y-3">
                {["PIX", "Cartão de Crédito", "Boleto Bancário"].map(m => (
                  <label key={m} className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-secondary transition-colors">
                    <input type="radio" name="payment" className="accent-primary" />
                    <span className="font-body text-sm text-foreground">{m}</span>
                  </label>
                ))}
              </div>
              <p className="font-body text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Pagamento 100% seguro
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-xl p-6 h-fit sticky top-24">
            <h3 className="font-body text-sm font-semibold text-foreground mb-4">Resumo do Pedido</h3>
            <div className="text-center py-8">
              <p className="font-body text-sm text-muted-foreground">Seu carrinho está vazio</p>
              <Link to="/loja"><Button variant="outline" size="sm" className="mt-3">Ir à loja</Button></Link>
            </div>
            <div className="border-t pt-4 mt-4 space-y-2 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ 0,00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ 0,00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>- R$ 0,00</span></div>
            </div>
            <div className="flex justify-between font-body font-semibold text-foreground border-t pt-3 mt-3">
              <span>Total</span><span>R$ 0,00</span>
            </div>
            <Button className="w-full mt-4" size="lg" disabled>Confirmar Pedido</Button>
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20ajuda%20para%20finalizar%20minha%20compra%20na%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer" className="block mt-3">
              <Button variant="outline" className="w-full" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" /> Precisa de ajuda?
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
