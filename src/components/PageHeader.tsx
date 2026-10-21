interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sage-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-ink-soft">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
