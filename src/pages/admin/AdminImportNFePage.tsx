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

// CSV extends NFeItem com campos opcionais extras
interface CSVItem extends NFeItem {
  price?: number;
  brand?: string;
  weight_volume?: string;
  active?: boolean;
}

interface ParsedCSV {
  fileName: string;
  items: CSVItem[];
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
type FileMode = "xml" | "csv" | null;

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

/** Interpreta valores booleanos comuns: true/1/sim/yes → true */
function parseActive(val: string): boolean | undefined {
  if (!val.trim()) return undefined;
  return ["true", "1", "sim", "yes", "ativo", "active"].includes(val.trim().toLowerCase());
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

/**
 * Parser CSV leve e robusto — sem dependências externas.
 * Suporta separador vírgula ou ponto e vírgula.
 * Colunas reconhecidas: sku, name, qty, unitCost, price, brand, weight_volume, active
 */
function parseCSV(csvText: string, fileName: string): { parsed: ParsedCSV; skippedLines: number } {
  // Normaliza quebras de linha e divide
  const rawLines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Filtra linhas totalmente vazias
  const nonEmptyLines = rawLines.filter((l) => l.trim() !== "");
  if (nonEmptyLines.length < 2) {
    throw new Error("CSV vazio ou sem dados (precisa de cabeçalho + ao menos 1 linha)");
  }

  // Detecta separador pelo cabeçalho
  const headerRaw = nonEmptyLines[0];
  const sep = headerRaw.includes(";") ? ";" : ",";

  // Parse dos cabeçalhos (lowercase + trim)
  const headers = headerRaw.split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));

  // Índices das colunas (flexível)
  const idx = {
    sku:           headers.findIndex((h) => ["sku", "código", "codigo", "cod"].includes(h)),
    name:          headers.findIndex((h) => ["name", "nome", "produto", "descricao", "descrição"].includes(h)),
    qty:           headers.findIndex((h) => ["qty", "qtd", "quantidade", "quantity", "estoque"].includes(h)),
    unitCost:      headers.findIndex((h) => ["unitcost", "custo", "custo unitário", "custo unitario", "unit_cost", "cost"].includes(h)),
    price:         headers.findIndex((h) => ["price", "preco", "preço", "venda", "selling_price"].includes(h)),
    brand:         headers.findIndex((h) => ["brand", "marca"].includes(h)),
    weight_volume: headers.findIndex((h) => ["weight_volume", "volume", "peso", "weight", "gramatura"].includes(h)),
    active:        headers.findIndex((h) => ["active", "ativo", "ativa", "status"].includes(h)),
  };

  if (idx.sku === -1 || idx.name === -1 || idx.qty === -1 || idx.unitCost === -1) {
    throw new Error(
      `CSV deve ter ao menos as colunas: SKU, Nome, Quantidade e Custo. Colunas encontradas: ${headers.join(", ")}`
    );
  }

  const items: CSVItem[] = [];
  let skippedLines = 0;

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    if (!line.trim()) continue;

