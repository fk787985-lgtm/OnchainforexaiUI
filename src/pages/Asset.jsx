import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/axios'
import AddFundsModal from '../components/AddFundsModal'
import WithdrawalModal from '../components/WithdrawalModal'
import TransferModal from '../components/TransferModal'

export default function Asset() {
  const navigate = useNavigate()
  const location = useLocation()
  const [cryptoAssets, setCryptoAssets] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [balanceVisible, setBalanceVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('crypto')
  const [selectedCurrency, setSelectedCurrency] = useState('USDT')
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedCoinForDeposit, setSelectedCoinForDeposit] = useState(null)

  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) {
          setUserBalance(response.data.user.balance || 0)
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }
    
    fetchUserBalance()
    fetchCryptoAssets()
    
    const interval = setInterval(() => {
      fetchCryptoAssets()
      fetchUserBalance()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchCryptoAssets = async () => {
    try {
      const response = await api.get('/api/coins')
      if (response.data.success) {
        const coins = response.data.coins
        const sortedData = coins.map((coin, index) => ({
          id: coin._id,
          name: coin.name,
          symbol: coin.symbol,
          price: coin.price || 0,
          change24h: coin.change24h || 0,
          high24h: coin.high24h || 0,
          low24h: coin.low24h || 0,
          volume: coin.volume || 0,
          marketCap: coin.marketCap || 0,
          image: coin.image ? (coin.image.startsWith('http') ? coin.image : `${import.meta.env.VITE_API_URL || 'https://api.onchainforexai.com'}${coin.image}`) : null,
          rank: coin.rank || index + 1
        }))
        setCryptoAssets(sortedData)
      } else {
        setCryptoAssets([])
      }
    } catch (error) {
      console.error('Error fetching crypto assets:', error)
      setCryptoAssets([])
    } finally {
      setInitialLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return '0.00'
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  const formatChange = (change) => {
    if (!change && change !== 0) return '0.00%'
    const value = parseFloat(change)
    if (isNaN(value)) return '0.00%'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const getUserHoldings = () => {
    return cryptoAssets
      .slice(0, 20)
      .map(asset => ({
        ...asset,
        balance: Math.random() * 1000,
        avgPrice: asset.price * (0.95 + Math.random() * 0.1),
        todayPNL: (Math.random() - 0.5) * 100
      }))
  }

  const userHoldings = getUserHoldings()
  const totalValueUSDT = userBalance
  const totalValueBTC = userBalance / 50000
  const todayPNL = userHoldings.reduce((sum, coin) => sum + (coin.todayPNL || 0), 0)

  const filteredAssets = userHoldings.filter(asset =>
    asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMasked = (value) => {
    if (balanceVisible) {
      return typeof value === 'number' ? value.toFixed(2) : value
    }
    return '******'
  }

  const handleAssetClick = (asset) => {
    navigate(`/trade/crypto/${encodeURIComponent(asset.symbol)}`, {
      state: { item: asset, type: 'crypto' }
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          {/* Est. Total Value Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Est. Total Value</span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {balanceVisible ? (
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Total Value Display */}
            <div className="mb-1">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedCurrency === 'USDT' 
                  ? `${formatMasked(totalValueUSDT)}` 
                  : `${formatMasked(totalValueBTC)}`} <span className="text-lg font-normal">{selectedCurrency}</span>
                <button onClick={() => setSelectedCurrency(selectedCurrency === 'USDT' ? 'BTC' : 'USDT')} className="ml-1">
                  <svg className="w-4 h-4 inline text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCurrency === 'USDT' 
                  ? `≈ ${formatMasked(totalValueBTC)} BTC` 
                  : `≈ ${formatMasked(totalValueUSDT)} USDT`}
              </div>
            </div>

            {/* Today's PNL */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's PNL</span>
                <span className={`text-sm font-semibold ${todayPNL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatMasked(todayPNL)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition"
              >
                Add Funds
              </button>
              <button 
                onClick={() => setShowWithdrawalModal(true)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-lg text-sm transition"
              >
                Send
              </button>
              <button 
                onClick={() => setShowTransferModal(true)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-lg text-sm transition"
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('crypto')}
                className={`pb-2 px-1 text-sm font-medium transition ${
                  activeTab === 'crypto'
                    ? 'text-yellow-500 border-b-2 border-yellow-500'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Crypto
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`pb-2 px-1 text-sm font-medium transition ${
                  activeTab === 'account'
                    ? 'text-yellow-500 border-b-2 border-yellow-500'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Account
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Assets List */}
      <main className="px-4 py-4">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : activeTab === 'crypto' ? (
          <div className="space-y-0">
            {filteredAssets.map((asset) => (
              <div
                key={asset.symbol}
                className="border-b border-gray-100 dark:border-gray-800 py-4"
              >
                <div className="flex items-start justify-between mb-3">
                  {/* Left: Icon and Name */}
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img
                        src={asset.image || `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`}
                        alt={asset.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = e.target.nextElementSibling
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div className={`absolute inset-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        asset.symbol === 'USDT' ? 'bg-green-500' :
                        asset.symbol === 'BNB' ? 'bg-yellow-500' :
                        asset.symbol === 'BONK' ? 'bg-orange-500' :
                        asset.symbol === 'TRX' ? 'bg-red-500' :
                        asset.symbol === 'BTC' ? 'bg-orange-500' :
                        asset.symbol === 'ETH' ? 'bg-blue-500' :
                        asset.symbol === 'SOL' ? 'bg-purple-500' :
                        'bg-gray-400'
                      }`} style={{ display: 'none' }}>
                        <span className="text-sm">{asset.symbol?.charAt(0) || '?'}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white text-base">{asset.symbol}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</div>
                      {asset.symbol !== 'USDT' && (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Today's PNL: <span className={`font-semibold ${asset.todayPNL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatMasked(asset.todayPNL)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Average Price: <span className="font-semibold text-gray-900 dark:text-white">{formatMasked(asset.avgPrice)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right: Balance and Actions */}
                  <div className="text-right ml-4">
                    <div className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      {formatMasked(asset.balance)}
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded transition">
                        Earn
                      </button>
                      <button 
                        onClick={() => handleAssetClick(asset)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded transition"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAssets.length === 0 && !initialLoading && (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">No assets found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-500 dark:text-gray-400">Account tab coming soon</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { name: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', route: '/dashboard' },
            { name: 'Market', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', route: '/market' },
            { name: 'Trade', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', route: '/trade' },
            { name: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', route: '/history' },
            { name: 'Asset', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/asset' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => item.route && navigate(item.route)}
              className={`flex flex-col items-center space-y-1 px-2 py-1.5 rounded-lg transition flex-1 ${
                location.pathname === item.route
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        selectedCoin={selectedCoinForDeposit}
        onSuccess={() => {
          const fetchUserBalance = async () => {
            try {
              const response = await api.get('/api/auth/me')
              if (response.data.success) {
                setUserBalance(response.data.user.balance || 0)
              }
            } catch (error) {
              console.error('Error fetching user balance:', error)
            }
          }
          fetchUserBalance()
        }}
      />

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={() => {
          const fetchUserBalance = async () => {
            try {
              const response = await api.get('/api/auth/me')
              if (response.data.success) {
                setUserBalance(response.data.user.balance || 0)
              }
            } catch (error) {
              console.error('Error fetching user balance:', error)
            }
          }
          fetchUserBalance()
        }}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          const fetchUserBalance = async () => {
            try {
              const response = await api.get('/api/auth/me')
              if (response.data.success) {
                setUserBalance(response.data.user.balance || 0)
              }
            } catch (error) {
              console.error('Error fetching user balance:', error)
            }
          }
          fetchUserBalance()
        }}
      />
    </div>
  )
}
