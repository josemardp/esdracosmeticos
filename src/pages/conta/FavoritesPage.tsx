import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Fav { id: string; product_id: string; products: { name: string; slug: string; price: number; cover_image: string | null } | null; }

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favs, setFavs] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      if (customer) {
        const { data } = await supabase.from("favorites").select("id, product_id, products(name, slug, price, cover_image)").eq("customer_id", customer.id);
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

  if (loading) return <div className="animate-pulse h-40 bg-secondary rounded-xl" />;

  return (
    <div>
      <h2 className="font-display text-xl text-foreground mb-6">Meus Favoritos</h2>
      {favs.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum favorito adicionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {favs.map(f => f.products && (
            <div key={f.id} className="bg-card border rounded-xl overflow-hidden relative">
              <Link to={`/produto/${f.products.slug}`}>
                <div className="aspect-square bg-secondary">
                  {f.products.cover_image && <img src={f.products.cover_image} alt={f.products.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <h3 className="font-body text-sm text-foreground line-clamp-2">{f.products.name}</h3>
                  <p className="font-body text-sm font-semibold text-foreground mt-1">R$ {f.products.price.toFixed(2)}</p>
                </div>
              </Link>
              <button onClick={() => removeFav(f.id)} className="absolute top-2 right-2 bg-card/80 rounded-full p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
