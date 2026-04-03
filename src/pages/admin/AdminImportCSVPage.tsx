import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, CheckCircle, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CSVProduct {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  total: number;
}

interface ParsedCSV {
  fileName: string;
  items: CSVProduct[];
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

/**
 * Faz o parse de um CSV e retorna os dados estruturados.
 * Espera um CSV com as colunas: sku, name, qty, unitCost, total
 * (ou variações com espaços/case diferentes)
 */
function parseCSV(csvText: string, fileName: string): ParsedCSV {
  const lines = csvText.trim().split("\n");
  
  if (lines.length < 2) {
    throw new Error("CSV vazio ou sem dados");
  }

  // Parse do header (primeira linha)
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  // Encontra índices das colunas esperadas
  const skuIdx = headers.findIndex((h) => h === "sku" || h === "código" || h === "codigo");
  const nameIdx = headers.findIndex((h) => h === "name" || h === "nome" || h === "produto");
  const qtyIdx = headers.findIndex(
    (h) => h === "qty" || h === "quantidade" || h === "qtd" || h === "quantity"
  );
  const costIdx = headers.findIndex(
    (h) => h === "unitcost" || h === "custo" || h === "custo unitário" || h === "custo unitario" || h === "unit_cost"
  );
  const totalIdx = headers.findIndex(
    (h) => h === "total" || h === "valor total" || h === "valor_total"
  );

  if (skuIdx === -1 || nameIdx === -1 || qtyIdx === -1 || costIdx === -1) {
    throw new Error(
      "CSV deve conter as colunas: SKU, Nome, Quantidade, Custo Unitário (e opcionalmente Total)"
    );
  }

  const items: CSVProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Pula linhas vazias

    const cols = line.split(",").map((c) => c.trim());

    const rawSku = cols[skuIdx] ?? "";
    const sku = normalizeSku(rawSku);
    const name = cols[nameIdx] ?? "";
    const qty = Math.round(safeParseFloat(cols[qtyIdx] ?? "0"));
    const unitCost = safeParseFloat(cols[costIdx] ?? "0");
    const total = totalIdx !== -1 ? safeParseFloat(cols[totalIdx] ?? "0") : qty * unitCost;

    if (sku && name) {
      items.push({ sku, name, qty, unitCost, total });
    }
  }

  if (items.length === 0) {
    throw new Error("Nenhum produto válido encontrado no CSV");
  }

  return { fileName, items };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminImportCSVPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [parsedCSVs, setParsedCSVs] = useState<ParsedCSV[]>([]);
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
    const parsed: ParsedCSV[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        addLog("error", `${file.name}: ignorado (não é CSV)`);
        continue;
      }
      try {
        const text = await file.text();
        const csv = parseCSV(text, file.name);
        parsed.push(csv);
        addLog("success", `${file.name} — ${csv.items.length} itens`);
      } catch (e: any) {
        addLog("error", `${file.name}: ${e?.message ?? "Erro desconhecido"}`);
      }
    }

    if (parsed.length === 0) {
      addLog("error", "Nenhum CSV válido encontrado.");
      setStatus("idle");
      return;
    }

    setParsedCSVs(parsed);
    setStatus("ready");
  }

  /**
   * Estratégia:
   * 1. Carrega todos os produtos do banco com select seletivo.
   * 2. Monta um Map por SKU normalizado para comparação correta.
   * 3. Agrega itens de todos os CSVs por SKU.
   * 4. Para cada SKU: faz update (somando estoque) se já existe, ou insert se não existe.
   */
  async function handleImport() {
    setStatus("importing");
    addLog("info", "Carregando produtos existentes...");

    const { data: dbProducts, error: loadError } = await supabase
      .from("products")
      .select("id, name, sku, inventory_count, price, cover_image");

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

    // Agrega itens de todos os CSVs pelo SKU normalizado
    const aggregated = new Map<string, { name: string; totalQty: number; unitCost: number }>();
    for (const csv of parsedCSVs) {
      for (const item of csv.items) {
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
        // Produto não existe: cria com dados básicos do CSV
        const insertPayload: Record<string, any> = {
          name: data.name,
          slug: generateSlug(data.name),
          sku,
          inventory_count: data.totalQty,
          price: 0,
          active: false,
        };

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
    setParsedCSVs([]);
    setLog([]);
    setImportResult(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const totalItems = parsedCSVs.reduce((acc, csv) => acc + csv.items.length, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold">Importar Produtos via CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload de arquivos CSV para atualizar o estoque automaticamente.
          SKUs são normalizados (zeros à esquerda ignorados) para evitar duplicatas.
        </p>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium mb-2">Formato esperado do CSV:</p>
          <p className="font-mono text-xs mb-2">SKU, Nome, Quantidade, Custo Unitário, Total</p>
          <p className="text-xs">Exemplo:</p>
          <p className="font-mono text-xs">001, Produto A, 10, 15.50, 155.00</p>
          <p className="font-mono text-xs">002, Produto B, 5, 20.00, 100.00</p>
        </div>
      </div>

      {/* Seletor de arquivos */}
      {(status === "idle" || status === "parsing") && (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center space-y-4">
          <div className="flex justify-center">
            <Upload className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Selecione os arquivos CSV</p>
            <p className="text-sm text-muted-foreground">Aceita múltiplos arquivos .csv</p>
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
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>
      )}

      {/* Preview dos CSVs */}
      {(status === "ready" || status === "importing" || status === "done") && (
        <div className="space-y-4">

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Arquivos", value: String(parsedCSVs.length) },
              { label: "Itens totais", value: String(totalItems) },
              { label: "Status", value: status === "done" ? "Concluído" : status === "importing" ? "Importando..." : "Pronto" },
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

          {/* Tabela por CSV */}
          {parsedCSVs.map((csv) => (
            <div key={csv.fileName} className="border rounded-lg overflow-hidden">

              {/* Cabeçalho do arquivo */}
              <div className="bg-muted px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm truncate max-w-xs">
                    {csv.fileName}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {csv.items.length} itens
                </div>
              </div>

              {/* Itens do CSV */}
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
                    {csv.items.map((item, i) => (
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
