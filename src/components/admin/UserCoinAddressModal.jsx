import { useEffect, useMemo, useState } from 'react'
import api from '../../utils/axios'

const emptyOverride = {
  address: '',
  minDeposit: '',
  maxDeposit: '',
  conversionRate: '',
  minWithdraw: '',
  maxWithdraw: ''
}

export default function UserCoinAddressModal({ isOpen, user, onClose }) {
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen || !user?._id) return
    loadData()
  }, [isOpen, user?._id])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/admin/users/${user._id}/coin-settings`)
      if (response.data.success) {
        const mapped = (response.data.coinSettings || []).map((item) => ({
          ...item,
          editValues: item.overrideSettings
            ? {
                address: item.overrideSettings.address || '',
                minDeposit: item.overrideSettings.minDeposit ?? '',
                maxDeposit: item.overrideSettings.maxDeposit ?? '',
                conversionRate: item.overrideSettings.conversionRate ?? '',
                minWithdraw: item.overrideSettings.minWithdraw ?? '',
                maxWithdraw: item.overrideSettings.maxWithdraw ?? ''
              }
            : { ...emptyOverride }
        }))
        setRows(mapped)
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load user coin settings')
    } finally {
      setLoading(false)
    }
  }

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((row) => row.symbol.toLowerCase().includes(q) || row.name.toLowerCase().includes(q))
  }, [rows, search])

  const updateField = (coinId, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        String(row.coinId) === String(coinId)
          ? {
              ...row,
              editValues: { ...row.editValues, [field]: value }
            }
          : row
      )
    )
  }

  const saveOverride = async (row) => {
    setSavingId(String(row.coinId))
    try {
      const payload = {}
      Object.entries(row.editValues || {}).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return
        payload[key] = key === 'address' ? value : Number(value)
      })

      if (Object.keys(payload).length === 0) {
        alert('Please set at least one field to save override.')
        return
      }

      const response = await api.put(`/api/admin/users/${user._id}/coin-settings/${row.coinId}`, payload)
      if (response.data.success) {
        await loadData()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save coin override')
    } finally {
      setSavingId(null)
    }
  }

  const resetOverride = async (row) => {
    if (!window.confirm(`Reset ${row.symbol} to global coin settings?`)) return
    setSavingId(String(row.coinId))
    try {
      const response = await api.delete(`/api/admin/users/${user._id}/coin-settings/${row.coinId}`)
      if (response.data.success) {
        await loadData()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset override')
    } finally {
      setSavingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
      <div className="mx-auto max-w-6xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Coin Address</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              User: {user?.fullName || user?.email} ({user?.email})
            </p>
          </div>
          <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            Close
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coin by name or symbol"
              className="w-full sm:max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading coin settings...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left px-3 py-2">Coin</th>
                    <th className="text-left px-3 py-2">Address Override</th>
                    <th className="text-left px-3 py-2">Min Deposit</th>
                    <th className="text-left px-3 py-2">Max Deposit</th>
                    <th className="text-left px-3 py-2">Rate</th>
                    <th className="text-left px-3 py-2">Min Withdraw</th>
                    <th className="text-left px-3 py-2">Max Withdraw</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const busy = savingId === String(row.coinId)
                    return (
                      <tr key={String(row.coinId)} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2">
                          <div className="font-semibold">{row.symbol}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.hasOverride ? 'Custom override active' : 'Using global settings'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={row.editValues.address}
                            onChange={(e) => updateField(row.coinId, 'address', e.target.value)}
                            placeholder={row.globalSettings.address || 'Global address is empty'}
                            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={row.editValues.minDeposit}
                            onChange={(e) => updateField(row.coinId, 'minDeposit', e.target.value)}
                            placeholder={String(row.globalSettings.minDeposit ?? '')}
                            className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={row.editValues.maxDeposit}
                            onChange={(e) => updateField(row.coinId, 'maxDeposit', e.target.value)}
                            placeholder={String(row.globalSettings.maxDeposit ?? '')}
                            className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.00000001"
                            value={row.editValues.conversionRate}
                            onChange={(e) => updateField(row.coinId, 'conversionRate', e.target.value)}
                            placeholder={String(row.globalSettings.conversionRate ?? '')}
                            className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={row.editValues.minWithdraw}
                            onChange={(e) => updateField(row.coinId, 'minWithdraw', e.target.value)}
                            placeholder={String(row.globalSettings.minWithdraw ?? '')}
                            className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={row.editValues.maxWithdraw}
                            onChange={(e) => updateField(row.coinId, 'maxWithdraw', e.target.value)}
                            placeholder={String(row.globalSettings.maxWithdraw ?? '')}
                            className="w-28 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={() => saveOverride(row)}
                              className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-50"
                            >
                              {busy ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => resetOverride(row)}
                              className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700"
                            >
                              Use Global
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

