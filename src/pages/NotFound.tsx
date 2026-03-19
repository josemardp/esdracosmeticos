import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl lg:text-8xl text-primary mb-4">404</h1>
        <h2 className="font-display text-xl lg:text-2xl text-foreground mb-2">Página não encontrada</h2>
        <p className="font-body text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
          A página que você está buscando não existe ou foi movida.
        </p>
        <Link to="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
