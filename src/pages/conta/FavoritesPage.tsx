import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard, type CardProduct } from "@/components/store/ProductCard";
import { Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Fav { id: string; product_id: string; products: CardProduct | null; }

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      if (customer) {
        const { data } = await supabase.from("favorites").select("id, product_id, products(id, name, slug, price, sale_price, cover_image, inventory_count, brand)").eq("customer_id", customer.id);
        setFavs((data as any) ?? []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const removeFav = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavs(prev => prev.filter(f => f.id !== id));
    toast({ title: "Removido dos favoritos" });
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;

  return (
    <div>
      <h2 className="mb-4 font-display text-[26px] leading-tight text-foreground display-md">Favoritos</h2>
      {favs.length === 0 ? (
        <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
          <Heart className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
          <p className="mb-6 text-base text-foreground">Você ainda não guardou nenhum favorito.</p>
          <Link to="/loja" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">Ver a loja</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
          {favs.map(f => f.products && (
            <div key={f.id} className="relative">
              <ProductCard product={f.products} sizes="(min-width: 1024px) 30vw, 50vw" />
              <button
                onClick={() => removeFav(f.id)}
                aria-label={`Remover ${f.products.name} dos favoritos`}
                title="Remover dos favoritos"
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Heart className="h-[18px] w-[18px] fill-current" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
