import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/axios'
import ToggleSwitch from './ToggleSwitch'

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const isSubAdmin = currentUser?.role === 'subadmin'
  const [showLogsUser, setShowLogsUser] = useState(null)
  const [userLogs, setUserLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [addBalance, setAddBalance] = useState(true)
  const [logToDeposit, setLogToDeposit] = useState(false)
  const [logToWithdrawal, setLogToWithdrawal] = useState(false)
  const [notifyUserEmail, setNotifyUserEmail] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [appNotice, setAppNotice] = useState('')
  const [winTradeSettings, setWinTradeSettings] = useState({
    timer30s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
    timer60s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
    timer180s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
    timer300s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
    timer600s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } }
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [])

  // When userDetails changes, automatically load winTradeSettings if they exist
  useEffect(() => {
    if (userDetails && userDetails.winTradeSettings) {
      console.log('🔄 Frontend: userDetails changed, reloading winTradeSettings from userDetails')
      const defaultSettings = {
        timer30s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
        timer60s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
        timer180s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
        timer300s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
        timer600s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } }
      }
      
      const mergedSettings = {}
      Object.keys(defaultSettings).forEach(timerKey => {
        const serverTimer = userDetails.winTradeSettings[timerKey]
        mergedSettings[timerKey] = {
          buyWin: {
            enabled: typeof serverTimer?.buyWin?.enabled === 'boolean' ? serverTimer.buyWin.enabled : defaultSettings[timerKey].buyWin.enabled,
            winPercent: typeof serverTimer?.buyWin?.winPercent === 'number' ? serverTimer.buyWin.winPercent : defaultSettings[timerKey].buyWin.winPercent,
            lossPercent: typeof serverTimer?.buyWin?.lossPercent === 'number' ? serverTimer.buyWin.lossPercent : defaultSettings[timerKey].buyWin.lossPercent
          },
          sellWin: {
            enabled: typeof serverTimer?.sellWin?.enabled === 'boolean' ? serverTimer.sellWin.enabled : defaultSettings[timerKey].sellWin.enabled,
            winPercent: typeof serverTimer?.sellWin?.winPercent === 'number' ? serverTimer.sellWin.winPercent : defaultSettings[timerKey].sellWin.winPercent,
            lossPercent: typeof serverTimer?.sellWin?.lossPercent === 'number' ? serverTimer.sellWin.lossPercent : defaultSettings[timerKey].sellWin.lossPercent
          }
        }
      })
      console.log('🔄 Frontend: Updated winTradeSettings from userDetails:', JSON.stringify(mergedSettings, null, 2))
      setWinTradeSettings(mergedSettings)
    }
  }, [userDetails])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      if (response.data.success) {
        setCurrentUser(response.data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users')
      if (response.data.success) {
        setUsers(response.data.users)
        setFilteredUsers(response.data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = users.filter(user => {
      const searchFields = [
        user.fullName?.toLowerCase() || '',
        user.email?.toLowerCase() || '',
        user.username?.toLowerCase() || '',
        user.uniqueId?.toLowerCase() || '',
        user.payid?.toLowerCase() || '',
        user._id?.toString().toLowerCase() || ''
      ]
      return searchFields.some(field => field.includes(query))
    })
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleEdit = async (user) => {
    setSelectedUser(user._id)
    try {
      const response = await api.get(`/api/admin/users/${user._id}`)
      if (response.data.success) {
        setUserDetails(response.data.user)
        setAppNotice(response.data.user.appNotice || '')
        // The useEffect hook will automatically load winTradeSettings when userDetails changes
        // But we'll also load them here to be safe
        if (response.data.user.winTradeSettings && Object.keys(response.data.user.winTradeSettings).length > 0) {
          const defaultSettings = {
            timer30s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
            timer60s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
            timer180s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
            timer300s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
            timer600s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } }
          }
          const mergedSettings = {}
          Object.keys(defaultSettings).forEach(timerKey => {
            const serverTimer = response.data.user.winTradeSettings[timerKey]
            mergedSettings[timerKey] = {
              buyWin: {
                enabled: typeof serverTimer?.buyWin?.enabled === 'boolean' ? serverTimer.buyWin.enabled : defaultSettings[timerKey].buyWin.enabled,
                winPercent: typeof serverTimer?.buyWin?.winPercent === 'number' ? serverTimer.buyWin.winPercent : defaultSettings[timerKey].buyWin.winPercent,
                lossPercent: typeof serverTimer?.buyWin?.lossPercent === 'number' ? serverTimer.buyWin.lossPercent : defaultSettings[timerKey].buyWin.lossPercent
              },
              sellWin: {
                enabled: typeof serverTimer?.sellWin?.enabled === 'boolean' ? serverTimer.sellWin.enabled : defaultSettings[timerKey].sellWin.enabled,
                winPercent: typeof serverTimer?.sellWin?.winPercent === 'number' ? serverTimer.sellWin.winPercent : defaultSettings[timerKey].sellWin.winPercent,
                lossPercent: typeof serverTimer?.sellWin?.lossPercent === 'number' ? serverTimer.sellWin.lossPercent : defaultSettings[timerKey].sellWin.lossPercent
              }
            }
          })
          setWinTradeSettings(mergedSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Failed to load user details')
    }
  }

  const handleViewUser = async (userId) => {
    setSelectedUser(userId)
    try {
      const response = await api.get(`/api/admin/users/${userId}`)
      if (response.data.success) {
        setUserDetails(response.data.user)
        setAppNotice(response.data.user.appNotice || '')
        // Load winTradeSettings and preserve existing values, only use defaults if completely missing
        const defaultSettings = {
          timer30s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
          timer60s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
          timer180s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
          timer300s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
          timer600s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } }
        }
        
        if (response.data.user.winTradeSettings && Object.keys(response.data.user.winTradeSettings).length > 0) {
          console.log('📥 Frontend: Loaded winTradeSettings from server:', JSON.stringify(response.data.user.winTradeSettings, null, 2))
          // Deep merge: use existing values, fallback to defaults only for missing nested properties
          // IMPORTANT: Use typeof check to preserve 0 and false values
          const mergedSettings = {}
          Object.keys(defaultSettings).forEach(timerKey => {
            const serverTimer = response.data.user.winTradeSettings[timerKey]
            mergedSettings[timerKey] = {
              buyWin: {
                enabled: typeof serverTimer?.buyWin?.enabled === 'boolean' ? serverTimer.buyWin.enabled : defaultSettings[timerKey].buyWin.enabled,
                winPercent: typeof serverTimer?.buyWin?.winPercent === 'number' ? serverTimer.buyWin.winPercent : defaultSettings[timerKey].buyWin.winPercent,
                lossPercent: typeof serverTimer?.buyWin?.lossPercent === 'number' ? serverTimer.buyWin.lossPercent : defaultSettings[timerKey].buyWin.lossPercent
              },
              sellWin: {
                enabled: typeof serverTimer?.sellWin?.enabled === 'boolean' ? serverTimer.sellWin.enabled : defaultSettings[timerKey].sellWin.enabled,
                winPercent: typeof serverTimer?.sellWin?.winPercent === 'number' ? serverTimer.sellWin.winPercent : defaultSettings[timerKey].sellWin.winPercent,
                lossPercent: typeof serverTimer?.sellWin?.lossPercent === 'number' ? serverTimer.sellWin.lossPercent : defaultSettings[timerKey].sellWin.lossPercent
              }
            }
          })
          console.log('📥 Frontend: Merged winTradeSettings:', JSON.stringify(mergedSettings, null, 2))
          setWinTradeSettings(mergedSettings)
        } else {
          console.log('⚠️ Frontend: No winTradeSettings found in user data, initializing with defaults')
          setWinTradeSettings(defaultSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Failed to load user details')
    }
  }

  const handleUpdateSettings = async () => {
    if (!userDetails) return
    try {
      // CRITICAL: Deep clone winTradeSettings to avoid reference issues
      const settingsToSave = JSON.parse(JSON.stringify(winTradeSettings))
      console.log('💾 Frontend: Saving winTradeSettings:', JSON.stringify(settingsToSave, null, 2))
      const response = await api.put(`/api/admin/users/${userDetails._id}/settings`, {
        isActive: userDetails.isActive,
        allowTrade: userDetails.allowTrade,
        allowWithdraw: userDetails.allowWithdraw,
        winTrade: userDetails.winTrade,
        tradeTimer: userDetails.tradeTimer,
        appNotice: appNotice,
        winTradeSettings: settingsToSave
      })
      if (response.data.success) {
        console.log('✅ Frontend: Settings saved successfully')
        console.log('✅ Frontend: Server returned:', JSON.stringify(response.data.user.winTradeSettings, null, 2))
        
        // Reload user details from server to get the exact saved values
        const userResponse = await api.get(`/api/admin/users/${userDetails._id}`)
        if (userResponse.data.success) {
          const updatedUser = userResponse.data.user
          setUserDetails(updatedUser)
          
          // Update winTradeSettings state with the exact values from server
          if (updatedUser.winTradeSettings) {
            console.log('✅ Frontend: Updating state with server values:', JSON.stringify(updatedUser.winTradeSettings, null, 2))
            // Use the same merge logic as handleViewUser to preserve structure
            const defaultSettings = {
              timer30s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
              timer60s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
              timer180s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
              timer300s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } },
              timer600s: { buyWin: { enabled: false, winPercent: 2, lossPercent: 2 }, sellWin: { enabled: false, winPercent: 2, lossPercent: 2 } }
            }
            const mergedSettings = {}
            Object.keys(defaultSettings).forEach(timerKey => {
              const serverTimer = updatedUser.winTradeSettings[timerKey]
              mergedSettings[timerKey] = {
                buyWin: {
                  enabled: typeof serverTimer?.buyWin?.enabled === 'boolean' ? serverTimer.buyWin.enabled : defaultSettings[timerKey].buyWin.enabled,
                  winPercent: typeof serverTimer?.buyWin?.winPercent === 'number' ? serverTimer.buyWin.winPercent : defaultSettings[timerKey].buyWin.winPercent,
                  lossPercent: typeof serverTimer?.buyWin?.lossPercent === 'number' ? serverTimer.buyWin.lossPercent : defaultSettings[timerKey].buyWin.lossPercent
                },
                sellWin: {
                  enabled: typeof serverTimer?.sellWin?.enabled === 'boolean' ? serverTimer.sellWin.enabled : defaultSettings[timerKey].sellWin.enabled,
                  winPercent: typeof serverTimer?.sellWin?.winPercent === 'number' ? serverTimer.sellWin.winPercent : defaultSettings[timerKey].sellWin.winPercent,
                  lossPercent: typeof serverTimer?.sellWin?.lossPercent === 'number' ? serverTimer.sellWin.lossPercent : defaultSettings[timerKey].sellWin.lossPercent
                }
              }
            })
            setWinTradeSettings(mergedSettings)
          }
        }
        
        alert('Settings updated successfully')
        await fetchUsers()
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    }
  }

  const handleBalanceChange = async () => {
    if (!userDetails || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    try {
      const response = await api.post(`/api/admin/users/${userDetails._id}/balance`, {
        amount: parseFloat(balanceAmount),
        addBalance,
        logToDeposit,
        logToWithdrawal,
        notifyUserEmail,
        description: addBalance ? 'Deposit' : 'Withdrawal'
      })
      if (response.data.success) {
        alert(addBalance ? 'Balance added successfully' : 'Balance subtracted successfully')
        setBalanceAmount('')
        await fetchUsers()
        const userResponse = await api.get(`/api/admin/users/${userDetails._id}`)
        if (userResponse.data.success) {
          setUserDetails(userResponse.data.user)
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error)
      alert(error.response?.data?.message || 'Failed to update balance')
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }
    if (!userDetails) return
    try {
      const response = await api.post(`/api/admin/users/${userDetails._id}/password`, {
        newPassword
      })
      if (response.data.success) {
        alert('Password changed successfully')
        setNewPassword('')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    }
  }

  const handleLoginAsUser = async (userId) => {
    // CRITICAL: userId is REQUIRED - don't fallback to userDetails
    if (!userId) {
      console.error('[Login As User] Frontend: ERROR - No userId provided!')
      alert('Error: No user ID provided. Please try again.')
      return
    }

    // Convert to string to ensure consistency
    const targetUserId = String(userId)
    console.log('[Login As User] Frontend: Received userId parameter:', userId)
    console.log('[Login As User] Frontend: Converted targetUserId:', targetUserId)
    
    // Find the user in the list to show their name in confirmation
    const targetUser = users.find(u => String(u._id) === targetUserId)
    const userName = targetUser?.fullName || targetUser?.email || 'this user'
    
    console.log('[Login As User] Frontend: Target user found:', targetUser ? 'YES' : 'NO')
    console.log('[Login As User] Frontend: Target user name:', userName)
    
    if (!window.confirm(`Are you sure you want to login as ${userName}? You will be logged out of your current admin/sub-admin session and logged in as this user. You will see their account, balance, and trades.`)) {
      return
    }
    
    try {
      console.log('[Login As User] Frontend: Starting login process')
      console.log('[Login As User] Frontend: Target user ID (string):', targetUserId)
      console.log('[Login As User] Frontend: Target user name:', userName)
      
      const response = await api.post(`/api/admin/users/${targetUserId}/login-as`)
      
      if (response.data.success && response.data.token) {
        console.log('[Login As User] Frontend: ==========================================')
        console.log('[Login As User] Frontend: Got response from server')
        console.log('[Login As User] Frontend: Response user:', response.data.user)
        console.log('[Login As User] Frontend: Response user email:', response.data.user.email)
        console.log('[Login As User] Frontend: Response user ID:', response.data.user.id)
        console.log('[Login As User] Frontend: Response user role:', response.data.user.role)
        console.log('[Login As User] Frontend: Expected target user ID:', targetUserId)
        console.log('[Login As User] Frontend: Token received:', response.data.token ? 'YES' : 'NO')
        
        // CRITICAL: Verify response user ID matches expected target user ID
        if (String(response.data.user.id) !== String(targetUserId)) {
          console.error('[Login As User] Frontend: CRITICAL ERROR - Response user ID does not match target user ID!')
          console.error('[Login As User] Frontend: Expected:', targetUserId)
          console.error('[Login As User] Frontend: Got:', response.data.user.id)
          alert(`ERROR: Server returned wrong user. Expected ${targetUserId}, got ${response.data.user.id}`)
          return
        }
        
        // IMPORTANT: Clear ALL storage first to remove admin/sub-admin session
        console.log('[Login As User] Frontend: Clearing all storage...')
        localStorage.clear()
        sessionStorage.clear()
        
        // CRITICAL: Also clear all cookies to remove old admin token
        // Delete all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
        console.log('[Login As User] Frontend: All cookies cleared')
        
        // Store ONLY the new user token
        localStorage.setItem('token', response.data.token)
        console.log('[Login As User] Frontend: Token stored in localStorage')
        
        // Verify token is stored
        const storedToken = localStorage.getItem('token')
        console.log('[Login As User] Frontend: Token stored:', storedToken ? 'YES' : 'NO')
        console.log('[Login As User] Frontend: Stored token length:', storedToken?.length)
        
        // Decode token to verify it's for the correct user (client-side verification)
        try {
          const tokenParts = storedToken.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            console.log('[Login As User] Frontend: Decoded token userId:', payload.userId)
            console.log('[Login As User] Frontend: Decoded token role:', payload.role)
            console.log('[Login As User] Frontend: Expected user ID:', response.data.user.id)
            console.log('[Login As User] Frontend: Expected target user ID:', targetUserId)
            
            // Verify token userId matches both response user ID and target user ID
            if (String(payload.userId) !== String(response.data.user.id)) {
              console.error('[Login As User] Frontend: CRITICAL ERROR - Token userId does not match response user ID!')
              alert('ERROR: Token mismatch with response. Please try again.')
              return
            }
            
            if (String(payload.userId) !== String(targetUserId)) {
              console.error('[Login As User] Frontend: CRITICAL ERROR - Token userId does not match target user ID!')
              alert(`ERROR: Token is for wrong user. Expected ${targetUserId}, got ${payload.userId}`)
              return
            }
            
            console.log('[Login As User] Frontend: ✓ Token verification passed')
          }
        } catch (decodeError) {
          console.error('[Login As User] Frontend: Error decoding token:', decodeError)
          alert('ERROR: Failed to decode token. Please try again.')
          return
        }
        
        console.log('[Login As User] Frontend: All checks passed. Redirecting to /dashboard...')
        console.log('[Login As User] Frontend: ==========================================')
        
        // Force immediate redirect - use replace to prevent back button
        // This ensures all React state, context, and axios interceptors are reset
        window.location.replace('/dashboard')
      } else {
        console.error('[Login As User] Frontend: Failed - no token in response')
        alert('Failed to get user token. Please try again.')
      }
    } catch (error) {
      console.error('[Login As User] Frontend: Error:', error)
      console.error('[Login As User] Frontend: Error response:', error.response?.data)
      alert(error.response?.data?.message || 'Failed to login as user. Please try again.')
    }
  }

  const handleShowLogs = async (userId) => {
    setShowLogsUser(userId)
    setLogsLoading(true)
    try {
      const response = await api.get(`/api/admin/users/${userId}/logs`)
      if (response.data.success) {
        setUserLogs(response.data.logs)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-bold">All Users</h2>
            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:max-w-md">
              <input
                type="text"
                placeholder="Search by name, email, username, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unique ID</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Balance</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date Joined</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Login</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Verified</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono">{user.uniqueId || user.payid || 'N/A'}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{user.email}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">{user.fullName}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold">{formatCurrency(user.balance || 0)}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.createdAt || user.accountCreatedAt)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.lastLogin?.loginAt)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isEmailVerified 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {user.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <button
                          onClick={() => handleViewUser(user._id)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleShowLogs(user._id)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                        >
                          Logs
                        </button>
                        <button
                          onClick={() => handleLoginAsUser(user._id)}
                          className="px-2 py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        >
                          Login As
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No users found matching your search' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Modal */}
      {showLogsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold">Login Logs</h3>
              <button
                onClick={() => {
                  setShowLogsUser(null)
                  setUserLogs([])
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {logsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : userLogs.length > 0 ? (
                <div className="space-y-4">
                  {userLogs.map((log, index) => (
                    <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Date</p>
                          <p className="font-medium">{formatDate(log.loginAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Device</p>
                          <p className="font-medium">{log.deviceType}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">IP Address</p>
                          <p className="font-medium font-mono">{log.ip}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Location</p>
                          <p className="font-medium">{log.city}, {log.country}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No logs found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details Full Page - This is a very large component, continuing in next part due to size */}
      {selectedUser && userDetails && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 sticky top-0 z-10 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setUserDetails(null)
                    setBalanceAmount('')
                    setNewPassword('')
                    setAppNotice('')
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition mb-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-2xl font-bold text-white">User Management</h3>
                <p className="text-indigo-100 text-sm mt-1">{userDetails.email}</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-6">
            {/* Two Column Layout - Single column for Sub-admin */}
            <div className={`grid grid-cols-1 ${!isSubAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Left Column - Hidden for Sub-Admins */}
              {!isSubAdmin && (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Email</label>
                      <p className="text-gray-900 dark:text-white font-medium">{userDetails.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={userDetails.fullName || ''}
                        onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Unique ID</label>
                      <input
                        type="text"
                        value={userDetails.uniqueId || userDetails.payid || ''}
                        onChange={(e) => setUserDetails({ ...userDetails, uniqueId: e.target.value, payid: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
                        disabled
                        title="Unique ID cannot be changed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Unique identifier for this user</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Phone</label>
                      <input
                        type="text"
                        value={userDetails.phone || ''}
                        onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Balance</label>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(userDetails.balance || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Email Verified</label>
                      <ToggleSwitch
                        enabled={userDetails.isEmailVerified || false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, isEmailVerified: enabled })}
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await api.put(`/api/admin/users/${userDetails._id}`, {
                          uniqueId: userDetails.uniqueId || userDetails.payid,
                          fullName: userDetails.fullName,
                          phone: userDetails.phone,
                          isEmailVerified: userDetails.isEmailVerified
                        })
                        if (response.data.success) {
                          alert('User info updated successfully')
                          await fetchUsers()
                        }
                      } catch (error) {
                        console.error('Error updating user:', error)
                        alert('Failed to update user info')
                      }
                    }}
                    className="mt-4 w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                  >
                    Save User Info
                  </button>
                </div>

                {/* Settings Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Trading Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Active User</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enable or disable user account</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.isActive !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, isActive: enabled })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Allow Trade</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Permit user to place trades</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.allowTrade !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, allowTrade: enabled })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Allow Withdraw</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Permit user to withdraw funds</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.allowWithdraw !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, allowWithdraw: enabled })}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleUpdateSettings}
                    className="mt-4 w-full px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
              )}

              {/* Right Column */}
              <div className="space-y-6">
                {/* Balance Management Card - Hidden for Sub-admin */}
                {!isSubAdmin && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Balance Management
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setAddBalance(true)}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                          addBalance
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Add Balance
                      </button>
                      <button
                        onClick={() => setAddBalance(false)}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                          !addBalance
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Subtract Balance
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Log to Deposit</span>
                          <ToggleSwitch
                            enabled={logToDeposit}
                            onChange={(enabled) => {
                              setLogToDeposit(enabled)
                              if (enabled) setLogToWithdrawal(false)
                            }}
                          />
                        </label>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Log to Withdrawal</span>
                          <ToggleSwitch
                            enabled={logToWithdrawal}
                            onChange={(enabled) => {
                              setLogToWithdrawal(enabled)
                              if (enabled) setLogToDeposit(false)
                            }}
                          />
                        </label>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Notify via Email</span>
                          <ToggleSwitch
                            enabled={notifyUserEmail}
                            onChange={setNotifyUserEmail}
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={handleBalanceChange}
                      className={`w-full px-6 py-2.5 rounded-lg font-semibold text-white transition shadow-lg hover:shadow-xl ${
                        addBalance ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {addBalance ? 'Add' : 'Subtract'} Balance
                    </button>
                  </div>
                </div>
                )}

                {/* Change Password Card - Hidden for Sub-admin */}
                {!isSubAdmin && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                        placeholder="Enter new password (min 8 characters)"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="w-full px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                )}

                {/* App Notice Card - Hidden for Sub-admin */}
                {!isSubAdmin && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    App Notice Message
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Notice Message</label>
                      <textarea
                        value={appNotice}
                        onChange={(e) => setAppNotice(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                        rows="4"
                        placeholder="Enter notice message for user"
                      />
                    </div>
                    <button
                      onClick={handleUpdateSettings}
                      className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                    >
                      Save Notice
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Win Trade Settings Card - Full Width (Visible for both Admin and Sub-admin) */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Win Trade Configuration
              </h4>
              <div className="space-y-6">
                {(() => {
                  const renderTimerSettings = (timerKey, timerLabel, color) => {
                    const timer = winTradeSettings[timerKey]
                    return (
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <span className={`w-2 h-2 bg-${color}-500 rounded-full mr-2`}></span>
                          {timerLabel} Timer
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-gray-900 dark:text-white">Buy/Long</span>
                              <ToggleSwitch
                                enabled={timer?.buyWin?.enabled || false}
                                onChange={(enabled) => setWinTradeSettings({
                                  ...winTradeSettings,
                                  [timerKey]: {
                                    ...timer,
                                    buyWin: { ...timer?.buyWin, enabled }
                                  }
                                })}
                              />
                            </div>
                            {timer?.buyWin?.enabled ? (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Win %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={typeof timer?.buyWin?.winPercent === 'number' ? timer.buyWin.winPercent : 2}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      setWinTradeSettings({
                                        ...winTradeSettings,
                                        [timerKey]: {
                                          ...timer,
                                          buyWin: { ...timer?.buyWin, winPercent: newValue }
                                        }
                                      })
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                />
                              </div>
                            ) : (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loss %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={typeof timer?.buyWin?.lossPercent === 'number' ? timer.buyWin.lossPercent : 2}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      setWinTradeSettings({
                                        ...winTradeSettings,
                                        [timerKey]: {
                                          ...timer,
                                          buyWin: { ...timer?.buyWin, lossPercent: newValue }
                                        }
                                      })
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                />
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-gray-900 dark:text-white">Sell/Short</span>
                              <ToggleSwitch
                                enabled={timer?.sellWin?.enabled || false}
                                onChange={(enabled) => setWinTradeSettings({
                                  ...winTradeSettings,
                                  [timerKey]: {
                                    ...timer,
                                    sellWin: { ...timer?.sellWin, enabled }
                                  }
                                })}
                              />
                            </div>
                            {timer?.sellWin?.enabled ? (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Win %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={typeof timer?.sellWin?.winPercent === 'number' ? timer.sellWin.winPercent : 2}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      setWinTradeSettings({
                                        ...winTradeSettings,
                                        [timerKey]: {
                                          ...timer,
                                          sellWin: { ...timer?.sellWin, winPercent: newValue }
                                        }
                                      })
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                />
                              </div>
                            ) : (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loss %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={typeof timer?.sellWin?.lossPercent === 'number' ? timer.sellWin.lossPercent : 2}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      setWinTradeSettings({
                                        ...winTradeSettings,
                                        [timerKey]: {
                                          ...timer,
                                          sellWin: { ...timer?.sellWin, lossPercent: newValue }
                                        }
                                      })
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <>
                      {renderTimerSettings('timer30s', '30 Seconds', 'emerald')}
                      {renderTimerSettings('timer60s', '60 Seconds', 'blue')}
                      {renderTimerSettings('timer180s', '3 Minutes', 'purple')}
                      {renderTimerSettings('timer300s', '5 Minutes', 'pink')}
                      {renderTimerSettings('timer600s', '10 Minutes', 'orange')}
                    </>
                  )
                })()}
              </div>
              <button
                onClick={handleUpdateSettings}
                className="mt-6 w-full px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
              >
                Save Win Trade Settings
              </button>
            </div>

            {/* Login As User */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleLoginAsUser(userDetails._id)}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Login As User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

