import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage } from "@/lib/product-images";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  cover_image: string | null;
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, sale_price, cover_image")
      .eq("active", true)
      .ilike("name", `%${term}%`)
      .limit(8);
    setResults((data as SearchProduct[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    navigate(`/produto/${slug}`);
  };

  const handleSearchAll = () => {
    if (query.trim()) {
      onOpenChange(false);
      navigate(`/loja?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar produtos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading
            ? "Buscando..."
            : query.length < 2
            ? "Digite pelo menos 2 caracteres..."
            : "Nenhum produto encontrado."}
        </CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Produtos">
            {results.map((p) => {
              const img = getProductImage(p.slug, p.cover_image);
              const price = p.sale_price ?? p.price;
              return (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => handleSelect(p.slug)}
                  className="flex items-center gap-3 cursor-pointer py-2.5"
                >
                  <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden shrink-0">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="font-body text-xs text-primary font-medium">
                      R$ {price.toFixed(2)}
                    </p>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {query.trim().length >= 2 && (
          <CommandGroup>
            <CommandItem
              onSelect={handleSearchAll}
              className="justify-center text-primary cursor-pointer"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="font-body text-sm">
                Ver todos os resultados para "{query}"
              </span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
