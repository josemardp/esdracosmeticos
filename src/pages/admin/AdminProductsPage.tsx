import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, X, Upload, Search, AlertTriangle, PackageX } from "lucide-react";

interface Product {
  id: string; name: string; slug: string; sku: string | null; price: number;
  sale_price: number | null; inventory_count: number; active: boolean;
  featured: boolean; new_arrival: boolean; bestseller: boolean;
  category_id: string | null; short_description: string | null;
  full_description: string | null; cover_image: string | null;
  how_to_use: string | null; benefits: string | null; ingredients: string | null;
  tags: string[] | null; brand: string | null; weight_volume: string | null;
}

interface Category { id: string; name: string; }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const fetchProducts = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("id, name, slug, sku, price, sale_price, inventory_count, active, featured, new_arrival, bestseller, category_id, short_description, full_description, cover_image, how_to_use, benefits, ingredients, tags, brand, weight_volume").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setProducts((prods as Product[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openNew = () => {
    setIsNew(true);
    setForm({ name: "", slug: "", sku: "", price: 0, sale_price: null, inventory_count: 0, active: true, featured: false, new_arrival: false, bestseller: false, category_id: null, short_description: "", full_description: "", cover_image: "", how_to_use: "", benefits: "", ingredients: "", tags: [], brand: "", weight_volume: "" });
    setEditing({} as Product);
  };

  const openEdit = (p: Product) => {
    setIsNew(false);
    setForm({ ...p });
    setEditing(p);
  };

  const closeForm = () => { setEditing(null); setForm({}); };

  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const slug = form.slug || generateSlug(form.name);
    const payload = {
      ...form, slug,
      price: Number(form.price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      inventory_count: Number(form.inventory_count) || 0,
    };

    if (isNew) {
      const { error } = await supabase.from("products").insert(payload as any);
      if (error) { toast({ title: "Erro ao criar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Produto criado com sucesso! ✓" });
    } else {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editing!.id);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Produto atualizado ✓" });
    }
    closeForm();
    fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: p.active ? "Produto desativado" : "Produto ativado ✓" });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto excluído" });
    fetchProducts();
  };

  const filtered = products.filter(p => {
    if (catFilter !== "all" && p.category_id !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  const getCatName = (id: string | null) => categories.find(c => c.id === id)?.name || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Produtos</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground min-w-[150px]">
          <option value="all">Todas categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Edit/Create form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-foreground/40 overflow-y-auto">
          <div className="bg-card border rounded-xl p-6 w-full max-w-2xl mx-4 mb-10 animate-fade-in-scale">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-foreground">{isNew ? "Novo Produto" : "Editar Produto"}</h2>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="sm:col-span-2"><Label className="font-body text-xs">Nome *</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Slug</Label><Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label className="font-body text-xs">SKU</Label><Input value={form.sku || ""} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label className="font-body text-xs">Preço *</Label><Input type="number" step="0.01" value={form.price ?? 0} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} /></div>
              <div><Label className="font-body text-xs">Preço Promocional</Label><Input type="number" step="0.01" value={form.sale_price ?? ""} onChange={e => setForm({ ...form, sale_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Opcional" /></div>
              <div><Label className="font-body text-xs">Estoque</Label><Input type="number" value={form.inventory_count ?? 0} onChange={e => setForm({ ...form, inventory_count: parseInt(e.target.value) })} /></div>
              <div>
                <Label className="font-body text-xs">Categoria</Label>
                <select value={form.category_id || ""} onChange={e => setForm({ ...form, category_id: e.target.value || null })} className="w-full border rounded-lg px-3 py-2 font-body text-sm bg-background text-foreground">
                  <option value="">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label className="font-body text-xs">Imagem do produto</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.cover_image && (
                    <img src={form.cover_image} alt="" className="w-16 h-16 object-cover rounded-lg border" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors font-body text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Enviar imagem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const ext = file.name.split(".").pop();
                      const path = `product-${Date.now()}.${ext}`;
                      toast({ title: "Enviando imagem..." });
                      const { error } = await supabase.storage.from("products").upload(path, file);
                      if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); return; }
                      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
                      setForm({ ...form, cover_image: publicUrl });
                      toast({ title: "Imagem enviada ✓" });
                    }} />
                  </label>
                </div>
                <Input value={form.cover_image || ""} onChange={e => setForm({ ...form, cover_image: e.target.value })} placeholder="Ou cole a URL da imagem..." className="mt-2" />
              </div>
              <div><Label className="font-body text-xs">Marca</Label><Input value={form.brand || ""} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Eudora, O Boticário" /></div>
              <div><Label className="font-body text-xs">Volume/Peso</Label><Input value={form.weight_volume || ""} onChange={e => setForm({ ...form, weight_volume: e.target.value })} placeholder="Ex: 100ml, 400g" /></div>
              <div className="sm:col-span-2"><Label className="font-body text-xs">Tags (separadas por vírgula)</Label><Input value={(form.tags || []).join(", ")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} placeholder="kit, combo, dia-das-maes, natal" /></div>
              <div className="sm:col-span-2"><Label className="font-body text-xs">Descrição curta</Label><Textarea value={form.short_description || ""} onChange={e => setForm({ ...form, short_description: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2"><Label className="font-body text-xs">Descrição completa</Label><Textarea value={form.full_description || ""} onChange={e => setForm({ ...form, full_description: e.target.value })} rows={4} /></div>
              <div className="sm:col-span-2"><Label className="font-body text-xs">Modo de uso</Label><Textarea value={form.how_to_use || ""} onChange={e => setForm({ ...form, how_to_use: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2"><Label className="font-body text-xs">Ingredientes</Label><Textarea value={form.ingredients || ""} onChange={e => setForm({ ...form, ingredients: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2 flex flex-wrap gap-4">
                {(["active", "featured", "new_arrival", "bestseller"] as const).map(key => (
                  <label key={key} className="flex items-center gap-2 font-body text-sm">
                    <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                    {{ active: "Ativo", featured: "Destaque", new_arrival: "Lançamento", bestseller: "Mais Vendido" }[key]}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave}>{isNew ? "Criar Produto" : "Salvar Alterações"}</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-4">{search || catFilter !== "all" ? "Nenhum produto encontrado com esses filtros." : "Nenhum produto cadastrado."}</p>
          {search || catFilter !== "all" ? (
            <Button variant="outline" onClick={() => { setSearch(""); setCatFilter("all"); }}>Limpar filtros</Button>
          ) : (
            <Button onClick={openNew}>Cadastrar primeiro produto</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-body text-xs text-muted-foreground mb-2">{filtered.length} produto(s)</p>
          {filtered.map(p => (
            <div key={p.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${
              p.inventory_count === 0 ? 'border-destructive/20' : p.inventory_count < 5 ? 'border-warning/20' : ''
            }`}>
              <div className="w-12 h-12 bg-secondary rounded-lg shrink-0 overflow-hidden">
                {p.cover_image ? <img src={p.cover_image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} /> : <Package className="w-6 h-6 text-muted-foreground m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-body text-sm font-medium text-foreground truncate">{p.name}</h3>
                  {!p.active && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-body shrink-0">Inativo</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body text-xs text-muted-foreground">{p.sku || "Sem SKU"}</p>
                  {getCatName(p.category_id) && <span className="font-body text-[10px] bg-secondary px-1.5 py-0.5 rounded">{getCatName(p.category_id)}</span>}
                  <span className="font-body text-xs text-muted-foreground">R$ {p.price.toFixed(2)}</span>
                  {p.sale_price && <span className="font-body text-xs text-primary font-medium">R$ {p.sale_price.toFixed(2)}</span>}
                  {p.inventory_count === 0 ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-destructive font-medium"><PackageX className="w-3 h-3" /> Zerado</span>
                  ) : p.inventory_count < 5 ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-warning font-medium"><AlertTriangle className="w-3 h-3" /> Est: {p.inventory_count}</span>
                  ) : (
                    <span className="font-body text-xs text-muted-foreground">Est: {p.inventory_count}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(p)} className={p.active ? "text-success" : "text-muted-foreground"}>{p.active ? "✓" : "○"}</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