    // Split respeitando aspas simples e duplas
    const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));

    const rawSku = cols[idx.sku] ?? "";
    const rawName = cols[idx.name] ?? "";

    // Ignora linhas sem SKU e sem nome
    if (!rawSku && !rawName) {
      skippedLines++;
      continue;
    }

    const sku = normalizeSku(rawSku);
    const name = rawName;
    const qty = Math.round(safeParseFloat(cols[idx.qty] ?? "0"));
    const unitCost = safeParseFloat(cols[idx.unitCost] ?? "0");

    // Campos opcionais: só inclui se a coluna existir e o valor não estiver vazio
    const price  = idx.price !== -1 && cols[idx.price]?.trim()
      ? safeParseFloat(cols[idx.price])
      : undefined;
    const brand  = idx.brand !== -1 && cols[idx.brand]?.trim()
      ? cols[idx.brand].trim()
      : undefined;
    const weight_volume = idx.weight_volume !== -1 && cols[idx.weight_volume]?.trim()
      ? cols[idx.weight_volume].trim()
      : undefined;
    const active = idx.active !== -1 && cols[idx.active]?.trim()
      ? parseActive(cols[idx.active])
      : undefined;

    if (!sku || !name) {
      skippedLines++;
      continue;
    }

    items.push({ sku, name, qty, unitCost, total: qty * unitCost, price, brand, weight_volume, active });
  }

  if (items.length === 0) {
    throw new Error("Nenhum produto válido encontrado no CSV");
  }

  return { parsed: { fileName, items }, skippedLines };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminImportNFePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileMode, setFileMode] = useState<FileMode>(null);
  const [parsedNFes, setParsedNFes] = useState<ParsedNFe[]>([]);
  const [parsedCSVs, setParsedCSVs] = useState<ParsedCSV[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (type: LogEntry["type"], message: string) =>
    setLog((prev) => [...prev, { type, message }]);

  /** Lê os arquivos selecionados, detecta extensão e faz o parse correto. */
  async function handleFiles(files: FileList | File[]) {
    setStatus("parsing");
    setLog([]);
    setImportResult(null);
    setParsedNFes([]);
    setParsedCSVs([]);

    const xmlFiles: File[] = [];
    const csvFiles: File[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext === "xml") xmlFiles.push(file);
      else if (ext === "csv") csvFiles.push(file);
      else addLog("error", `${file.name}: ignorado (extensão não suportada — use .xml ou .csv)`);
    }

    // Não mistura XML e CSV na mesma importação
    if (xmlFiles.length > 0 && csvFiles.length > 0) {
      addLog("error", "Não misture arquivos XML e CSV na mesma importação. Selecione apenas um tipo.");
      setStatus("idle");
      return;
    }

    // ── Fluxo XML ──────────────────────────────────────────────────────────
    if (xmlFiles.length > 0) {
      const parsed: ParsedNFe[] = [];
      for (const file of xmlFiles) {
        try {
          const text = await file.text();
          const nfe = parseNFeXml(text, file.name);
          parsed.push(nfe);
          addLog("success", `[XML] ${file.name} — NF ${nfe.nNF} · ${nfe.items.length} itens`);
        } catch (e: any) {
          addLog("error", `${file.name}: ${e?.message ?? "Erro desconhecido"}`);
        }
      }
      if (parsed.length === 0) {
        addLog("error", "Nenhum XML de NF-e válido encontrado.");
        setStatus("idle");
        return;
      }
      setFileMode("xml");
      setParsedNFes(parsed);
      setStatus("ready");
      return;
    }

    // ── Fluxo CSV ──────────────────────────────────────────────────────────
    if (csvFiles.length > 0) {
      addLog("info", "Arquivo(s) lido(s) como CSV.");
      const parsed: ParsedCSV[] = [];
      for (const file of csvFiles) {
        try {
          const text = await file.text();
          const { parsed: csv, skippedLines } = parseCSV(text, file.name);
          parsed.push(csv);
          addLog("success", `[CSV] ${file.name} — ${csv.items.length} itens válidos`);
          if (skippedLines > 0) {
            addLog("info", `  → ${skippedLines} linha(s) ignorada(s) (vazias ou sem SKU/nome)`);
          }
        } catch (e: any) {
          addLog("error", `${file.name}: ${e?.message ?? "Erro desconhecido"}`);
        }
      }
      if (parsed.length === 0) {
        addLog("error", "Nenhum CSV válido encontrado.");
        setStatus("idle");
        return;
      }
      setFileMode("csv");
      setParsedCSVs(parsed);
      setStatus("ready");
      return;
    }

    addLog("error", "Nenhum arquivo .xml ou .csv foi selecionado.");
    setStatus("idle");
  }

  /**
   * Importa os dados para o Supabase.
   * — XML: soma inventory_count (comportamento original)
   * — CSV: soma inventory_count + atualiza price/cost/brand/weight_volume/active
   *        quando os campos vierem preenchidos. Cria produto se não existir.
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

    // Mapa local por SKU normalizado
    const productMap = new Map<string, any>();
    for (const p of dbProducts ?? []) {
      if (p.sku) productMap.set(normalizeSku(p.sku), p);
    }
    addLog("info", `${productMap.size} produtos carregados do banco.`);

    const result: ImportResult = { updated: 0, created: 0, errors: [] };

    // ── Importação XML (comportamento original) ────────────────────────────
    if (fileMode === "xml") {
      const aggregated = new Map<string, { name: string; totalQty: number; unitCost: number }>();
      for (const nfe of parsedNFes) {
        for (const item of nfe.items) {
          const existing = aggregated.get(item.sku);
          if (existing) {
            existing.totalQty += item.qty;
            existing.unitCost = item.unitCost;
          } else {
            aggregated.set(item.sku, { name: item.name, totalQty: item.qty, unitCost: item.unitCost });
          }
        }
      }

      for (const [sku, data] of aggregated) {
        const existing = productMap.get(sku);
        if (existing) {
          const newStock = (existing.inventory_count ?? 0) + data.totalQty;
          const { error } = await supabase
            .from("products")
            .update({ inventory_count: newStock })
            .eq("id", existing.id);
          if (error) {
            const msg = `Erro ao atualizar SKU ${sku}: ${error.message}`;
            addLog("error", msg); result.errors.push(msg);
          } else {
            addLog("success", `Atualizado: SKU ${sku} — estoque ${existing.inventory_count ?? 0} → ${newStock}`);
            result.updated++;
          }
        } else {
          const insertPayload = {
            name: data.name, slug: generateSlug(data.name),
            sku, inventory_count: data.totalQty, price: 0, active: false,
          };
          const { error } = await supabase.from("products").insert(insertPayload);
          if (error) {
            const msg = `Erro ao criar SKU ${sku}: ${error.message}`;
            addLog("error", msg); result.errors.push(msg);
          } else {
            addLog("success", `Criado: SKU ${sku} — ${data.name} (${data.totalQty} un.)`);
            result.created++;
          }
        }
      }
    }

    // ── Importação CSV (ampliada) ──────────────────────────────────────────
    if (fileMode === "csv") {
      // Agrega por SKU (última linha de cada SKU vence nos campos opcionais)
      type AggCSV = {
        name: string; totalQty: number; unitCost: number;
        price?: number; brand?: string; weight_volume?: string; active?: boolean;
      };
      const aggregated = new Map<string, AggCSV>();

      for (const csv of parsedCSVs) {
        for (const item of csv.items) {
          const existing = aggregated.get(item.sku);
          if (existing) {
            existing.totalQty += item.qty;
            existing.unitCost = item.unitCost;
            if (item.price !== undefined)         existing.price = item.price;
            if (item.brand !== undefined)         existing.brand = item.brand;
            if (item.weight_volume !== undefined) existing.weight_volume = item.weight_volume;
            if (item.active !== undefined)        existing.active = item.active;
          } else {
            aggregated.set(item.sku, {
              name: item.name, totalQty: item.qty, unitCost: item.unitCost,
              price: item.price, brand: item.brand,
              weight_volume: item.weight_volume, active: item.active,
            });
          }
        }
      }

      for (const [sku, data] of aggregated) {
        const existing = productMap.get(sku);

        if (existing) {
          // Produto existe: soma estoque + atualiza campos que vieram preenchidos
          const newStock = (existing.inventory_count ?? 0) + data.totalQty;
          const updatePayload: Record<string, any> = { inventory_count: newStock };
          if (data.price !== undefined)         updatePayload.price = data.price;
          if (data.unitCost > 0)                updatePayload.cost  = data.unitCost;
          if (data.brand !== undefined)         updatePayload.brand = data.brand;
          if (data.weight_volume !== undefined) updatePayload.weight_volume = data.weight_volume;
          if (data.active !== undefined)        updatePayload.active = data.active;

          const { error } = await supabase
            .from("products").update(updatePayload).eq("id", existing.id);

          if (error) {
            const msg = `Erro ao atualizar SKU ${sku}: ${error.message}`;
            addLog("error", msg); result.errors.push(msg);
          } else {
            const extras = [
              data.price !== undefined ? `preço R$${data.price.toFixed(2)}` : null,
              data.brand ? `marca: ${data.brand}` : null,
              data.active !== undefined ? `ativo: ${data.active}` : null,
            ].filter(Boolean).join(", ");
            addLog(
              "success",
              `Atualizado: SKU ${sku} — estoque ${existing.inventory_count ?? 0} → ${newStock}${extras ? ` · ${extras}` : ""}`
            );
            result.updated++;
          }
        } else {
          // Produto não existe: cria com todos os campos disponíveis
          const insertPayload: Record<string, any> = {
            name: data.name,
            slug: generateSlug(data.name),
            sku,
            inventory_count: data.totalQty,
            price: data.price ?? 0,
            active: data.active ?? false,
          };
          if (data.unitCost > 0)                insertPayload.cost = data.unitCost;
          if (data.brand !== undefined)         insertPayload.brand = data.brand;
          if (data.weight_volume !== undefined) insertPayload.weight_volume = data.weight_volume;

          const { error } = await supabase.from("products").insert(insertPayload);
          if (error) {
            const msg = `Erro ao criar SKU ${sku}: ${error.message}`;
            addLog("error", msg); result.errors.push(msg);
          } else {
            addLog("success", `Criado: SKU ${sku} — ${data.name} (${data.totalQty} un.)`);
            result.created++;
          }
        }
      }
    }

    addLog(
      "info",
      `Concluído: ${result.updated} atualizados · ${result.created} criados · ${result.errors.length} erro(s).`
    );
    setImportResult(result);
    setStatus("done");
  }

  function handleReset() {
    setParsedNFes([]);
    setParsedCSVs([]);
    setLog([]);
    setImportResult(null);
    setFileMode(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const totalItems =
    fileMode === "xml"
      ? parsedNFes.reduce((acc, nfe) => acc + nfe.items.length, 0)
      : parsedCSVs.reduce((acc, csv) => acc + csv.items.length, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold">Importar NF-e / CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload de XML de NF-e <em>ou</em> de um CSV para atualizar o estoque automaticamente.
          SKUs são normalizados (zeros à esquerda ignorados) para evitar duplicatas.
        </p>
        {/* Dica de formato CSV */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-200">
          <p className="font-medium mb-1">Formato CSV aceito (vírgula ou ponto e vírgula):</p>
          <p className="font-mono text-xs">sku,name,qty,unitCost,price,brand,weight_volume,active</p>
          <p className="font-mono text-xs mt-1 text-blue-700 dark:text-blue-300">
            001,Produto A,10,12.50,29.90,Marca X,100ml,true
          </p>
          <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
            Colunas opcionais: price, brand, weight_volume, active — deixe vazio para não alterar campos existentes.
          </p>
        </div>
      </div>

      {/* Seletor de arquivos */}
      {(status === "idle" || status === "parsing") && (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center space-y-4">
          <div className="flex justify-center">
            <Upload className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Selecione arquivos XML (NF-e) ou CSV</p>
            <p className="text-sm text-muted-foreground">Aceita múltiplos arquivos .xml ou múltiplos .csv (não misture os dois tipos)</p>
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
            accept=".xml,.csv"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>
      )}

      {/* Preview */}
      {(status === "ready" || status === "importing" || status === "done") && (
        <div className="space-y-4">

          {/* Badge de origem */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              fileMode === "csv"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800"
            }`}>
              {fileMode === "csv" ? "📄 CSV" : "📋 XML / NF-e"}
            </span>
            <span className="text-sm text-muted-foreground">
              {fileMode === "csv"
                ? `${parsedCSVs.length} arquivo(s) · ${totalItems} itens`
                : `${parsedNFes.length} nota(s) · ${totalItems} itens`}
            </span>
          </div>

          {/* Cards de resumo — XML */}
          {fileMode === "xml" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Notas fiscais", value: String(parsedNFes.length) },
                { label: "Itens totais",  value: String(totalItems) },
                { label: "Emitente",      value: parsedNFes[0]?.emitente?.split(" ").slice(0, 3).join(" ") ?? "—" },
                { label: "Arquivos",      value: parsedNFes.map((n) => n.fileName).join(", ") },
              ].map((card) => (
                <div key={card.label} className="bg-muted/50 border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-lg font-semibold truncate" title={card.value}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cards de resumo — CSV */}
          {fileMode === "csv" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Arquivos",     value: String(parsedCSVs.length) },
                { label: "Itens totais", value: String(totalItems) },
                { label: "Status",       value: status === "done" ? "Concluído" : status === "importing" ? "Importando..." : "Pronto" },
              ].map((card) => (
                <div key={card.label} className="bg-muted/50 border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-lg font-semibold truncate" title={card.value}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabela — XML */}
          {fileMode === "xml" && parsedNFes.map((nfe) => (
            <div key={nfe.fileName} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">NF {nfe.nNF}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-xs">{nfe.emitente}</span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {nfe.dhEmi ? new Date(nfe.dhEmi).toLocaleDateString("pt-BR") : "—"}
                  {" · "}{nfe.items.length} itens
                  {" · "}<span className="font-mono">{nfe.fileName}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {["SKU", "Produto", "Qtd", "Custo unit.", "Total"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nfe.items.map((item, i) => (
                      <tr key={item.sku + i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-primary font-semibold whitespace-nowrap">{item.sku}</td>
                        <td className="px-4 py-2 max-w-xs"><span className="line-clamp-1" title={item.name}>{item.name}</span></td>
                        <td className="px-4 py-2 font-medium text-center">{item.qty}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {item.unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground whitespace-nowrap">
                          {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Tabela — CSV */}
          {fileMode === "csv" && parsedCSVs.map((csv) => (
            <div key={csv.fileName} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm truncate max-w-xs">{csv.fileName}</span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{csv.items.length} itens</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {["SKU", "Produto", "Qtd", "Custo", "Preço", "Marca", "Volume", "Ativo"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.items.map((item, i) => (
                      <tr key={item.sku + i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-primary font-semibold whitespace-nowrap">{item.sku}</td>
                        <td className="px-4 py-2 max-w-xs"><span className="line-clamp-1" title={item.name}>{item.name}</span></td>
                        <td className="px-4 py-2 font-medium text-center">{item.qty}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {item.unitCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-muted-foreground">
                          {item.price !== undefined
                            ? item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{item.brand ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{item.weight_volume ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {item.active === undefined ? "—" : item.active
                            ? <span className="text-green-600 font-medium">sim</span>
                            : <span className="text-muted-foreground">não</span>}
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
              <Button disabled className="gap-2">Importando...</Button>
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
        <div className={[
          "rounded-lg border p-4 flex items-start gap-3",
          importResult.errors.length > 0
            ? "border-destructive/40 bg-destructive/5"
            : "border-green-500/30 bg-green-50/30 dark:bg-green-950/20",
        ].join(" ")}>
          {importResult.errors.length === 0
            ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />}
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
            <div key={i} className={
              entry.type === "success" ? "text-green-400"
              : entry.type === "error" ? "text-red-400"
              : "text-zinc-400"
            }>
              {entry.type === "success" ? "✓ " : entry.type === "error" ? "✗ " : "  "}
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
