import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/axios'
import ToggleSwitch from './ToggleSwitch'
import UserCoinAddressModal from './UserCoinAddressModal'

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const isSubAdmin = currentUser?.role === 'subadmin'
  const subAdminPermissions = {
    can_view_users: true,
    can_edit_users: false,
    can_create_users: false,
    can_add_balance: false,
    can_activate_user: false,
    can_deactivate_user: false,
    can_notify_users: false,
    can_customer_service: false,
    can_manage_trade_access: false,
    can_manage_coin_address: false,
    ...(currentUser?.subAdminPermissions || {})
  }
  Object.keys(subAdminPermissions).forEach((key) => {
    const v = subAdminPermissions[key]
    subAdminPermissions[key] = v === true || v === 'true' || v === 1
  })
  const canViewUsers = !isSubAdmin || subAdminPermissions.can_view_users
  const canEditUsers = !isSubAdmin || subAdminPermissions.can_edit_users
  const canCreateUsers = !isSubAdmin || subAdminPermissions.can_create_users
  const canAddBalance = !isSubAdmin || subAdminPermissions.can_add_balance
  const canActivateUser = !isSubAdmin || subAdminPermissions.can_activate_user
  const canDeactivateUser = !isSubAdmin || subAdminPermissions.can_deactivate_user
  const canManageTradeAccess = !isSubAdmin || subAdminPermissions.can_manage_trade_access
  const canManageCoinAddress = !isSubAdmin || subAdminPermissions.can_manage_coin_address
  const [showLogsUser, setShowLogsUser] = useState(null)
  const [userLogs, setUserLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [coinAddressUser, setCoinAddressUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [addBalance, setAddBalance] = useState(true)
  const [logToDeposit, setLogToDeposit] = useState(false)
  const [logToWithdrawal, setLogToWithdrawal] = useState(false)
  const [notifyUserEmail, setNotifyUserEmail] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [createCustomerForm, setCreateCustomerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  })
  const [createCustomerLoading, setCreateCustomerLoading] = useState(false)
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
      if (error.response?.status === 403) {
        alert(error.response?.data?.message || 'Access denied to users list')
      }
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
    setTemporaryPassword('')
    try {
      const response = await api.get(`/api/admin/users/${user._id}`)
      if (response.data.success) {
        setUserDetails({
          ...response.data.user,
          lastLogin: response.data.user.lastLogin || user.lastLogin || null
        })
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
    setTemporaryPassword('')
    const listUser = users.find((u) => String(u._id) === String(userId))
    try {
      const response = await api.get(`/api/admin/users/${userId}`)
      if (response.data.success) {
        setUserDetails({
          ...response.data.user,
          lastLogin: response.data.user.lastLogin || listUser?.lastLogin || null
        })
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

  const handleCreateCustomer = async () => {
    if (!createCustomerForm.fullName?.trim() || !createCustomerForm.email?.trim() || !createCustomerForm.phone?.trim()) {
      alert('Full name, email, and phone are required')
      return
    }
    setCreateCustomerLoading(true)
    try {
      const response = await api.post('/api/admin/users/create', {
        fullName: createCustomerForm.fullName.trim(),
        email: createCustomerForm.email.trim(),
        phone: createCustomerForm.phone.trim(),
        ...(createCustomerForm.password?.trim()
          ? { password: createCustomerForm.password.trim() }
          : {})
      })
      if (response.data.success) {
        const tempPw = response.data.temporaryPassword || response.data.password
        alert(
          tempPw
            ? `Customer created. Temporary password: ${tempPw}`
            : 'Customer created successfully'
        )
        setShowCreateCustomer(false)
        setCreateCustomerForm({ fullName: '', email: '', phone: '', password: '' })
        await fetchUsers()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create customer')
    } finally {
      setCreateCustomerLoading(false)
    }
  }

  const handleSaveUserInfo = async () => {
    if (!userDetails || !canEditUsers) return
    try {
      const response = await api.put(`/api/admin/users/${userDetails._id}`, {
        fullName: userDetails.fullName,
        phone: userDetails.phone,
        username: userDetails.username
      })
      if (response.data.success) {
        alert('Customer info updated successfully')
        await fetchUsers()
        const userResponse = await api.get(`/api/admin/users/${userDetails._id}`)
        if (userResponse.data.success) {
          setUserDetails(userResponse.data.user)
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update customer info')
    }
  }

  const handleUpdateSettings = async () => {
    if (!userDetails) return
    try {
      // CRITICAL: Deep clone winTradeSettings to avoid reference issues
      const settingsToSave = JSON.parse(JSON.stringify(winTradeSettings))
      console.log('💾 Frontend: Saving winTradeSettings:', JSON.stringify(settingsToSave, null, 2))
      
      // Prepare request body based on user role
      let requestBody = {}
      
      if (isSubAdmin) {
        // Sub-admins only send fields they have permission for (no extra approval).
        requestBody = {}
        if (canEditUsers) {
          requestBody.winTradeSettings = settingsToSave
        }
      } else {
        // Admins can update all settings
        requestBody = {
          isActive: userDetails.isActive,
          allowTrade: userDetails.allowTrade,
          allowWithdraw: userDetails.allowWithdraw,
          isEmailVerified: userDetails.isEmailVerified,
          winTrade: userDetails.winTrade,
          tradeTimer: userDetails.tradeTimer,
          appNotice: appNotice,
          winTradeSettings: settingsToSave
        }
      }

      if (isSubAdmin && Object.keys(requestBody).length === 0) {
        alert('No permitted settings to save')
        return
      }
      
      const response = await api.put(`/api/admin/users/${userDetails._id}/settings`, requestBody)
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
      // Sub-admin: always log deposit + always email customer (not optional)
      const response = await api.post(`/api/admin/users/${userDetails._id}/balance`, {
        amount: parseFloat(balanceAmount),
        addBalance: isSubAdmin ? true : addBalance,
        logToDeposit: isSubAdmin ? true : logToDeposit,
        logToWithdrawal: isSubAdmin ? false : logToWithdrawal,
        notifyUserEmail: isSubAdmin ? true : notifyUserEmail,
        description: isSubAdmin || addBalance ? 'Deposit' : 'Withdrawal'
      })
      if (response.data.success) {
        if (isSubAdmin) {
          const parts = ['Balance added']
          if (response.data.depositLogged !== false) parts.push('saved to deposit log')
          if (response.data.emailSent) parts.push('email sent to customer')
          else parts.push('email may have failed — check server logs')
          alert(parts.join(' · '))
        } else {
          alert(addBalance ? 'Balance added successfully' : 'Balance subtracted successfully')
        }
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
        setTemporaryPassword('')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    }
  }

  const handleGenerateTemporaryPassword = async () => {
    if (!userDetails) return
    try {
      const response = await api.post(`/api/admin/users/${userDetails._id}/password/reset-temp`)
      if (response.data.success) {
        setTemporaryPassword(response.data.temporaryPassword || '')
        alert('Temporary password generated successfully')
      }
    } catch (error) {
      console.error('Error generating temporary password:', error)
      alert(error.response?.data?.message || 'Failed to generate temporary password')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading users...</p>
      </div>
    )
  }

  if (!canViewUsers) {
    return (
      <div className="fx-card p-8 text-center text-slate-600 dark:text-slate-300">
        You do not have permission to view users.
      </div>
    )
  }

  return (
    <>
      <div className="fx-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {isSubAdmin ? 'Assigned Customers' : 'All Users'}
              </h2>
              {isSubAdmin && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You only see customers assigned to you. Granted permissions work immediately — no extra approval.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {canCreateUsers && (
                <button
                  type="button"
                  onClick={() => setShowCreateCustomer(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold whitespace-nowrap"
                >
                  + Create Customer
                </button>
              )}
              {/* Search Input */}
              <div className="relative w-full sm:w-auto sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search by name, email, username, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fx-input w-full pl-10 pr-4 py-2.5"
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Compact responsive users table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 font-semibold">User</th>
                <th className="px-3 sm:px-4 py-2.5 font-semibold whitespace-nowrap">Balance</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-2.5 font-semibold">Status</th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-2.5 font-semibold whitespace-nowrap">Last login</th>
                <th className="hidden xl:table-cell px-3 sm:px-4 py-2.5 font-semibold">Joined</th>
                <th className="px-3 sm:px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-2.5 min-w-0">
                      <div className="min-w-0 max-w-[240px] sm:max-w-xs">
                        <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                          {user.fullName || '—'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {user.uniqueId || user.payid || user._id}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                      <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatCurrency(user.balance || 0)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            user.isEmailVerified
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {user.isEmailVerified ? 'Email ✓' : 'Email —'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            user.isKycVerified
                              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {user.isKycVerified ? 'KYC ✓' : 'KYC —'}
                        </span>
                        {user.isActive === false && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {user.lastLogin?.loginAt ? (
                        <div>
                          <p className="font-medium tabular-nums">
                            {new Date(user.lastLogin.loginAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-[10px] text-slate-400 tabular-nums">
                            {new Date(user.lastLogin.loginAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {user.lastLogin.city || user.lastLogin.country
                              ? ` · ${[user.lastLogin.city, user.lastLogin.country].filter(Boolean).join(', ')}`
                              : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-3 sm:px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {user.createdAt || user.accountCreatedAt
                        ? new Date(user.createdAt || user.accountCreatedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleViewUser(user._id)}
                          disabled={!canViewUsers}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          View
                        </button>
                        {(canEditUsers || canAddBalance || canActivateUser || canDeactivateUser) && (
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Edit
                          </button>
                        )}
                        {(canManageCoinAddress || !isSubAdmin) && (
                          <button
                            type="button"
                            onClick={() => setCoinAddressUser(user)}
                            className="hidden sm:inline-flex px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-700 text-white hover:bg-slate-800"
                          >
                            Coins
                          </button>
                        )}
                        {canViewUsers && (
                          <button
                            type="button"
                            onClick={() => handleShowLogs(user._id)}
                            className="hidden xl:inline-flex px-2 py-1 text-[11px] font-semibold rounded-md bg-violet-600 text-white hover:bg-violet-700"
                          >
                            Logs
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleLoginAsUser(user._id)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Login
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    {searchQuery
                      ? 'No users match your search'
                      : isSubAdmin
                        ? 'No customers assigned to you yet'
                        : 'No users found'}
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

      {/* User Details Full Page */}
      {selectedUser && userDetails && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-50 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null)
                  setUserDetails(null)
                  setBalanceAmount('')
                  setNewPassword('')
                  setTemporaryPassword('')
                  setAppNotice('')
                }}
                className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Back to users"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {userDetails.fullName || 'User'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      userDetails.isActive !== false
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    }`}
                  >
                    {userDetails.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                  {userDetails.email}
                  {userDetails.lastLogin?.loginAt
                    ? ` · Last login ${formatDate(userDetails.lastLogin.loginAt)}`
                    : ' · Never logged in'}
                </p>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Balance</p>
                <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(userDetails.balance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {/* Two Column Layout - Single column for Sub-admin */}
            <div className={`grid grid-cols-1 ${!isSubAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Left Column - Hidden for Sub-Admins */}
              {!isSubAdmin && (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
                    <span className="w-8 h-8 mr-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 inline-flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
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
                        disabled={isSubAdmin}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                          isSubAdmin ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Unique ID</label>
                      <input
                        type="text"
                        value={userDetails.uniqueId || userDetails.payid || ''}
                        onChange={(e) => setUserDetails({ ...userDetails, uniqueId: e.target.value, payid: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono opacity-60 cursor-not-allowed"
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
                        disabled={isSubAdmin}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                          isSubAdmin ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Balance</label>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(userDetails.balance || 0)}</p>
                    </div>
                  </div>
                  {!isSubAdmin && (
                    <button
                      type="button"
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
                      className="mt-4 w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-md shadow-indigo-600/20"
                    >
                      Save user info
                    </button>
                  )}
                </div>

                {/* Settings Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-base font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
                    <span className="w-8 h-8 mr-2 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 inline-flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </span>
                    Account controls
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">Active account</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Off blocks login for this user</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.isActive !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, isActive: enabled })}
                        onLabel="Active"
                        offLabel="Off"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">Allow trade</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permit placing trades</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.allowTrade !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, allowTrade: enabled })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">Allow withdraw</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permit withdrawals</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.allowWithdraw !== false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, allowWithdraw: enabled })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">Email verified</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mark email as verified</p>
                      </div>
                      <ToggleSwitch
                        enabled={userDetails.isEmailVerified || false}
                        onChange={(enabled) => setUserDetails({ ...userDetails, isEmailVerified: enabled })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateSettings}
                    className="mt-4 w-full px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-md shadow-violet-600/20"
                  >
                    Save settings
                  </button>
                </div>
              </div>
              )}

              {/* Right Column */}
              <div className="space-y-6">
                {/* Sub-admin allowed actions */}
                {isSubAdmin && (canEditUsers || canAddBalance || canActivateUser || canDeactivateUser || canManageTradeAccess) && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Allowed User Actions</h4>
                    <div className="space-y-4">
                      {canEditUsers && (
                        <div className="space-y-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="font-semibold text-gray-900 dark:text-white">Edit customer info</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Email: <span className="font-medium text-gray-700 dark:text-gray-200">{userDetails.email}</span>
                          </p>
                          <input
                            type="text"
                            value={userDetails.username || ''}
                            onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                            placeholder="Username"
                          />
                          <input
                            type="text"
                            value={userDetails.fullName || ''}
                            onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                            placeholder="Full name"
                          />
                          <input
                            type="text"
                            value={userDetails.phone || ''}
                            onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                            placeholder="Phone number"
                          />
                          <button
                            type="button"
                            onClick={handleSaveUserInfo}
                            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                          >
                            Save customer info
                          </button>
                        </div>
                      )}

                      {(canActivateUser || canDeactivateUser) && (
                        <div className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">User status</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {userDetails.isActive !== false ? 'Currently active' : 'Currently inactive'}
                            </p>
                          </div>
                          <ToggleSwitch
                            enabled={userDetails.isActive !== false}
                            onLabel="Active"
                            offLabel="Off"
                            onChange={async (nextStatus) => {
                              if (nextStatus && !canActivateUser) {
                                alert('You do not have permission to activate users.')
                                return
                              }
                              if (!nextStatus && !canDeactivateUser) {
                                alert('You do not have permission to deactivate users.')
                                return
                              }
                              try {
                                const response = await api.put(`/api/admin/users/${userDetails._id}/settings`, {
                                  isActive: nextStatus
                                })
                                if (response.data.success) {
                                  setUserDetails({ ...userDetails, isActive: nextStatus })
                                  await fetchUsers()
                                }
                              } catch (error) {
                                alert(error.response?.data?.message || 'Failed to update user status')
                              }
                            }}
                          />
                        </div>
                      )}

                      {canManageTradeAccess && (
                        <div className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">Trading access</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {userDetails.allowTrade !== false ? 'Trading is enabled' : 'Trading is blocked'}
                            </p>
                          </div>
                          <ToggleSwitch
                            enabled={userDetails.allowTrade !== false}
                            onLabel="On"
                            offLabel="Off"
                            onChange={async (nextAllowTrade) => {
                              try {
                                const response = await api.put(`/api/admin/users/${userDetails._id}/settings`, {
                                  allowTrade: nextAllowTrade
                                })
                                if (response.data.success) {
                                  setUserDetails({ ...userDetails, allowTrade: nextAllowTrade })
                                  await fetchUsers()
                                }
                              } catch (error) {
                                alert(error.response?.data?.message || 'Failed to update trading permission')
                              }
                            }}
                          />
                        </div>
                      )}

                      {canAddBalance && (
                        <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">Add customer balance</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Credits USDT to this customer immediately
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] uppercase text-slate-500">Current</p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                {formatCurrency(userDetails.balance || 0)}
                              </p>
                            </div>
                          </div>

                          {/* <div className="rounded-lg bg-white/80 dark:bg-slate-900/50 border border-emerald-100 dark:border-emerald-900 px-3 py-2 space-y-1">
                            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
                              Always applied
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                              <li>✓ Written to <strong>Deposit Log</strong></li>
                              <li>✓ <strong>Email</strong> sent to customer ({userDetails.email || '—'})</li>
                              <li>✓ Your name / email recorded on the deposit</li>
                            </ul>
                          </div> */}

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                              Amount (USDT)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={balanceAmount}
                              onChange={(e) => setBalanceAmount(e.target.value)}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-lg font-semibold tabular-nums focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleBalanceChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20"
                          >
                            Add balance & notify customer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        For security, current user passwords are encrypted and cannot be viewed in plain text.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">New Password</label>
                      <input
                        type={showPasswordInput ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={showPasswordInput}
                          onChange={(e) => setShowPasswordInput(e.target.checked)}
                        />
                        Show password
                      </label>
                    </div>
                    {temporaryPassword ? (
                      <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-900/20">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Latest Temporary Password</p>
                        <p className="font-mono text-sm break-all text-indigo-800 dark:text-indigo-200">{temporaryPassword}</p>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={handleChangePassword}
                        className="w-full px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={handleGenerateTemporaryPassword}
                        className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                      >
                        Generate Temp Password
                      </button>
                    </div>
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
                    {!isSubAdmin && (
                      <button
                        onClick={handleUpdateSettings}
                        className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
                      >
                        Save Notice
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Win Trade Settings — admin always; sub-admin only with can_edit_users (immediate, no approval) */}
            {isSubAdmin && canEditUsers && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Assigned customer only</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      You can manage only this assigned customer. Your granted permissions apply immediately — no extra approval needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(!isSubAdmin || canEditUsers) && (
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
            )}

            {/* Login As User — assigned customers only (enforced by API for sub-admin) */}
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

      {/* Create customer modal (admin or sub-admin with can_create_users) */}
      {showCreateCustomer && canCreateUsers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Customer</h3>
              <button
                type="button"
                onClick={() => setShowCreateCustomer(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            {isSubAdmin && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New customers are automatically assigned to you. No extra approval needed.
              </p>
            )}
            <input
              type="text"
              placeholder="Full name *"
              value={createCustomerForm.fullName}
              onChange={(e) => setCreateCustomerForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              type="email"
              placeholder="Email *"
              value={createCustomerForm.email}
              onChange={(e) => setCreateCustomerForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Phone *"
              value={createCustomerForm.phone}
              onChange={(e) => setCreateCustomerForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <input
              type="text"
              placeholder="Password (optional — auto-generated if empty)"
              value={createCustomerForm.password}
              onChange={(e) => setCreateCustomerForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateCustomer(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createCustomerLoading}
                onClick={handleCreateCustomer}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                {createCustomerLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <UserCoinAddressModal
        isOpen={Boolean(coinAddressUser)}
        user={coinAddressUser}
        onClose={() => setCoinAddressUser(null)}
      />
    </>
  )
}

