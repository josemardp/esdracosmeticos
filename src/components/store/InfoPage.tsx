import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

// Moldura das páginas de texto (privacidade, trocas, termos): coluna de leitura estreita,
// título em Bodoni e, no fim, o caminho para falar com a loja.
export function InfoPage({ title, updated, lead, whatsappMessage, children }: {
  title: string;
  updated?: string;
  lead?: ReactNode;
  whatsappMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="shell pb-16 pt-8 font-body lg:pb-24 lg:pt-14">
      <article className="mx-auto max-w-[680px]">
        <h1 className="font-display text-[34px] leading-tight text-foreground display-md text-balance lg:text-[48px]">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted-foreground">Última atualização: {updated}</p>}
        {lead && <div className="mt-6 rounded-2xl bg-secondary px-5 py-4 text-base leading-relaxed text-foreground">{lead}</div>}
        <div className="info-prose mt-8">{children}</div>
        <div className="mt-12 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-foreground">Ficou com alguma dúvida?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Falar no WhatsApp
            </a>
            <Link
              to="/suporte"
              className="inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]"
            >
              Ver perguntas frequentes
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
