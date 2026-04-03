import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Produto {
  sku: string;
  name: string;
  ean: string;
  cost: number;
  qty: number;
}

interface NFeResult {
  fileName: string;
  nNF: string;
  emitente: string;
  dhEmi: string;
  produtos: Produto[];
}

type Status = "idle" | "parsing" | "ready" | "saving" | "done" | "error";

function parseNFe(xmlText: string, fileName: string): NFeResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const ns = "http://www.portalfiscal.inf.br/nfe";
  const get = (parent: Element | Document, tag: string) =>
    parent.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? "";

  const nNF = get(doc, "nNF");
  const emitente = get(doc, "xNome");
  const dhEmi = get(doc, "dhEmi");

  const detNodes = doc.getElementsByTagNameNS(ns, "det");
  const produtos: Produto[] = Array.from(detNodes).map((det) => {
    const rawSku = get(det, "cProd");
    const sku = rawSku.replace(/^0+/, "") || "0";
    const name = get(det, "xProd");
    const ean = get(det, "cEAN");
    const cost = parseFloat(get(det, "vUnCom") || "0");
    const qty = Math.round(parseFloat(get(det, "qCom") || "0"));
    return { sku, name, ean, cost, qty };
  });

  return { fileName, nNF, emitente, dhEmi, produtos };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminImportNFePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<NFeResult[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setStatus("parsing");
    setLog([]);
    const parsed: NFeResult[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".xml")) continue;
      try {
        const text = await file.text();
        const result = parseNFe(text, file.name);
        parsed.push(result);
        addLog(`✓ ${file.name} — NF ${result.nNF} (${result.produtos.length} itens)`);
      } catch (e) {
        addLog(`✗ Erro ao ler ${file.name}: ${e}`);
      }
    }

    if (parsed.length === 0) {
      setStatus("error");
      addLog("Nenhum XML válido encontrado.");
      return;
    }

    setResults(parsed);
    setStatus("ready");
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const totalProdutos = results.reduce((acc, r) => acc + r.produtos.length, 0);

  const handleSave = async () => {
    setStatus("saving");
    addLog("Iniciando importação no Supabase...");

    const allProdutos = results.flatMap((r) =>
      r.produtos.map((p) => ({
        sku: p.sku,
        name: p.name,
        slug: toSlug(p.name),
        cost: p.cost,
        inventory_count: p.qty,
      }))
    );

    const BATCH = 50;
    let total = 0;
    for (let i = 0; i < allProdutos.length; i += BATCH) {
      const batch = allProdutos.slice(i, i + BATCH);
      const { error } = await supabase.rpc("upsert_products_from_nfe", {
        products: batch,
      });

      if (error) {
        for (const p of batch) {
          const { error: e2 } = await supabase
            .from("products")
            .upsert(p, { onConflict: "sku", ignoreDuplicates: false });
          if (e2) {
            addLog(`✗ Erro no SKU ${p.sku}: ${e2.message}`);
          } else {
            total++;
          }
        }
      } else {
        total += batch.length;
        addLog(`✓ Lote ${Math.floor(i / BATCH) + 1} salvo (${batch.length} produtos)`);
      }
    }

    addLog(`\nImportação concluída: ${total}/${allProdutos.length} produtos processados.`);
    setStatus("done");
  };

  const handleReset = () => {
    setStatus("idle");
    setResults([]);
    setLog([]);
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem", fontFamily: "inherit" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>
          Importar NF-e
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted, #6b7280)", margin: 0 }}>
          Faça upload dos XMLs das notas fiscais para atualizar o estoque automaticamente.
        </p>
      </div>

      {(status === "idle" || status === "error") && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "#6366f1" : "#d1d5db"}`,
            borderRadius: 12,
            padding: "3rem 2rem",
            textAlign: "center",
            background: dragging ? "#f5f3ff" : "transparent",
            transition: "all 0.15s",
            cursor: "pointer",
          }}
          onClick={() => document.getElementById("nfe-input")?.click()}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: 15 }}>
            Arraste os XMLs aqui ou clique para selecionar
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Aceita múltiplos arquivos .xml de NF-e
          </p>
          <input
            id="nfe-input"
            type="file"
            accept=".xml"
            multiple
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {status === "parsing" && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#6366f1", fontWeight: 500 }}>Lendo arquivos...</p>
        </div>
      )}

      {(status === "ready" || status === "done") && (
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: "1.5rem",
          }}>
            {[
              { label: "Notas fiscais", value: results.length },
              { label: "Produtos", value: totalProdutos },
              { label: "Fornecedor", value: results[0]?.emitente?.split(" ")[0] ?? "—" },
            ].map((card) => (
              <div key={card.label} style={{
                background: "var(--card-bg, #f9fafb)",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 10,
                padding: "14px 16px",
              }}>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {results.map((nfe) => (
            <div key={nfe.fileName} style={{
              background: "var(--card-bg, #fff)",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 10,
              marginBottom: "1rem",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                background: "var(--header-bg, #f3f4f6)",
                borderBottom: "1px solid var(--border, #e5e7eb)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>NF {nfe.nNF}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{nfe.emitente}</span>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {new Date(nfe.dhEmi).toLocaleDateString("pt-BR")}
                  {" · "}
                  {nfe.produtos.length} itens
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--th-bg, #f9fafb)" }}>
                      {["SKU", "Produto", "EAN", "Qtd", "Custo unit."].map((h) => (
                        <th key={h} style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          fontWeight: 500,
                          color: "#6b7280",
                          borderBottom: "1px solid var(--border, #e5e7eb)",
                          whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nfe.produtos.map((p, i) => (
                      <tr key={p.sku + i} style={{ borderBottom: "1px solid var(--border, #f3f4f6)" }}>
                        <td style={{ padding: "8px 12px", color: "#6366f1", fontWeight: 500 }}>{p.sku}</td>
                        <td style={{ padding: "8px 12px", maxWidth: 240 }}>{p.name}</td>
                        <td style={{ padding: "8px 12px", color: "#9ca3af", fontFamily: "monospace", fontSize: 12 }}>{p.ean}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 500 }}>{p.qty}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          {p.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, marginTop: "1.5rem", flexWrap: "wrap" }}>
            {status === "ready" && (
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 24px",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Confirmar e importar {totalProdutos} produtos
              </button>
            )}
            <button
              onClick={handleReset}
              style={{
                padding: "10px 20px",
                background: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {status === "done" ? "Nova importação" : "Cancelar"}
            </button>
          </div>
        </div>
      )}

      {status === "saving" && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#6366f1", fontWeight: 500 }}>Salvando no Supabase...</p>
        </div>
      )}

      {log.length > 0 && (
        <div style={{
          marginTop: "1.5rem",
          background: "#1e1e2e",
          borderRadius: 10,
          padding: "1rem 1.25rem",
          fontFamily: "monospace",
          fontSize: 13,
          color: "#cdd6f4",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          maxHeight: 220,
          overflowY: "auto",
        }}>
          {log.map((line, i) => (
            <div key={i} style={{ color: line.startsWith("✗") ? "#f38ba8" : line.startsWith("✓") ? "#a6e3a1" : "#cdd6f4" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
