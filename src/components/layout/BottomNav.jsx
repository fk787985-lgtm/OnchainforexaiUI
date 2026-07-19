import { useNavigate, useLocation } from 'react-router-dom'

const ITEMS = [
  {
    name: 'Home',
    route: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    name: 'Markets',
    route: '/market',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    name: 'Trade',
    route: '/trade',
    match: (path) => path === '/trade' || path.startsWith('/trade/'),
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
  },
  {
    name: 'Orders',
    route: '/history',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    name: 'Assets',
    route: '/asset',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--fx-color-border)] bg-[var(--fx-color-surface)]/96 backdrop-blur-xl safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-stretch justify-around px-1 py-1">
        {ITEMS.map((item) => {
          const active = item.match
            ? item.match(location.pathname)
            : location.pathname === item.route
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] rounded-lg transition ${
                active
                  ? 'text-[var(--fx-color-primary)]'
                  : 'text-[var(--fx-color-text-muted)] hover:text-[var(--fx-color-text)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.75} d={item.icon} />
              </svg>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
