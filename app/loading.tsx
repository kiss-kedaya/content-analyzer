export default function Loading() {
  return (
    <div
      className="min-h-[calc(100dvh-4rem)] space-y-7 md:space-y-9"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">正在加载内容…</span>

      <section className="space-y-3 py-1 md:py-2" aria-hidden="true">
        <div className="h-8 w-32 rounded-lg bg-surface-raised motion-safe:animate-pulse" />
        <div className="h-5 w-48 rounded-md bg-surface-raised motion-safe:animate-pulse" />
      </section>

      <section className="space-y-5" aria-hidden="true">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="surface-card h-20 rounded-xl motion-safe:animate-pulse" />
          ))}
        </div>

        <div className="surface-card h-28 rounded-xl motion-safe:animate-pulse" />

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="surface-card h-[28rem] rounded-xl motion-safe:animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  )
}
