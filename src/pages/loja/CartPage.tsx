import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

// Simple cart state (will be replaced with context/Supabase later)
// For now this demonstrates the UI structure
export default function CartPage() {
  const [items] = useState<any[]>([]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-3">Seu carrinho está vazio</h1>
          <p className="font-body text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Descubra nossos produtos incríveis e adicione ao carrinho para começar suas compras.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/loja"><Button size="lg">Explorar Produtos <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            <a href="https://wa.me/5518991459429?text=Olá,%20quero%20ajuda%20para%20escolher%20produtos%20da%20Esdra%20Cosméticos." target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline"><MessageCircle className="w-4 h-4 mr-2" /> Pedir Recomendação</Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-8">Carrinho</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-card border rounded-xl p-4 flex gap-4">
              <div className="w-20 h-20 bg-secondary rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-body text-sm font-medium text-foreground truncate">{item.name}</h3>
                <p className="font-body text-sm text-primary font-semibold mt-1">R$ {item.price?.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border rounded">
                    <button className="px-2 py-1"><Minus className="w-3 h-3" /></button>
                    <span className="px-3 font-body text-xs">{item.qty}</span>
                    <button className="px-2 py-1"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card border rounded-xl p-6 h-fit sticky top-24">
          <h3 className="font-body text-sm font-semibold text-foreground mb-4">Resumo do Pedido</h3>
          <div className="space-y-2 font-body text-sm border-b pb-4 mb-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ 0,00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-success text-xs">A calcular</span></div>
          </div>
          <div className="flex justify-between font-body font-semibold text-foreground mb-4">
            <span>Total</span><span>R$ 0,00</span>
          </div>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Cupom de desconto" className="text-sm" />
            <Button variant="outline" size="sm">Aplicar</Button>
          </div>
          <Link to="/checkout"><Button className="w-full" size="lg">Finalizar Compra</Button></Link>
        </div>
      </div>
    </div>
  );
}
