import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoEsdra from "@/assets/logo-esdra-wordmark.webp";

// Moldura das telas de login, cadastro e senha: logo da loja no topo (volta ao início),
// formulário sem cartão sobre o rosa pó.
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary font-body">
      <header className="border-b bg-background">
        <div className="shell flex h-16 items-center justify-between lg:h-20">
          <Link to="/" aria-label="Esdra Cosméticos, ir para o início">
            <img src={logoEsdra} alt="Esdra Cosméticos" width={240} height={135} className="h-11 w-auto lg:h-12" />
          </Link>
          <Link to="/loja" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar à loja
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px]">
          <h1 className="font-display text-[34px] leading-tight text-foreground display-md lg:text-[40px]">{title}</h1>
          {subtitle && <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-foreground/15 pt-6 text-[15px] text-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export const authField = "h-12 rounded-full border-foreground/20 bg-background px-4 text-base";
export const authLabel = "mb-1.5 block text-[15px] font-medium text-foreground";
export const authButton = "inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60";
export const authLink = "font-medium text-primary underline-offset-4 hover:underline";

// O Supabase devolve os erros de login em inglês; aqui viram frases que a cliente entende.
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.";
  if (m.includes("password should be") || m.includes("weak password")) return "Escolha uma senha mais forte, com pelo menos 6 caracteres.";
  if (m.includes("same password") || m.includes("different from the old")) return "A nova senha precisa ser diferente da anterior.";
  if (m.includes("rate limit") || m.includes("security purposes") || m.includes("too many")) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Confira se o e-mail está certo.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com a internet. Confira e tente de novo.";
  return "Não deu certo agora. Tente de novo ou fale com a gente pelo WhatsApp.";
}
