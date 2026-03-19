import { motion } from "framer-motion";
import { Heart, Award, Sparkles, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const milestones = [
  { year: "2016", text: "Fundação como MEI — início das vendas online e porta a porta em Valparaíso/SP." },
  { year: "2018", text: "Consolidação da marca com foco em cosméticos de qualidade premium e curadoria exclusiva." },
  { year: "2020", text: "Expansão digital — presença forte nas redes sociais e venda por WhatsApp." },
  { year: "2023", text: "Ampliação do catálogo com linhas de skincare, cabelos e perfumaria." },
  { year: "2026", text: "Lançamento da loja virtual oficial Esdra Cosméticos — sua experiência completa de beleza." },
];

export default function SobrePage() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <motion.div className="text-center max-w-3xl mx-auto mb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-body text-xs tracking-[0.3em] uppercase text-primary mb-3 block">Nossa História</span>
          <h1 className="font-display text-3xl lg:text-5xl italic text-foreground mb-4">
            A essência do cuidado, traduzida em <span className="text-primary">sofisticação</span>
          </h1>
          <p className="font-body text-sm lg:text-base text-muted-foreground leading-relaxed">
            A Esdra Cosméticos nasceu do amor pelos cosméticos e do desejo de levar produtos de qualidade premium para todas as mulheres. Desde 2016, selecionamos com carinho cada produto do nosso catálogo.
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {[
            { icon: Heart, title: "Cuidado Genuíno", desc: "Cada produto é escolhido com carinho, pensando na sua experiência e bem-estar." },
            { icon: Award, title: "Qualidade Premium", desc: "Trabalhamos apenas com marcas e formulações que entregam resultados reais." },
            { icon: Sparkles, title: "Curadoria Exclusiva", desc: "Nossa seleção é feita por quem entende e ama cosméticos de verdade." },
          ].map((v, i) => (
            <motion.div key={v.title} className="bg-card border rounded-xl p-6 lg:p-8 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <motion.div className="max-w-2xl mx-auto mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="font-display text-2xl lg:text-3xl italic text-foreground text-center mb-10">Nossa Trajetória</h2>
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-px" />
            {milestones.map((m, i) => (
              <motion.div key={m.year} className="relative flex items-start gap-6 mb-8 lg:mb-10" initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="relative z-10 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 font-body text-[10px] font-bold lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                  {m.year.slice(2)}
                </div>
                <div className="flex-1 lg:w-[calc(50%-2rem)] lg:ml-auto lg:pl-10 bg-card border rounded-xl p-4">
                  <span className="font-body text-xs text-primary font-semibold">{m.year}</span>
                  <p className="font-body text-sm text-foreground mt-1 leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div className="bg-secondary rounded-xl p-8 lg:p-12 text-center max-w-2xl mx-auto" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <MapPin className="w-6 h-6 text-primary mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">Esdra Cosméticos</h3>
          <p className="font-body text-sm text-muted-foreground mb-1">CNPJ: 26.744.223/0001-57</p>
          <p className="font-body text-sm text-muted-foreground mb-1">Valparaíso/SP — Desde 2016</p>
          <p className="font-body text-xs text-muted-foreground mb-6">Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/loja"><Button>Explorar Produtos</Button></Link>
            <Link to="/suporte"><Button variant="outline">Fale Conosco</Button></Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
