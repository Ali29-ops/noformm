type LogoProps = {
  variant?: "primary" | "secondary" | "mark";
  inverted?: boolean;
  className?: string;
};

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <rect x="3" y="5" width="8" height="38" />
      <polygon points="11,5 22,30 22,38 11,13" />
      <rect x="22" y="5" width="8" height="38" />
      <rect x="30" y="5" width="15" height="7" />
      <rect x="30" y="20" width="11" height="6" />
    </svg>
  );
}

export function Logo({
  variant = "primary",
  inverted = false,
  className = "",
}: LogoProps) {
  const color = inverted ? "text-ivory" : "text-charcoal";

  if (variant === "mark") {
    return <Mark className={`${color} ${className} h-7 w-7`} />;
  }

  if (variant === "secondary") {
    return (
      <div className={`flex items-center gap-3 ${color} ${className}`}>
        <Mark className="h-8 w-8 shrink-0" />
        <div className="leading-none">
          <div className="font-sans text-lg font-semibold tracking-[0.18em]">
            NO
          </div>
          <div className="font-sans text-lg font-semibold tracking-[0.18em]">
            FORM
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${color} ${className}`}>
      <Mark className="h-8 w-8 shrink-0" />
      <div className="leading-none">
        <div className="font-sans text-sm font-semibold tracking-[0.22em] md:text-base">
          NO FORM
        </div>
        <div className="mt-1 hidden font-sans text-[9px] uppercase tracking-label text-current/70 sm:block">
          Furniture
        </div>
      </div>
    </div>
  );
}
