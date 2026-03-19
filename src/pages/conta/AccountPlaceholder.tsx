export default function AccountPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="font-display text-xl text-foreground mb-4">{title}</h2>
      <div className="bg-card border rounded-xl p-12 text-center">
        <p className="font-body text-sm text-muted-foreground">Em breve disponível.</p>
      </div>
    </div>
  );
}
