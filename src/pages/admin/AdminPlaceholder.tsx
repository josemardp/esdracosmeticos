export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">{title}</h1>
      <div className="bg-card border rounded-xl p-12 text-center">
        <p className="font-body text-sm text-muted-foreground">
          Módulo em construção. Em breve disponível.
        </p>
      </div>
    </div>
  );
}
