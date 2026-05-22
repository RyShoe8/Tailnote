type OrbSpec = {
  /** Diameter in CSS px. */
  size: number;
  /** Tailwind utility for absolute positioning. */
  position: string;
  /** Background fill (gradient or color). */
  background: string;
  /** Blur radius in CSS px. */
  blur?: number;
  /** Tailwind animation class. */
  animationClass?: string;
  /** Optional delay class. */
  delayClass?: string;
  /** Optional inline opacity 0-1. */
  opacity?: number;
};

type Props = {
  orbs?: OrbSpec[];
  /** When true, renders inside the parent's relative bounds (no extra wrapper). */
  inline?: boolean;
};

const DEFAULT_ORBS: OrbSpec[] = [
  {
    size: 320,
    position: 'left-[-6rem] top-[-4rem]',
    background:
      'radial-gradient(circle at 30% 30%, rgba(12,143,163,0.32), rgba(12,143,163,0) 70%)',
    blur: 12,
    animationClass: 'tn-float-slow',
    opacity: 0.85,
  },
  {
    size: 260,
    position: 'right-[-4rem] top-[6rem]',
    background:
      'radial-gradient(circle at 70% 30%, rgba(79,214,178,0.34), rgba(79,214,178,0) 70%)',
    blur: 16,
    animationClass: 'tn-drift',
    delayClass: 'tn-float-delay-1',
    opacity: 0.9,
  },
  {
    size: 200,
    position: 'left-[35%] bottom-[-3rem]',
    background:
      'radial-gradient(circle at 50% 50%, rgba(0,101,201,0.22), rgba(0,101,201,0) 70%)',
    blur: 18,
    animationClass: 'tn-float',
    delayClass: 'tn-float-delay-2',
    opacity: 0.7,
  },
];

/**
 * Decorative absolutely-positioned blurred gradient orbs. CLS-safe: each orb
 * has fixed inline width/height and sits behind content (`-z-10`,
 * `pointer-events-none`, `aria-hidden`). Animations are transform-only and
 * gated by prefers-reduced-motion in globals.css.
 */
export function FloatingOrbs({ orbs = DEFAULT_ORBS, inline = false }: Props) {
  const content = (
    <>
      {orbs.map((orb, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute -z-10 rounded-full ${orb.position} ${orb.animationClass ?? ''} ${orb.delayClass ?? ''}`}
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.background,
            filter: orb.blur ? `blur(${orb.blur}px)` : undefined,
            opacity: orb.opacity,
          }}
        />
      ))}
    </>
  );

  if (inline) return content;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {content}
    </div>
  );
}
