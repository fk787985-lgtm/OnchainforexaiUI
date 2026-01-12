import { useState, useEffect } from 'react'
import api from '../../utils/axios'
import { getImageUrl } from '../../utils/imageUrl.js'

export default function CoinsList() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCoin, setEditingCoin] = useState(null)
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    price: '',
    change24h: '',
    high24h: '',
    low24h: '',
    volume: '',
    marketCap: '',
    rank: '',
    isActive: true,
    address: '',
    minDeposit: '',
    maxDeposit: '',
    conversionRate: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchCoins()
  }, [])

  const fetchCoins = async () => {
    try {
      const response = await api.get('/api/coins/admin/all')
      if (response.data.success) {
        setCoins(response.data.coins)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCoin(null)
    setFormData({
      symbol: '',
      name: '',
      price: '',
      change24h: '',
      high24h: '',
      low24h: '',
      volume: '',
      marketCap: '',
      rank: '',
      isActive: true,
      address: '',
      minDeposit: '',
      maxDeposit: '',
      conversionRate: ''
    })
    setImageFile(null)
    setImagePreview(null)
    setShowCreateModal(true)
  }

  const handleEdit = (coin) => {
    setEditingCoin(coin)
    setFormData({
      symbol: coin.symbol,
      name: coin.name,
      price: coin.price,
      change24h: coin.change24h,
      high24h: coin.high24h,
      low24h: coin.low24h,
      volume: coin.volume,
      marketCap: coin.marketCap,
      rank: coin.rank,
      isActive: coin.isActive,
      address: coin.address || '',
      minDeposit: coin.minDeposit || '',
      maxDeposit: coin.maxDeposit || '',
      conversionRate: coin.conversionRate || ''
    })
    setImageFile(null)
    setImagePreview(coin.image ? getImageUrl(coin.image) : null)
    setShowCreateModal(true)
  }

  const handleDelete = async (coinId) => {
    if (!window.confirm('Are you sure you want to delete this coin?')) return

    try {
      const response = await api.delete(`/api/coins/admin/${coinId}`)
      if (response.data.success) {
        await fetchCoins()
      }
    } catch (error) {
      console.error('Error deleting coin:', error)
      alert('Error deleting coin: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      let response
      if (editingCoin) {
        response = await api.put(`/api/coins/admin/${editingCoin._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        response = await api.post('/api/coins/admin/create', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      if (response.data.success) {
        setShowCreateModal(false)
        await fetchCoins()
        setFormData({
          symbol: '',
          name: '',
          price: '',
          change24h: '',
          high24h: '',
          low24h: '',
          volume: '',
          marketCap: '',
          rank: '',
          isActive: true,
          address: '',
          minDeposit: '',
          maxDeposit: '',
          conversionRate: ''
        })
        setImageFile(null)
        setImagePreview(null)
      }
    } catch (error) {
      console.error('Error saving coin:', error)
      alert('Error saving coin: ' + (error.response?.data?.message || error.message))
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading coins...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">Manage Coins</h2>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            + Create Coin
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Image</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Symbol</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">24h Change</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rank</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {coins.length > 0 ? (
                coins.map((coin) => (
                  <tr key={coin._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {coin.image ? (
                        <img
                          src={getImageUrl(coin.image)}
                          alt={coin.symbol}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-bold">{coin.symbol.charAt(0)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold">{coin.symbol}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{coin.name}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">${coin.price.toFixed(2)}</td>
                    <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold ${
                      coin.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{coin.rank}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        coin.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {coin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(coin)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coin._id)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No coins found. Click "Create Coin" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">
                {editingCoin ? 'Edit Coin' : 'Create New Coin'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Symbol *</label>
                  <input
                    type="text"
                    required
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="BTC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Bitcoin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-20 h-20 rounded-full object-cover"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">24h Change (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.change24h}
                    onChange={(e) => setFormData({ ...formData, change24h: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">24h High</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.high24h}
                    onChange={(e) => setFormData({ ...formData, high24h: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">24h Low</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.low24h}
                    onChange={(e) => setFormData({ ...formData, low24h: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Volume</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Market Cap</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.marketCap}
                    onChange={(e) => setFormData({ ...formData, marketCap: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rank</label>
                  <input
                    type="number"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>

              {/* Deposit Settings Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h4 className="text-lg font-semibold mb-4">Deposit Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Wallet Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Enter wallet address for deposits"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Users will send funds to this address
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Deposit (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minDeposit}
                        onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Max Deposit (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.maxDeposit}
                        onChange={(e) => setFormData({ ...formData, maxDeposit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="100000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Conversion Rate</label>
                      <input
                        type="number"
                        step="0.00000001"
                        min="0"
                        value={formData.conversionRate}
                        onChange={(e) => setFormData({ ...formData, conversionRate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="1 coin = X USDT"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        1 {formData.symbol || 'COIN'} = X USDT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                >
                  {editingCoin ? 'Update Coin' : 'Create Coin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCoin(null)
                    setFormData({
                      symbol: '',
                      name: '',
                      price: '',
                      change24h: '',
                      high24h: '',
                      low24h: '',
                      volume: '',
                      marketCap: '',
                      rank: '',
                      isActive: true,
                      address: '',
                      minDeposit: '',
                      maxDeposit: '',
                      conversionRate: ''
                    })
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}



