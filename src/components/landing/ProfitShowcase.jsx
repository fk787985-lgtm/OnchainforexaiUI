import { Link } from 'react-router-dom'

/** Mid-page exchange sections — Crypto.com / Binance style */
const PRODUCTS = [
  {
    title: 'Spot trading',
    desc: 'Buy and sell major coins with live order books, deep liquidity, and instant portfolio updates.',
    tag: 'Popular',
    icon: '⚡'
  },
  {
    title: 'Multi-asset markets',
    desc: 'Crypto, forex, and CFD exposure in one account — switch markets without leaving the app.',
    tag: 'Markets',
    icon: '📊'
  },
  {
    title: 'Buy crypto',
    desc: 'Fund with card or transfer, convert to USDT, and start trading in minutes.',
    tag: 'Easy',
    icon: '💳'
  },
  {
    title: 'Earn & hold',
    desc: 'Track balances, transfers, and history with a clean wallet view built for serious traders.',
    tag: 'Wallet',
    icon: '💎'
  },
  {
    title: 'Pro charts',
    desc: 'TradingView-powered charts for BTC, equities, and FX pairs — same tools pros use.',
    tag: 'Tools',
    icon: '📈'
  },
  {
    title: 'Secure withdrawals',
    desc: 'Protected payout flows, verification steps, and status tracking on every transfer.',
    tag: 'Safety',
    icon: '🔒'
  }
]

const STEPS = [
  { n: '01', t: 'Create your account', d: 'Sign up with email or Google in under a minute.' },
  { n: '02', t: 'Verify & fund', d: 'Complete KYC when required, then deposit crypto or fiat rails.' },
  { n: '03', t: 'Trade the markets', d: 'Execute spot and multi-asset strategies with live pricing.' },
  { n: '04', t: 'Track profits', d: 'Monitor PnL, history, and balances from one dashboard.' }
]

const PROFIT_CARDS = [
  {
    title: 'BTC breakout',
    pnl: '+$24,580',
    pct: '+18.4%',
    pair: 'BTC / USDT',
    img: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'ETH swing',
    pnl: '+$9,240',
    pct: '+11.2%',
    pair: 'ETH / USDT',
    img: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Portfolio run',
    pnl: '+$41,900',
    pct: '+32.7%',
    pair: 'Multi-asset',
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'SOL momentum',
    pnl: '+$6,120',
    pct: '+22.1%',
    pair: 'SOL / USDT',
    img: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80'
  }
]

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=900&q=80',
    label: 'Global liquidity'
  },
  {
    src: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=80',
    label: 'Bitcoin culture'
  },
  {
    src: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=900&q=80',
    label: 'On-chain future'
  },
  {
    src: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=900&q=80',
    label: 'Digital assets'
  },
  {
    src: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
    label: 'Trading desks'
  },
  {
    src: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80',
    label: 'Mobile first'
  }
]

