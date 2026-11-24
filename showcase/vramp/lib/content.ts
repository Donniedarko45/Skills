// All copy and sample data for the VRAMP landing page lives here.
//
// PLACEHOLDERS: client names, case-study results, quotes, statistics and prices below are
// illustrative. Replace them with real ones before launch, then set `draftNotice` to false.

export const site = {
  name: 'VRAMP',
  draftNotice: true,
  email: 'hello@vramp.studio',
  bookingUrl: '#brief',
  tagline: 'Senior product teams, ramped up in 72 hours.',
  description:
    'VRAMP is a global studio of senior designers and engineers. Agencies bring us in under their name; companies bring us in to ship. Either way, the team is building by day three.',
}

export const nav = [
  { label: 'Home', href: '#top' },
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export const heroProof = ['NDA on day one', 'Your Slack, your repo', 'You own the code from the first commit']

// The ramp: one real-feeling engagement plotted from brief to launch.
export const ramp = [
  { day: 'Day 0', label: 'Brief', detail: '30-minute call' },
  { day: 'Day 1', label: 'Fixed quote', detail: 'Scope + price in 24h' },
  { day: 'Day 2', label: 'Team matched', detail: '3 seniors, your timezone' },
  { day: 'Day 3', label: 'First commit', detail: 'main · #1' },
  { day: 'Wk 2', label: 'Demo 1', detail: 'Clickable flows' },
  { day: 'Wk 4', label: 'Beta', detail: '40 pilot users' },
  { day: 'Wk 6', label: 'Launch', detail: 'Handover + 30 days on call' },
] as const

export const team = [
  { initials: 'IM', role: 'Product designer', city: 'Lisbon' },
  { initials: 'KO', role: 'Full-stack lead', city: 'Kraków' },
  { initials: 'RA', role: 'Mobile engineer', city: 'Bengaluru' },
]

export const clients = ['Northwind', 'Halcyon', 'Kite Labs', 'Quarry', 'Larkspur Health', 'Atlas Freight', 'Fernhill', 'Brightwater']

export const doors = {
  agencies: {
    eyebrow: 'For agencies',
    title: 'Your brand.',
    titleMuted: 'Our build.',
    body: 'Say yes to the projects you would otherwise turn down. We work under your name, in your tools, with your client never knowing we exist.',
    points: [
      'White-label by default: your PM tool, your client calls, your logo on the deck',
      'Senior capacity for overflow, new capabilities or a whole build',
      'Fixed price per sprint, so your margin is known before you pitch',
    ],
  },
  companies: {
    eyebrow: 'For companies and startups',
    title: 'A product team,',
    titleMuted: 'without the hiring.',
    body: 'A designer, engineers and a lead who have shipped this before, matched to your stack and timezone. Building in days, not after a three-month hiring loop.',
    points: [
      'Work happens in your repo and your Slack, from day one',
      'A demo every Friday; change course at any of them',
      'Hand-over docs and 30 days on call after launch',
    ],
  },
}

export const work = [
  {
    client: 'Ledgerline',
    kind: 'B2B payments dashboard',
    via: 'Built white-label for a London agency',
    duration: '9 weeks',
    team: '4 people',
    stack: ['Next.js', 'Postgres', 'Stripe'],
    results: [
      { value: '−62%', label: 'time to reconcile a month' },
      { value: '1,200', label: 'finance teams in the first quarter' },
    ],
    mock: 'dashboard',
  },
  {
    client: 'Pulse Health',
    kind: 'Patient app, iOS and Android',
    via: 'Built for a Series A health startup',
    duration: '14 weeks',
    team: '5 people',
    stack: ['React Native', 'FHIR', 'AWS'],
    results: [
      { value: '4.8', label: 'App Store rating at launch' },
      { value: '38k', label: 'monthly active patients by month 3' },
    ],
    mock: 'mobile',
  },
  {
    client: 'Relay',
    kind: 'AI support copilot',
    via: 'Built with an in-house team of two',
    duration: '6 weeks',
    team: '3 people',
    stack: ['TypeScript', 'RAG', 'Evals'],
    results: [
      { value: '31%', label: 'of tickets resolved without a human' },
      { value: '2.4×', label: 'faster first response' },
    ],
    mock: 'ai',
  },
] as const

export const services = [
  { icon: 'design', title: 'Product and UX design', body: 'Discovery, flows, prototypes and design systems engineers can build.' },
  { icon: 'apps', title: 'Web and mobile apps', body: 'Dashboards, portals, SaaS and store-ready iOS and Android apps.' },
  { icon: 'ai', title: 'AI features', body: 'Assistants, search and automation grounded in your data, with evals.' },
  { icon: 'platform', title: 'Backend, APIs and platform', body: 'Data models, integrations, CI/CD and observability, so launch day is boring.' },
] as const

export const stack = ['Figma', 'Next.js', 'React Native', 'TypeScript', 'Postgres', 'Python', 'AWS', 'Terraform']

export const process = [
  { n: '01', when: 'Day 0', title: 'Brief', body: 'Send us the problem, not a spec. After a 30-minute call you get scope, team and a fixed price within 24 hours.' },
  { n: '02', when: 'Day 2', title: 'Match', body: 'We assemble a senior team for your stack and timezone. You meet them before anything is signed.' },
  { n: '03', when: 'Every Friday', title: 'Build', body: 'Work happens in your repo and your tools. A live demo every Friday, and you can change course at each one.' },
  { n: '04', when: 'Launch', title: 'Ship and hand over', body: 'We launch with you, document everything and stay on call for 30 days. The code is yours from the first commit.' },
]

export const network = {
  stats: [
    { value: '1 in 30', label: 'applicants make it into the network' },
    { value: '9 yrs', label: 'average experience per member' },
    { value: '38', label: 'countries, so someone is always awake' },
    { value: '72h', label: 'from first call to first commit' },
  ],
  clocks: [
    { city: 'San Francisco', tz: 'America/Los_Angeles' },
    { city: 'São Paulo', tz: 'America/Sao_Paulo' },
    { city: 'Lisbon', tz: 'Europe/Lisbon' },
    { city: 'Kraków', tz: 'Europe/Warsaw' },
    { city: 'Bengaluru', tz: 'Asia/Kolkata' },
    { city: 'Singapore', tz: 'Asia/Singapore' },
  ],
}

export const pricing = [
  {
    name: 'Sprint',
    price: '$9.5k',
    unit: 'per 2-week sprint',
    body: 'A fixed scope at a fixed price: a prototype, an audit, a feature or a rescue.',
    points: ['Product designer + engineer', 'Scope agreed before we start', 'Demo at the end of week one'],
    cta: 'Start with a sprint',
  },
  {
    name: 'Build',
    price: '$38k',
    unit: 'per product, from',
    body: 'An MVP or a v1, priced by milestone, usually 6 to 12 weeks.',
    points: ['Full pod: design, engineering, lead', 'Milestone pricing, no hourly surprises', 'Launch support and 30 days on call'],
    cta: 'Plan a build',
    featured: true,
  },
  {
    name: 'Embedded',
    price: '$16k',
    unit: 'per month, from',
    body: 'A dedicated pod inside your team, month to month.',
    points: ['Scale up or down each month', 'Works in your sprint cadence', 'Cancel with 30 days notice'],
    cta: 'Add a pod',
  },
]

export const quotes = [
  {
    quote: 'We pitched a mobile app we could not have built in-house. VRAMP built it under our name, on time, and our client still thinks they are our team.',
    name: 'Agency founder',
    initials: 'AF',
    org: 'Independent studio, London',
  },
  {
    quote: 'Three days after the first call we had a working repo and a Friday demo on the calendar. Six weeks later we were live.',
    name: 'CTO',
    initials: 'CT',
    org: 'Series A health startup',
  },
]

export const faqs = [
  { q: 'Can you work completely white-label?', a: 'Yes, and it is the default for agency work. We sign your NDA, use your email domain and tools if you want, and never contact your client directly unless you ask us to.' },
  { q: 'Who owns the code and designs?', a: 'You do, from the first commit. Everything lives in your repositories and your design files, and the contract assigns all IP to you on payment.' },
  { q: 'How do you keep quality high with freelancers?', a: 'Everyone in the network is senior and vetted: portfolio review, a paid trial project and references. Every team has a lead who reviews all work, and if anyone is the wrong fit we replace them within a week at our cost.' },
  { q: 'What if we are in a different timezone?', a: 'We match at least four hours of overlap with your working day, and the Friday demo is always at a time that suits you.' },
  { q: 'How do you price?', a: 'Fixed price per sprint or per milestone, agreed before work starts. No hourly billing, no surprise invoices. Agencies get partner rates.' },
  { q: 'What do you need to get started?', a: 'A 30-minute call about the problem, your users and your deadline. A spec is welcome but not needed; scoping is part of what we do.' },
]

export const budgets = ['Under $20k', '$20k to $50k', '$50k to $150k', '$150k+', 'Not sure yet']
