export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      {/* Titre wuxia serif */}
      <h1 className="font-serif text-4xl font-bold text-primary">
        WWM Ultimate Calculator
      </h1>
      <p className="mt-2 text-muted-foreground">
        Calculateur de dégâts pour Where Winds Meet
      </p>

      {/* Test des accents */}
      <div className="mt-8 flex gap-4">
        <div className="rounded-md bg-surface-secondary p-4 card-glow border border-border">
          <span className="font-mono text-2xl text-wuxia-gold">21,289</span>
          <p className="text-sm text-muted-foreground">DPS estimé</p>
        </div>
        <div className="rounded-md bg-surface-secondary p-4 border border-border">
          <span className="font-mono text-2xl text-wuxia-jade">+3.8%</span>
          <p className="text-sm text-muted-foreground">Gain marginal</p>
        </div>
        <div className="rounded-md bg-surface-secondary p-4 border border-border">
          <span className="font-mono text-2xl text-wuxia-crimson">-1.2%</span>
          <p className="text-sm text-muted-foreground">Perte DPS</p>
        </div>
      </div>

      {/* Séparateur doré */}
      <div className="gold-separator my-8" />

      {/* Test typo */}
      <div className="space-y-2">
        <p className="font-serif text-xl text-foreground">Cinzel — Titres wuxia</p>
        <p className="text-foreground">Inter — Corps de texte</p>
        <p className="font-mono text-wuxia-amber">JetBrains Mono — 1,122 ATK | 31.6% CRIT</p>
      </div>
    </main>
  );
}
