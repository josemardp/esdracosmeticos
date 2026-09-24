import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <section className="bg-secondary font-body">
      <div className="shell flex min-h-[60vh] flex-col items-start justify-center py-16 lg:py-24">
        <p className="font-display text-[88px] leading-none text-primary display-lg lg:text-[120px]">404</p>
        <h1 className="mt-4 font-display text-[32px] leading-tight text-foreground display-md lg:text-[40px]">Página não encontrada</h1>
        <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
          O endereço pode ter mudado ou o produto saiu do catálogo. Veja o que temos hoje na loja.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/loja" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep">
            Ver a loja
          </Link>
          <Link to="/" className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
