import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/axios'
import { getImageUrl } from '../utils/imageUrl.js'
import BankingCardForm from '../components/buy/BankingCardForm'
import PaymentOtpPage, { PurchaseConfirmedCard } from '../components/buy/PaymentOtpPage'
import { initiateCardBuy, submitBuyOtp, resendBuyOtp } from '../api/modules/buyApi'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SkeletonBlock from '../components/common/SkeletonBlock'
import CoinLogo from '../components/common/CoinLogo'

const emptyBilling = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States'
}

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000]

export default function BuyCrypto() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 coin, 2 payment method, 3 card, 4 otp, 5 success
  const [coins, setCoins] = useState([])
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [selectedCoin, setSelectedCoin] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpPending, setOtpPending] = useState(null)
  const [otpError, setOtpError] = useState('')
  const [completedTx, setCompletedTx] = useState(null)

  const [card, setCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expMonth: '',
    expYear: '',
    cvv: ''
  })
  const [billing, setBilling] = useState(emptyBilling)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
      return
    }

    const boot = async () => {
      try {
        const me = await api.get('/api/auth/me')
        if (me.data.success) {
          const name = me.data.user.fullName || ''
          setUserName(name)
          setCard((c) => ({ ...c, cardholderName: c.cardholderName || name.toUpperCase() }))
        }
      } catch {
        navigate('/signin')
        return
      }

      try {
        const response = await api.get('/api/coins')
        if (response.data.success) {
          const list = (response.data.coins || [])
            .filter((c) => c.isActive !== false)
            .map((coin, index) => ({
              id: coin._id,
              name: coin.name,
              symbol: coin.symbol,
              price: coin.price || 0,
              change24h: coin.change24h || 0,
              image: coin.image ? getImageUrl(coin.image) : null,
              rank: coin.rank || index + 1
            }))
          setCoins(list)
        }
      } catch (error) {
        console.error(error)
        toast.error('Failed to load cryptocurrencies')
      } finally {
        setLoadingCoins(false)
      }
    }

    boot()
  }, [navigate])

  const finalAmount = customAmount ? Number(customAmount) : amount

  const filteredCoins = useMemo(() => {
    let list = [...coins]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.symbol?.toLowerCase().includes(q)
      )
    }
    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortBy === 'price') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0))
    } else {
      list.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    }
    return list
  }, [coins, search, sortBy])

  const estimatedCrypto =
    selectedCoin?.price > 0 && finalAmount > 0 ? finalAmount / selectedCoin.price : 0

  const formatPrice = (price) => {
    if (!price || price === 0) return '—'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const submitCard = async (e) => {
    e.preventDefault()
    if (!selectedCoin) {
      toast.error('Select a cryptocurrency')
      return
    }
    if (!finalAmount || finalAmount < 1) {
      toast.error('Enter an amount of at least $1')
      return
    }

    const cardNumber = (card.cardNumber || '').replace(/\s/g, '')
    const expMonth = String(card.expMonth || '').replace(/\D/g, '').padStart(2, '0').slice(0, 2)
    const expYear = String(card.expYear || '').replace(/\D/g, '').slice(-2)
    const cvv = String(card.cvv || '').replace(/\D/g, '')

    if (cardNumber.length < 13) {
      toast.error('Enter a valid card number')
      return
    }
    if (!expMonth || !expYear || expMonth === '00') {
      toast.error('Enter card expiry as MM/YY')
      return
    }
    if (cvv.length < 3) {
      toast.error('Enter the CVV security code')
      return
    }
    if (!billing.line1?.trim() || !billing.city?.trim() || !billing.postalCode?.trim() || !billing.country?.trim()) {
      toast.error('Complete billing address')
      return
    }

    setLoading(true)
    try {
      const data = await initiateCardBuy({
        coinId: selectedCoin.id,
        fiatAmount: finalAmount,
        currency: 'USD',
        paymentMethod,
        cardNumber,
        cardholderName: card.cardholderName,
        expMonth,
        expYear,
        cvv,
        billingAddress: billing
      })

      if (data.success && data.pending) {
        setOtpPending({ ...data.pending })
        setOtpError('')
        setStep(4)
        toast.success(data.message || 'Enter the verification code sent to your phone')
      } else {
        toast.error(data.message || 'Failed to initiate purchase')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment initiation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (code) => {
    setLoading(true)
    setOtpError('')
    try {
      const data = await submitBuyOtp({
        buyId: otpPending.id,
        otp: code
      })
      if (data.success) {
        if (data.transaction?.completed || data.transaction?.status === 'completed') {
          setCompletedTx(data.transaction)
          setStep(5)
          return true
        }
        return true
      }
      setOtpError(data.message || 'Incorrect code')
      return false
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Verification failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      const id = otpPending?.id || otpPending?._id
      const data = await resendBuyOtp({ buyId: id, transactionId: otpPending?.transactionId })
      if (data.success) {
        setOtpPending((p) => ({
          ...p,
          otpSentTo: data.otpSentTo || p.otpSentTo,
          status: 'awaiting_otp',
          otpExpiresInSec: data.otpExpiresInSec || p.otpExpiresInSec
        }))
        setOtpError('')
        toast.success(data.message || 'Code resent')
        return { ...data }
      }
      toast.error(data.message || 'Resend failed')
      return null
    } catch (error) {
      toast.error(error.response?.data?.message || 'Resend failed')
      return null
    }
  }

  return (
    <div className="fx-page min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700 backdrop-blur">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 5) navigate('/asset')
              else if (step > 1 && step < 4) setStep(step - 1)
              else if (step === 1) navigate('/asset')
              else navigate('/asset')
            }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <PageHeader title="Buy Cryptocurrency" description="Purchase crypto with your debit or credit card." />
        </div>
        {step < 5 && (
          <div className="px-4 pb-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${
                    step >= s ? 'bg-gradient-to-r from-cyan-500 to-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {step === 1 && 'Select cryptocurrency'}
              {step === 2 && 'Payment method & amount'}
              {step === 3 && 'Card details'}
              {step === 4 && 'Verification'}
            </p>
          </div>
        )}
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="search"
                placeholder="Search coins…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fx-input flex-1"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="fx-input sm:w-40"
              >
                <option value="rank">Sort: Rank</option>
                <option value="name">Sort: Name</option>
                <option value="price">Sort: Price</option>
              </select>
            </div>

            {loadingCoins ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-16 w-full rounded-xl" />
                <SkeletonBlock className="h-16 w-full rounded-xl" />
                <SkeletonBlock className="h-16 w-full rounded-xl" />
              </div>
            ) : filteredCoins.length === 0 ? (
              <div className="fx-card text-center py-10 text-slate-500">No cryptocurrencies found</div>
            ) : (
              <div className="space-y-2">
                {filteredCoins.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => {
                      setSelectedCoin(coin)
                      setStep(2)
                    }}
                    className={`w-full fx-card flex items-center gap-3 text-left hover:ring-2 hover:ring-cyan-400/50 transition ${
                      selectedCoin?.id === coin.id ? 'ring-2 ring-cyan-500' : ''
                    }`}
                  >
                    <CoinLogo symbol={coin.symbol} image={coin.image} name={coin.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{coin.name}</p>
                      <p className="text-xs text-slate-500">{coin.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 dark:text-white">{formatPrice(coin.price)}</p>
                      {coin.change24h != null && (
                        <p className={`text-xs ${coin.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {coin.change24h >= 0 ? '+' : ''}
                          {Number(coin.change24h).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedCoin && (
          <div className="space-y-5">
            <div className="fx-card flex items-center gap-3">
              <CoinLogo symbol={selectedCoin.symbol} image={selectedCoin.image} name={selectedCoin.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedCoin.name} ({selectedCoin.symbol})
                </p>
                <p className="text-sm text-slate-500">{formatPrice(selectedCoin.price)}</p>
              </div>
              <button
                type="button"
                className="ml-auto text-sm text-cyan-600"
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            <div className="fx-card space-y-3">
              <p className="font-semibold text-slate-900 dark:text-white">Amount (USD)</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a)
                      setCustomAmount('')
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      !customAmount && amount === a
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="fx-input"
              />
              <p className="text-sm text-slate-500">
                You receive ≈{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {estimatedCrypto > 0 ? estimatedCrypto.toFixed(8) : '0'} {selectedCoin.symbol}
                </span>
              </p>
            </div>

            <div className="fx-card space-y-3">
              <p className="font-semibold text-slate-900 dark:text-white">Payment method</p>
              {[
                { id: 'credit_card', label: 'Credit Card' },
                { id: 'debit_card', label: 'Debit Card' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                    paymentMethod === m.id
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === m.id ? 'border-cyan-500 bg-cyan-500' : 'border-slate-400'}`} />
                  <span className="font-medium text-slate-900 dark:text-white">{m.label}</span>
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                if (!finalAmount || finalAmount < 1) {
                  toast.error('Enter an amount of at least $1')
                  return
                }
                setStep(3)
              }}
            >
              Continue to card details
            </Button>
          </div>
        )}

        {step === 3 && selectedCoin && (
          <div className="space-y-4">
            <div className="fx-card text-sm">
              <p className="text-slate-500">Buying</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                ≈ {estimatedCrypto.toFixed(8)} {selectedCoin.symbol} for ${Number(finalAmount).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1 capitalize">{paymentMethod.replace('_', ' ')}</p>
            </div>
            <BankingCardForm
              card={card}
              setCard={setCard}
              billing={billing}
              setBilling={setBilling}
              onSubmit={submitCard}
              loading={loading}
              amount={finalAmount}
              submitLabel={`Buy $${Number(finalAmount || 0).toLocaleString()} of ${selectedCoin.symbol}`}
            />
          </div>
        )}

        {step === 4 && otpPending && (
          <PaymentOtpPage
            pending={otpPending}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onCancel={() => navigate('/asset')}
            onRejectedBackToEntry={() => setOtpError('Incorrect code. Please try again.')}
            onPaymentCompleted={(tx) => {
              setCompletedTx(tx)
              setStep(5)
            }}
            loading={loading}
            error={otpError}
            statusPath="/api/buy/status"
          />
        )}

        {step === 5 && (
          <PurchaseConfirmedCard
            transaction={
              completedTx || {
                coinName: selectedCoin?.name,
                coinSymbol: selectedCoin?.symbol,
                coinAmount: estimatedCrypto,
                fiatAmount: finalAmount,
                currency: 'USD',
                transactionId: otpPending?.transactionId,
                confirmedAt: new Date().toISOString(),
                status: 'completed'
              }
            }
            onDone={() => navigate('/asset')}
          />
        )}
      </main>
    </div>
  )
}
