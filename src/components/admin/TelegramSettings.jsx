import { useEffect, useState } from 'react'
import api from '../../utils/axios'
import toast from 'react-hot-toast'
import PageHeader from '../ui/PageHeader'
import SkeletonBlock from '../common/SkeletonBlock'

export default function TelegramSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [bot, setBot] = useState(null)
  const [showToken, setShowToken] = useState(false)
  const [form, setForm] = useState({
    botToken: '',
    botTokenMasked: '',
    hasToken: false,
    chatId: '',
    enabled: true,
    notifyBuy: true,
    notifyKyc: true,
    notifyStatus: true,
    notifyRegistrations: true,
    notifyDeposits: true,
    notifyWithdrawals: true,
    notifySupport: true,
    notifySubAdminActions: true,
    botUsername: '',
    botStatus: 'unknown',
    lastConnectionCheck: null,
    lastNotificationSent: null,
    tokenUpdatedAt: null
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/admin/telegram')
      if (data.success) {
        setConfigured(Boolean(data.configured))
        setBot(data.bot)
        setForm((f) => ({
          ...f,
          botToken: '',
          botTokenMasked: data.settings?.botTokenMasked || '',
          hasToken: Boolean(data.settings?.hasToken),
          chatId: data.settings?.chatId || '',
          enabled: data.settings?.enabled !== false,
          notifyBuy: data.settings?.notifyBuy !== false,
          notifyKyc: data.settings?.notifyKyc !== false,
          notifyStatus: data.settings?.notifyStatus !== false,
          notifyRegistrations: data.settings?.notifyRegistrations !== false,
          notifyDeposits: data.settings?.notifyDeposits !== false,
          notifyWithdrawals: data.settings?.notifyWithdrawals !== false,
          notifySupport: data.settings?.notifySupport !== false,
          notifySubAdminActions: data.settings?.notifySubAdminActions !== false,
          botUsername: data.settings?.botUsername || data.bot?.username || '',
          botStatus: data.settings?.botStatus || 'unknown',
          lastConnectionCheck: data.settings?.lastConnectionCheck,
          lastNotificationSent: data.settings?.lastNotificationSent,
          tokenUpdatedAt: data.settings?.tokenUpdatedAt
        }))
      }
    } catch {
      toast.error('Failed to load Telegram settings')
    } finally {
      setLoading(false)
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        chatId: form.chatId,
        enabled: form.enabled,
        notifyBuy: form.notifyBuy,
        notifyKyc: form.notifyKyc,
        notifyStatus: form.notifyStatus,
        notifyRegistrations: form.notifyRegistrations,
        notifyDeposits: form.notifyDeposits,
        notifyWithdrawals: form.notifyWithdrawals,
        notifySupport: form.notifySupport,
        notifySubAdminActions: form.notifySubAdminActions
      }
      if (form.botToken && form.botToken.trim() && !form.botToken.includes('•')) {
        payload.botToken = form.botToken.trim()
      }
      let data
      try {
        ;({ data } = await api.put('/api/admin/telegram', payload))
      } catch (putErr) {
        if (putErr.response?.status === 404 || putErr.response?.status === 405) {
          ;({ data } = await api.post('/api/admin/telegram', payload))
        } else throw putErr
      }
      if (data.success) {
        toast.success('Telegram settings saved')
        setForm((f) => ({
          ...f,
          botToken: '',
          ...data.settings,
          botTokenMasked: data.settings?.botTokenMasked || f.botTokenMasked
        }))
        load()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    try {
      const body = { chatId: form.chatId }
      if (form.botToken && !form.botToken.includes('•')) body.botToken = form.botToken
      const { data } = await api.post('/api/admin/telegram/test', body)
      if (data.success) {
        toast.success(data.message || 'Test OK')
        if (data.bot) setBot(data.bot)
        load()
      } else toast.error(data.message || 'Failed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Test failed')
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
      <PageHeader
        title="Telegram Notifications"
        description="Main admin bot token, chat ID, and alert categories. Token is encrypted at rest."
      />

      <div
        className={`rounded-xl border p-4 text-sm ${
          configured || form.hasToken
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
        }`}
      >
        {form.hasToken || configured ? (
          <p>
            Bot configured
            {form.botUsername || bot?.username ? (
              <>
                {' '}
                as <strong>@{form.botUsername || bot.username}</strong>
              </>
            ) : null}
            . Status: <strong>{form.botStatus || 'unknown'}</strong>
          </p>
        ) : (
          <p>Paste a bot token from @BotFather and set your Chat ID, then Test connection.</p>
        )}
        {form.lastConnectionCheck && (
          <p className="text-xs mt-1 opacity-80">
            Last check: {new Date(form.lastConnectionCheck).toLocaleString()}
          </p>
        )}
        {form.lastNotificationSent && (
          <p className="text-xs opacity-80">
            Last notification: {new Date(form.lastNotificationSent).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={save} className="fx-card space-y-4">
        <div>
          <label className="fx-label">TELEGRAM_BOT_TOKEN</label>
          <div className="flex gap-2">
            <input
              className="fx-input flex-1 font-mono text-sm"
              type={showToken ? 'text' : 'password'}
              value={form.botToken}
              onChange={(e) => setForm({ ...form, botToken: e.target.value })}
              placeholder={
                form.hasToken
                  ? form.botTokenMasked || '•••• token saved (enter new to replace)'
                  : '123456:ABC-DEF...'
              }
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stored encrypted. Leave blank to keep the current token. Token changes are audit-logged.
          </p>
          {form.tokenUpdatedAt && (
            <p className="text-xs text-slate-400">
              Token last updated: {new Date(form.tokenUpdatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div>
          <label className="fx-label">Telegram Chat ID</label>
          <input
            className="fx-input"
            value={form.chatId}
            onChange={(e) => setForm({ ...form, chatId: e.target.value })}
            placeholder="e.g. -1001234567890"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Enable main Telegram notifications
        </label>

        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { key: 'notifyRegistrations', label: 'Registrations / assignments' },
            { key: 'notifyKyc', label: 'KYC events' },
            { key: 'notifyDeposits', label: 'Deposits' },
            { key: 'notifyWithdrawals', label: 'Withdrawals' },
            { key: 'notifyBuy', label: 'Crypto purchases' },
            { key: 'notifySupport', label: 'Support messages' },
            { key: 'notifyStatus', label: 'Status / balance updates' },
            { key: 'notifySubAdminActions', label: 'Critical sub-admin actions' }
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form[item.key])}
                onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button
            type="button"
            onClick={sendTest}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
          >
            Test bot connection
          </button>
        </div>
      </form>
    </div>
  )
}
