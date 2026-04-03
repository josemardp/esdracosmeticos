import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, CheckCircle, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NFeItem {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  total: number;
}

interface ParsedNFe {
  fileName: string;
  nNF: string;
  emitente: string;
  dhEmi: string;
  items: NFeItem[];
}

interface LogEntry {
  type: "info" | "success" | "error";
  message: string;
}

interface ImportResult {
  updated: number;
  created: number;
  errors: string[];
}

type Status = "idle" | "parsing" | "ready" | "importing" | "done";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lê o texto de uma tag XML, tentando com namespace NF-e e sem namespace como fallback. */
function getTagText(parent: Element | Document, tag: string): string {
  const ns = "http://www.portalfiscal.inf.br/nfe";
  const withNs = parent.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim();
  if (withNs !== undefined && withNs !== "") return withNs;
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

/** Remove zeros à esquerda do SKU para normalizar comparação com o banco. */
function normalizeSku(rawSku: string): string {
  return rawSku.replace(/^0+/, "") || "0";
}

function safeParseFloat(val: string): number {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Faz o parse de um XML de NF-e e retorna os dados estruturados. */
function parseNFeXml(xmlText: string, fileName: string): ParsedNFe {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("XML inválido ou corrompido");
  }

  const nNF = getTagText(doc, "nNF");
  const emitente = getTagText(doc, "xNome");
  const dhEmi = getTagText(doc, "dhEmi") || getTagText(doc, "dEmi");

  const ns = "http://www.portalfiscal.inf.br/nfe";
  let detNodes = doc.getElementsByTagNameNS(ns, "det");
  if (detNodes.length === 0) detNodes = doc.getElementsByTagName("det");

  const items: NFeItem[] = Array.from(detNodes)
    .map((det) => {
      const rawSku = getTagText(det, "cProd");
      const sku = normalizeSku(rawSku);
      const name = getTagText(det, "xProd");
      const qty = Math.round(safeParseFloat(getTagText(det, "qCom")));
      const unitCost = safeParseFloat(getTagText(det, "vUnCom"));
      const total = safeParseFloat(getTagText(det, "vProd"));
      return { sku, name, qty, unitCost, total };
    })
    .filter((item) => item.sku !== "");

  return { fileName, nNF, emitente, dhEmi, items };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminImportNFePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [parsedNFes, setParsedNFes] = useState<ParsedNFe[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (type: LogEntry["type"], message: string) =>
    setLog((prev) => [...prev, { type, message }]);

  /** Lê os arquivos selecionados, faz o parse e prepara o preview. */
  async function handleFiles(files: FileList | File[]) {
    setStatus("parsing");
    setLog([]);
    setImportResult(null);
    const parsed: ParsedNFe[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".xml")) {
        addLog("error", `${file.name}: ignorado (não é XML)`);
        continue;
      }
      try {
        const text = await file.text();
        const nfe = parseNFeXml(text, file.name);
        parsed.push(nfe);
        addLog("success", `${file.name} — NF ${nfe.nNF} · ${nfe.items.length} itens`);
      } catch (e: any) {
        addLog("error", `${file.name}: ${e?.message ?? "Erro desconhecido"}`);
      }
    }

    if (parsed.length === 0) {
      addLog("error", "Nenhum XML de NF-e válido encontrado.");
      setStatus("idle");
      return;
    }

    setParsedNFes(parsed);
    setStatus("ready");
  }

  /**
   * Estratégia:
   * 1. Carrega todos os produtos do banco com select seletivo.
   * 2. Monta um Map por SKU normalizado para comparação correta.
   * 3. Agrega itens de todas as notas por SKU.
   * 4. Para cada SKU: faz update (somando estoque) se já existe, ou insert se não existe.
   */
  async function handleImport() {
    setStatus("importing");
    addLog("info", "Carregando produtos existentes...");

    const { data: dbProducts, error: loadError } = await supabase
      .from("products")
      .select("id, name, sku, inventory_count, price, cost_price, cover_image");

    if (loadError) {
      addLog("error", `Erro ao carregar produtos: ${loadError.message}`);
      setStatus("ready");
      return;
    }

    // Mapa local por SKU normalizado para não depender de zeros no banco
    const productMap = new Map<string, any>();
    for (const p of dbProducts ?? []) {
      if (p.sku) {
        productMap.set(normalizeSku(p.sku), p);
      }
    }
    addLog("info", `${productMap.size} produtos carregados do banco.`);

    // Agrega itens de todas as notas pelo SKU normalizado
    const aggregated = new Map<string, { name: string; totalQty: number; unitCost: number }>();
    for (const nfe of parsedNFes) {
      for (const item of nfe.items) {
        const existing = aggregated.get(item.sku);
        if (existing) {
          existing.totalQty += item.qty;
          existing.unitCost = item.unitCost; // mantém o custo mais recente
        } else {
          aggregated.set(item.sku, {
            name: item.name,
            totalQty: item.qty,
            unitCost: item.unitCost,
          });
        }
      }
    }

    const result: ImportResult = { updated: 0, created: 0, errors: [] };

    for (const [sku, data] of aggregated) {
      const existing = productMap.get(sku);

      if (existing) {
        // Produto existe: soma estoque e atualiza custo se fornecido
        const newStock = (existing.inventory_count ?? 0) + data.totalQty;
        const updatePayload: Record<string, any> = { inventory_count: newStock };
        if (data.unitCost > 0) updatePayload.cost_price = data.unitCost;

        const { error } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", existing.id);

        if (error) {
          const msg = `Erro ao atualizar SKU ${sku}: ${error.message}`;
          addLog("error", msg);
          result.errors.push(msg);
        } else {
          addLog(
            "success",
            `Atualizado: SKU ${sku} — estoque ${existing.inventory_count ?? 0} → ${newStock}`,
          );
          result.updated++;
        }
      } else {
        // Produto não existe: cria com dados básicos da NF
        const insertPayload: Record<string, any> = {
          name: data.name,
          slug: generateSlug(data.name),
          sku,
          inventory_count: data.totalQty,
          price: 0,
          active: false,
        };
        if (data.unitCost > 0) insertPayload.cost_price = data.unitCost;

        const { error } = await supabase.from("products").insert(insertPayload);

        if (error) {
          const msg = `Erro ao criar SKU ${sku}: ${error.message}`;
          addLog("error", msg);
          result.errors.push(msg);
        } else {
          addLog("success", `Criado: SKU ${sku} — ${data.name} (${data.totalQty} un.)`);
          result.created++;
        }
      }
    }

    addLog(
      "info",
      `Concluído: ${result.updated} atualizados · ${result.created} criados · ${result.errors.length} erro(s).`,
    );
    setImportResult(result);
    setStatus("done");
  }

  function handleReset() {
    setParsedNFes([]);
    setLog([]);
    setImportResult(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const totalItems = parsedNFes.reduce((acc, nfe) => acc + nfe.items.length, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold">Importar NF-e</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload dos XMLs das notas fiscais para atualizar o estoque automaticamente.
          SKUs são normalizados (zeros à esquerda ignorados) para evitar duplicatas.
        </p>
      </div>

      {/* Seletor de arquivos */}
      {(status === "idle" || status === "parsing") && (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center space-y-4">
          <div className="flex justify-center">
            <Upload className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Selecione os arquivos XML das NF-e</p>
            <p className="text-sm text-muted-foreground">Aceita múltiplos arquivos .xml</p>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === "parsing"}
          >
            {status === "parsing" ? "Lendo arquivos..." : "Selecionar arquivos"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>
      )}

      {/* Preview das notas */}
      {(status === "ready" || status === "importing" || status === "done") && (
        <div className="space-y-4">

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Notas fiscais", value: String(parsedNFes.length) },
              { label: "Itens totais", value: String(totalItems) },
              { label: "Emitente", value: parsedNFes[0]?.emitente?.split(" ").slice(0, 3).join(" ") ?? "—" },
              { label: "Arquivos", value: parsedNFes.map((n) => n.fileName).join(", ") },
            ].map((card) => (
              <div key={card.label} className="bg-muted/50 border rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-lg font-semibold truncate" title={card.value}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tabela por NF-e */}
          {parsedNFes.map((nfe) => (
            <div key={nfe.fileName} className="border rounded-lg overflow-hidden">

              {/* Cabeçalho da nota */}
              <div className="bg-muted px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">NF {nfe.nNF}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-xs">
                    {nfe.emitente}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {nfe.dhEmi
                    ? new Date(nfe.dhEmi).toLocaleDateString("pt-BR")
                    : "—"}
                  {" · "}
                  {nfe.items.length} itens
                  {" · "}
                  <span className="font-mono">{nfe.fileName}</span>
                </div>
              </div>

              {/* Itens da nota */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {["SKU", "Produto", "Qtd", "Custo unit.", "Total"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nfe.items.map((item, i) => (
                      <tr
                        key={item.sku + i}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-2 font-mono text-xs text-primary font-semibold whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="px-4 py-2 max-w-xs">
                          <span className="line-clamp-1" title={item.name}>
                            {item.name}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-medium text-center">{item.qty}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {item.unitCost.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground whitespace-nowrap">
                          {item.total.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Ações */}
          <div className="flex gap-3 flex-wrap">
            {status === "ready" && (
              <Button onClick={handleImport} className="gap-2">
                <Upload className="w-4 h-4" />
                Importar {totalItems} {totalItems === 1 ? "item" : "itens"}
              </Button>
            )}
            {status === "importing" && (
              <Button disabled className="gap-2">
                Importando...
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <X className="w-4 h-4" />
              {status === "done" ? "Nova importação" : "Cancelar"}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado resumido */}
      {importResult && (
        <div
          className={[
            "rounded-lg border p-4 flex items-start gap-3",
            importResult.errors.length > 0
              ? "border-destructive/40 bg-destructive/5"
              : "border-green-500/30 bg-green-50/30 dark:bg-green-950/20",
          ].join(" ")}
        >
          {importResult.errors.length === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          )}
          <div className="text-sm space-y-1">
            <p className="font-medium">
              {importResult.updated} produto(s) atualizados ·{" "}
              {importResult.created} produto(s) criados ·{" "}
              {importResult.errors.length} erro(s)
            </p>
            {importResult.errors.map((e, i) => (
              <p key={i} className="text-destructive text-xs">{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Log de operações */}
      {log.length > 0 && (
        <div className="rounded-lg bg-zinc-950 text-zinc-200 p-4 font-mono text-xs leading-relaxed max-h-56 overflow-y-auto space-y-0.5">
          {log.map((entry, i) => (
            <div
              key={i}
              className={
                entry.type === "success"
                  ? "text-green-400"
                  : entry.type === "error"
                  ? "text-red-400"
                  : "text-zinc-400"
              }
            >
              {entry.type === "success" ? "✓ " : entry.type === "error" ? "✗ " : "  "}
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
