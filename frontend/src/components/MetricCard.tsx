type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "leaf" | "coral" | "gold" | "ink";
};

const toneClasses = {
  leaf: "border-leaf/20 bg-mint/60 text-leaf",
  coral: "border-coral/20 bg-coral/10 text-coral",
  gold: "border-gold/30 bg-gold/15 text-amber-700",
  ink: "border-ink/10 bg-white text-ink",
};

export function MetricCard({ label, value, tone = "ink" }: MetricCardProps) {
  return (
    <div className={`rounded border p-4 shadow-soft ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