export default function ProfitShowcase() {
  return (
    <>
      {/* Products — like Crypto.com product grid */}
      <section id="products" className="py-16 sm:py-24 px-4 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(17,153,250,0.08),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2da8ff] mb-3">
                Products
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Everything you need to trade crypto
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                From first buy to advanced multi-market strategies — one account, one balance, one
                seamless exchange experience.
              </p>
            </div>
            <Link to="/signup" className="fx-btn fx-btn-primary shrink-0 self-start lg:self-auto">
              Start trading free
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PRODUCTS.map((p) => (
              <article
                key={p.title}
                className="group relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 hover:border-[#1199fa]/45 hover:shadow-[0_20px_50px_rgba(17,153,250,0.12)] transition duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1199fa]/15 text-[#7dd3fc] border border-[#1199fa]/25">
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#7dd3fc] transition">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                <Link
                  to="/signup"
                  className="mt-4 inline-flex text-sm font-semibold text-[#2da8ff] hover:text-cyan-300"
                >
                  Explore →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 px-4 border-y border-slate-800/80 bg-[#080e18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2da8ff] mb-3">
              Get started
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trade in four simple steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6"
              >
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#1199fa] to-slate-700">
                  {s.n}
                </span>
                <h3 className="mt-3 font-bold text-white">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.d}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[#1199fa]/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profit / performance */}
      <section id="profits" className="relative py-16 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=2000&q=70"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff] mb-3">
              Performance
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built to help you capture market moves
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Illustrative trader dashboards — real tools for charts, PnL, and multi-pair tracking.
              Past performance is not a guarantee of future results.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {PROFIT_CARDS.map((c) => (
              <article
                key={c.title}
                className="group rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 shadow-xl hover:border-[#1199fa]/40 transition"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={c.img}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white">
                    {c.pct}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-400">{c.pair}</p>
                  <h3 className="font-bold text-white mt-0.5">{c.title}</h3>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-2">{c.pnl}</p>
                  <div className="mt-3 flex items-end gap-0.5 h-10">
                    {[35, 42, 38, 55, 50, 68, 62, 80, 74, 92].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-emerald-700 to-emerald-400 opacity-90"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 grid lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-white/10 relative min-h-[300px]">
              <img
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80"
                alt="Trading chart"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
              <div className="relative p-6 sm:p-8 max-w-md h-full flex flex-col justify-end">
                <p className="text-xs font-bold text-[#2da8ff] uppercase tracking-wider">
                  Pro trading view
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                  Charts, order flow & multi-market access
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Track breakouts and manage risk with institutional-style layouts — crypto, stocks,
                  and FX side by side.
                </p>
                <div className="mt-5 flex gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400">Sample day PnL</p>
                    <p className="text-xl font-extrabold text-emerald-400">+$3,842</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Active pairs</p>
                    <p className="text-xl font-extrabold text-white">350+</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top movers</p>
              <h3 className="text-xl font-extrabold text-white mt-2">Market heat</h3>
              <ul className="mt-5 space-y-3">
                {[
                  { s: 'BTC', n: 'Bitcoin', p: '+5.2%', up: true },
                  { s: 'ETH', n: 'Ethereum', p: '+3.8%', up: true },
                  { s: 'SOL', n: 'Solana', p: '+9.1%', up: true },
                  { s: 'XRP', n: 'Ripple', p: '-1.4%', up: false }
                ].map((r) => (
                  <li
                    key={r.s}
                    className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5"
                  >
                    <div>
                      <span className="font-bold text-white">{r.s}</span>
                      <span className="text-xs text-slate-500 ml-2">{r.n}</span>
                    </div>
                    <span
                      className={`font-extrabold text-sm ${
                        r.up ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {r.p}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/market"
                className="mt-5 fx-btn fx-btn-secondary fx-btn-block !bg-white/5 !text-white !border-white/15"
              >
                Open live markets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-14 sm:py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2da8ff]">
                Experience
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                Crypto culture meets pro trading
              </h2>
            </div>
            <Link to="/signup" className="text-sm font-semibold text-[#2da8ff] hover:underline">
              Join the exchange →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {GALLERY.map((g) => (
              <div
                key={g.src}
                className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[150px] sm:min-h-[200px] group"
              >
                <img
                  src={g.src}
                  alt={g.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <p className="absolute bottom-3 left-3 text-xs sm:text-sm font-bold text-white">
                  {g.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us strip */}
      <section className="relative py-16 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=2000&q=70"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0b1426]/90" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why traders choose us
          </h2>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Fast UI, clear portfolio PnL, multi-market access, and mobile-first design — the standard
            set by leading global exchanges.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: '<100ms', l: 'UI responsiveness' },
              { v: '350+', l: 'Markets & pairs' },
              { v: '24/7', l: 'Crypto markets' },
              { v: 'KYC', l: 'Verified accounts' }
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur px-3 py-5"
              >
                <p className="text-xl sm:text-2xl font-extrabold text-white">{s.v}</p>
                <p className="text-xs text-slate-300 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
