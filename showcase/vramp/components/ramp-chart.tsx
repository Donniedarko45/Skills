import { ramp, team } from '@/lib/content'

// Plot coordinates (viewBox 600 x 440). The curve accelerates: slow start, steep finish.
const POINTS: [number, number][] = [
  [36, 388],
  [104, 378],
  [172, 358],
  [240, 326],
  [330, 262],
  [430, 170],
  [548, 54],
]

/** Catmull-Rom spline through the points, as a smooth SVG path. */
function smoothPath(points: [number, number][]) {
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0]} ${p2[1]}`
  }
  return d
}

const line = smoothPath(POINTS)
const area = `${line} L ${POINTS.at(-1)![0]} 404 L ${POINTS[0][0]} 404 Z`

export function RampChart() {
  return (
    <figure className="relative" aria-labelledby="ramp-caption">
      <figcaption id="ramp-caption" className="sr-only">
        A typical engagement: brief on day 0, fixed quote on day 1, team matched on day 2, first commit on day 3,
        first demo in week 2, beta in week 4 and launch in week 6.
      </figcaption>

      <div className="relative overflow-hidden rounded-[28px] border border-night-line bg-night-2/80 p-3 shadow-[0_40px_120px_-40px_oklch(0.15_0.1_265/0.6)]">
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
          <p className="label text-on-night-muted">Engagement · Pulse Health</p>
          <p className="label flex items-center gap-2 text-volt">
            <span className="live-dot size-1.5 rounded-full bg-volt" aria-hidden="true" />
            Week 6 · live
          </p>
        </div>

        <svg viewBox="0 0 600 440" className="block h-auto w-full" aria-hidden="true">
          <defs>
            <linearGradient id="ramp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.985 0.004 95)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="oklch(0.985 0.004 95)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* horizontal guides */}
          {[100, 180, 260, 340].map((y) => (
            <line key={y} x1="20" x2="580" y1={y} y2={y} stroke="oklch(1 0 0 / 0.12)" strokeDasharray="3 6" />
          ))}
          <line x1="20" x2="580" y1="404" y2="404" stroke="oklch(1 0 0 / 0.3)" />

          <path d={area} fill="url(#ramp-fill)" />
          <path d={line} fill="none" stroke="oklch(0.985 0.004 95)" strokeWidth="3" strokeLinecap="round" className="ramp-line" style={{ ['--len' as string]: 900 }} />

          {POINTS.map(([x, y], i) => {
            const step = ramp[i]
            const last = i === POINTS.length - 1
            const above = i % 2 === 0
            const anchorStart = !above || i === 0 // the first label sits to the right so it never clips the left edge
            return (
              <g key={step.label} className="rise" style={{ ['--i' as string]: i + 3 }}>
                <circle cx={x} cy={y} r={last ? 8 : 5} fill={last ? 'oklch(0.985 0.004 95)' : 'var(--night-2)'} stroke="oklch(0.985 0.004 95)" strokeWidth="2" />
                {last && <circle cx={x} cy={y} r="16" fill="none" stroke="oklch(0.985 0.004 95 / 0.4)" strokeWidth="1.5" />}
                <text x={x} y="428" textAnchor="middle" className={`ramp-axis fill-[oklch(0.89_0.045_265)] font-mono tracking-[0.06em] ${[0, 3, 6].includes(i) ? '' : 'max-sm:hidden'}`}>
                  {step.day.toUpperCase()}
                </text>
                {!last && (
                  <text
                    x={x + (anchorStart ? 10 : -8)}
                    y={above ? y - 14 : y + 22}
                    textAnchor={anchorStart ? 'start' : 'end'}
                    className={`ramp-label fill-[oklch(0.97_0.006_95)] font-medium ${[0, 3, 5].includes(i) ? '' : 'max-sm:hidden'}`}
                  >
                    {step.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Overlays: the team, and the launch */}
        <div className="rise absolute top-14 left-5 hidden w-60 rounded-2xl border border-night-line bg-night/90 p-3.5 backdrop-blur sm:block" style={{ ['--i' as string]: 1 }}>
          <p className="label text-on-night-muted">Team · matched in 48h</p>
          <ul className="mt-2.5 space-y-2">
            {team.map((m) => (
              <li key={m.initials} className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-full bg-night-3 text-[11px] font-medium text-on-night">{m.initials}</span>
                <span className="min-w-0 text-[13px] leading-tight">
                  <span className="block text-on-night">{m.role}</span>
                  <span className="block text-on-night-muted">{m.city}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rise absolute top-[30%] right-6 hidden rounded-full bg-volt px-3.5 py-1.5 text-[13px] font-medium text-on-volt shadow-lg sm:block" style={{ ['--i' as string]: 10 }}>
          Launched · handover + 30 days on call
        </div>
      </div>

      {/* Mobile: team below the chart */}
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
        {team.map((m) => (
          <li key={m.initials} className="rounded-xl border border-night-line bg-night-2 p-2.5 text-[12px] leading-tight">
            <span className="block text-on-night">{m.role}</span>
            <span className="block text-on-night-muted">{m.city}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
