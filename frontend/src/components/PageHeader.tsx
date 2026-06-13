type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-leaf">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-7 text-ink/65">{description}</p>
    </div>
  );
}
