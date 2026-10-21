export function LoadingState({ label = "لحظة واحدة بنجهّز يومك…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6" role="status">
      <span
        className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-sage-200 border-t-sage-500 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-ink-soft">{label}</p>
    </div>
  );
}
