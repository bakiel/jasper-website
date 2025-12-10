'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'
import { adminAuthApi } from '@/lib/api'
import {
  User,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Notification preferences (stored in localStorage for now)
  const [emailNotifications, setEmailNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jasper-email-notifications') !== 'false'
    }
    return true
  })

  const [pushNotifications, setPushNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jasper-push-notifications') === 'true'
    }
    return false
  })

  const themeOptions: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Always use light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Always use dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ]

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)

    try {
      await adminAuthApi.changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleNotificationChange = (type: 'email' | 'push', value: boolean) => {
    if (type === 'email') {
      setEmailNotifications(value)
      localStorage.setItem('jasper-email-notifications', value.toString())
    } else {
      setPushNotifications(value)
      localStorage.setItem('jasper-push-notifications', value.toString())
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-jasper-carbon">Settings</h1>
          <p className="text-jasper-slate mt-1">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <User className="w-5 h-5 text-jasper-emerald" />
              <h2 className="font-semibold text-jasper-carbon">Profile</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    className="input bg-surface-secondary dark:bg-surface-tertiary"
                    value={user?.first_name || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    className="input bg-surface-secondary dark:bg-surface-tertiary"
                    value={user?.last_name || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input bg-surface-secondary dark:bg-surface-tertiary"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="input-label">Role</label>
                  <input
                    type="text"
                    className="input bg-surface-secondary dark:bg-surface-tertiary capitalize"
                    value={user?.role?.replace('_', ' ') || ''}
                    disabled
                  />
                </div>
              </div>
              <p className="text-sm text-jasper-slate mt-4">
                Contact an administrator to update your profile information.
              </p>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Sun className="w-5 h-5 text-jasper-emerald" />
              <h2 className="font-semibold text-jasper-carbon">Appearance</h2>
            </div>
            <div className="card-body">
              <label className="input-label mb-4">Theme</label>
              <div className="grid grid-cols-3 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = theme === option.value

                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${isSelected
                          ? 'border-jasper-emerald bg-jasper-emerald/5'
                          : 'border-border hover:border-jasper-slate-light bg-surface-primary dark:bg-surface-secondary'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-jasper-emerald" />
                        </div>
                      )}
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-jasper-emerald' : 'text-jasper-slate'}`} />
                      <div className="font-medium text-jasper-carbon">{option.label}</div>
                      <div className="text-sm text-jasper-slate mt-1">{option.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Bell className="w-5 h-5 text-jasper-emerald" />
              <h2 className="font-semibold text-jasper-carbon">Notifications</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border-light">
                <div>
                  <div className="font-medium text-jasper-carbon">Email Notifications</div>
                  <div className="text-sm text-jasper-slate">Receive updates and alerts via email</div>
                </div>
                <button
                  onClick={() => handleNotificationChange('email', !emailNotifications)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors duration-200
                    ${emailNotifications ? 'bg-jasper-emerald' : 'bg-jasper-slate-light'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                      ${emailNotifications ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-jasper-carbon">Push Notifications</div>
                  <div className="text-sm text-jasper-slate">Receive browser push notifications</div>
                </div>
                <button
                  onClick={() => handleNotificationChange('push', !pushNotifications)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors duration-200
                    ${pushNotifications ? 'bg-jasper-emerald' : 'bg-jasper-slate-light'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                      ${pushNotifications ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Shield className="w-5 h-5 text-jasper-emerald" />
              <h2 className="font-semibold text-jasper-carbon">Security</h2>
            </div>
            <div className="card-body">
              {!showPasswordSection ? (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="btn-secondary"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-status-error rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-status-success rounded-lg">
                      <Check className="w-4 h-4" />
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label className="input-label">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="input pr-10"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-jasper-slate hover:text-jasper-carbon"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="input pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-jasper-slate hover:text-jasper-carbon"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="btn-primary"
                    >
                      {isChangingPassword ? 'Changing...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError('')
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
