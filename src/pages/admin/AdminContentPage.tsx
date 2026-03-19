import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminContentPage() {
  const [banners, setBanners] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    const { data } = await supabase.storage.from("banners").list("", { limit: 50 });
    if (data) {
      setBanners(data.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => ({
        name: f.name,
        url: supabase.storage.from("banners").getPublicUrl(f.name).data.publicUrl,
      })));
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    else { toast({ title: "Banner enviado!" }); fetchBanners(); }
    setUploading(false);
  };

  const handleDelete = async (name: string) => {
    await supabase.storage.from("banners").remove([name]);
    toast({ title: "Banner removido" });
    fetchBanners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Conteúdo</h1>
        <label className="cursor-pointer">
          <Button size="sm" disabled={uploading} asChild><span><Plus className="w-4 h-4 mr-1" /> {uploading ? "Enviando..." : "Novo Banner"}</span></Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-body text-sm font-semibold text-foreground mb-4">Banners da Loja</h3>
        {banners.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">Nenhum banner cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map(b => (
              <div key={b.name} className="relative group rounded-lg overflow-hidden border">
                <img src={b.url} alt={b.name} className="w-full aspect-video object-cover" />
                <button onClick={() => handleDelete(b.name)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
