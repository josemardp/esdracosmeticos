import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { whatsappUrl } from "@/lib/whatsapp";

// Fatos da linha do tempo confirmados pelo Josemar em 24/09/2026.
const milestones = [
  { year: "2016", text: "Fundação como MEI, com vendas online e de porta em porta em Valparaíso/SP." },
  { year: "2018", text: "A marca se firma com foco em cosméticos de qualidade e seleção própria de produtos." },
  { year: "2020", text: "Mais presença nas redes sociais e vendas pelo WhatsApp." },
  { year: "2023", text: "O catálogo ganha linhas de skincare, cabelos e perfumaria." },
  { year: "2026", text: "Lançamento da loja virtual oficial da Esdra Cosméticos." },
];

const values = [
  { title: "Escolhido com carinho", desc: "Cada produto entra no catálogo pensando em quem vai usar." },
  { title: "Marcas que funcionam", desc: "Trabalhamos só com marcas e fórmulas que entregam o que prometem." },
  { title: "Quem entende de beleza", desc: "A seleção é feita por quem usa, testa e gosta de cosméticos." },
];

export default function SobrePage() {
  useSEO("Sobre Nós", "Conheça a Esdra Cosméticos: desde 2016 escolhendo produtos de beleza em Valparaíso/SP.");
  return (
    <div className="font-body">
      <section className="bg-rose">
        <div className="shell py-12 lg:py-20">
          <div className="max-w-[720px]">
            <h1 className="rise-in font-display text-[40px] leading-[1.05] text-foreground display-lg text-balance lg:text-[60px]">
              Beleza escolhida a dedo, em Valparaíso, desde 2016
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-foreground">
              A Esdra Cosméticos nasceu do amor pelos cosméticos e da vontade de levar produtos de qualidade para mais mulheres.
              Começou vendendo online e de porta em porta. Hoje reúne perfumes, maquiagem, cabelos e skincare de marcas originais.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/loja" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
                Ver a loja
              </Link>
              <a
                href={whatsappUrl("Olá, quero conhecer os produtos da Esdra Cosméticos.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]"
              >
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> Conversar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="O que nos guia" className="shell grid gap-8 py-12 sm:grid-cols-3 lg:py-16">
        {values.map((v) => (
          <div key={v.title} className="border-t border-foreground/15 pt-5">
            <h2 className="font-display text-[22px] leading-tight text-foreground display-md">{v.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-secondary py-12 lg:py-16">
        <div className="shell">
          <h2 className="font-display text-[30px] leading-tight text-foreground display-md lg:text-[40px]">Nossa trajetória</h2>
          <ol className="mt-8 max-w-[760px]">
            {milestones.map((ms) => (
              <li key={ms.year} className="grid grid-cols-[72px_1fr] gap-4 border-t border-foreground/15 py-5 lg:grid-cols-[120px_1fr] lg:gap-8">
                <span className="font-display text-[28px] leading-none text-primary display-md tabular-nums lg:text-[34px]">{ms.year}</span>
                <p className="text-base leading-relaxed text-foreground">{ms.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-12 lg:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-[26px] leading-tight text-foreground display-md">Esdra Cosméticos</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              CNPJ 26.744.223/0001-57, Valparaíso/SP<br />
              Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal
            </p>
          </div>
          <Link to="/suporte" className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))] lg:shrink-0">
            Fale com a gente
          </Link>
        </div>
      </section>
    </div>
  );
}
