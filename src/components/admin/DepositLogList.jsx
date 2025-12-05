import { useState, useEffect } from 'react'
import api from '../../utils/axios'

export default function DepositLogList() {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeposit, setSelectedDeposit] = useState(null)

  useEffect(() => {
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/api/admin/deposits')
      if (response.data.success) {
        setDeposits(response.data.deposits)
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateFakeAddress = () => {
    return `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  }

  const generateFakeTxId = () => {
    return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {deposits.map((deposit) => (
                <tr 
                  key={deposit._id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedDeposit(deposit)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{deposit.userId?.fullName || deposit.userId?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{deposit.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">+{deposit.amount} USDT</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                      {deposit.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{deposit.description || 'Deposit'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(deposit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Click for details</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deposit Details</h3>
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</div>
                <div className="font-semibold text-gray-900 dark:text-white">{selectedDeposit.userId?.fullName || selectedDeposit.userId?.email}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedDeposit.userId?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                <div className="font-semibold text-green-600 dark:text-green-400 text-lg">+{selectedDeposit.amount} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</div>
                <div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
                    {selectedDeposit.type}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.description || 'Deposit'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deposit Address (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeDepositAddress || generateFakeAddress()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID (Fake)</div>
                <div className="font-mono text-xs break-all bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white">
                  {selectedDeposit.fakeTransactionId || generateFakeTxId()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Before</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceBefore?.toFixed(2) || '0.00'} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance After</div>
                <div className="text-sm text-gray-900 dark:text-white">{selectedDeposit.balanceAfter?.toFixed(2) || '0.00'} USDT</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</div>
                <div className="text-sm text-gray-900 dark:text-white">{new Date(selectedDeposit.createdAt).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

