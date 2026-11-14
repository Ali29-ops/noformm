"use client";

const REPEAT = 3;

function TickerRow({ phrase }: { phrase: string }) {
  return (
    <div className="ticker-row">
      {Array.from({ length: REPEAT }, (_, i) => (
        <span key={i} className="ticker-item">
          <span className="ticker-phrase" dir="auto">
            {phrase}
          </span>
          <span className="ticker-sep">·</span>
        </span>
      ))}
    </div>
  );
}

export function Ticker({
  phrase,
  src,
  tone = "film",
}: {
  phrase: string;
  src?: string;
  tone?: "film" | "sage";
}) {
  const sage = tone === "sage";
  return (
    <section className={`ticker-band ${sage ? "ticker-sage" : ""}`} aria-label={phrase}>
      {src ? (
        <>
          <video
            className="ticker-film pointer-events-none absolute inset-0 h-full w-full object-cover object-bottom"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          >
            <source src={src} type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 bg-charcoal/55" aria-hidden />
        </>
      ) : null}
      <p className="ticker-static relative z-10" aria-hidden>
        {phrase}
      </p>
      <div className="ticker-viewport relative z-10" dir="ltr" tabIndex={0}>
        <div className="ticker-track" aria-hidden>
          <TickerRow phrase={phrase} />
          <TickerRow phrase={phrase} />
        </div>
      </div>
    </section>
  );
}
