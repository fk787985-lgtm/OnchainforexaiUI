import { useNavigate } from 'react-router-dom'
import { useSiteSettings } from '../../../context/SiteSettingsContext'
import { getImageUrl } from '../../../utils/imageUrl.js'
import ThemeToggle from '../../../components/ThemeToggle'
import KycProgress from './KycProgress'
import { kycBtnGhost, kycBtnPrimary, kycBtnSecondary, kycPageDesc, kycPageTitle } from '../styles/kycUi'

export default function KycShell({
  step,
  title,
  description,
  children,
  onBack,
  onContinue,
  onSaveExit,
  continueLabel = 'Continue',
  continueDisabled = false,
  loading = false,
  showNav = true,
  hideProgress = false,
  footerExtra = null
}) {
  const navigate = useNavigate()
  const { settings: siteSettings } = useSiteSettings()
  const siteName = siteSettings?.site?.name || 'Onchainforexai'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* Sticky header — Background Search inspired, light/dark refined */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 min-w-0"
            >
              {siteSettings?.site?.logo ? (
                <img
                  src={getImageUrl(siteSettings.site.logo)}
                  alt=""
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                  {siteName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-semibold truncate hidden xs:inline">{siteName}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onSaveExit ? (
              <button type="button" onClick={onSaveExit} className={kycBtnGhost}>
                Save & exit
              </button>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
        {!hideProgress && step < 11 ? (
          <div className="max-w-lg mx-auto px-4 sm:px-5 pb-3">
            <KycProgress step={step} />
          </div>
        ) : null}
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-5 py-5 sm:py-7 pb-32">
        {(title || description) && (
          <div className="mb-5 animate-[fadeIn_0.35s_ease-out]">
            {title ? <h1 className={kycPageTitle}>{title}</h1> : null}
            {description ? <p className={kycPageDesc}>{description}</p> : null}
          </div>
        )}

        <div className="animate-[fadeIn_0.4s_ease-out]">{children}</div>
      </main>

      {showNav && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl safe-area-bottom">
          <div className="max-w-lg mx-auto px-4 sm:px-5 py-3 sm:py-4 space-y-2">
            {footerExtra}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:items-center sm:justify-between">
              {onBack ? (
                <button type="button" onClick={onBack} className={kycBtnSecondary} disabled={loading}>
                  Previous
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {onContinue ? (
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={continueDisabled || loading}
                  className={kycBtnPrimary}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    continueLabel
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
