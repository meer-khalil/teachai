import { useState, useEffect, useContext } from 'react'
import api from '../../../util/api'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { UsageContext } from '../../../context/UsageContext'
import { UserContext } from '../../../context/UserContext'
import { FiEye, FiEyeOff } from 'react-icons/fi'

const Settings = () => {
    const { usage } = useContext(UsageContext)
    const { user, getUserData, setIsAuthenticated, setUser } = useContext(UserContext)
    const navigate = useNavigate()

    // Profile state
    const [profile, setProfile] = useState({ firstName: '', lastName: '', country: '', emailUpdate: false })

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Change email state
    const [newEmail, setNewEmail] = useState('')
    const [emailPassword, setEmailPassword] = useState('')
    const [showEmailPassword, setShowEmailPassword] = useState(false)

    useEffect(() => {
        if (user) {
            setProfile({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                country: user.country || '',
                emailUpdate: user.emailUpdate || false
            })
        }
    }, [user])

    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))
    }

    const submitProfile = async (e) => {
        e.preventDefault()
        try {
            await api.put('/me', profile)
            toast('Profile updated')
            getUserData()
        } catch (err) {
            console.error(err)
            toast('Failed to update profile')
        }
    }

    const submitPassword = async () => {
        if (newPassword !== confirmNewPassword) {
            toast('New passwords do not match')
            return
        }
        try {
            await api.put('/changepassword', { currentPassword, newPassword, confirmNewPassword })
            toast('Password changed')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
        } catch (err) {
            console.error(err)
            toast('Error changing password')
        }
    }

    const submitChangeEmail = async () => {
        try {
            await api.put('/changeEmail', { email: newEmail, password: emailPassword })
            toast('Email changed')
            setNewEmail('')
            setEmailPassword('')
            getUserData()
        } catch (err) {
            console.error(err)
            toast('Error changing email')
        }
    }

    const handleTwoFA = async (enabled) => {
        try {
            await api.put('/enable-2fa', { enabled })
            toast(enabled ? '2FA enabled' : '2FA disabled')
            getUserData()
        } catch (err) {
            console.error(err)
            toast('Error updating 2FA')
        }
    }

    const deleteAccount = async () => {
        try {
            await api.delete('/account')
            toast('Account successfully deleted')
            delete api.defaults.headers.common['Authorization']
            localStorage.removeItem('teachai_token')
            localStorage.removeItem('teachai_user')
            setIsAuthenticated(false)
            setUser(null)
            navigate('/')
        } catch (err) {
            console.error(err)
            toast('Error deleting account')
        }
    }

    const cancelSubscription = async () => {
        try {
            await api.delete('/payment/cancel-subscription')
            toast('Successfully unsubscribed')
            // refresh usage or user state if needed
        } catch (err) {
            console.error(err)
            toast('Error unsubscribing')
        }
    }

    return (
        <main className="w-full max-w-6xl mx-auto">
            <header className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Settings</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">Manage your profile, security and subscription settings.</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-xl font-semibold mb-3">My Details</h3>
                    <form onSubmit={submitProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="firstName" value={profile.firstName} onChange={handleProfileChange} placeholder="First name" className="w-full p-2 border rounded" />
                            <input name="lastName" value={profile.lastName} onChange={handleProfileChange} placeholder="Last name" className="w-full p-2 border rounded" />
                        </div>
                        <input name="country" value={profile.country} onChange={handleProfileChange} placeholder="Country" className="w-full p-2 border rounded" />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Details</button>
                    </form>
                </div>

                {/* TwoFA */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-xl font-semibold mb-3">Secure Your Account</h3>
                    <p className="text-sm text-gray-700">Two-factor authentication adds an extra layer of security to your account.</p>
                    <div className="flex gap-3 mt-3">
                        <button onClick={() => handleTwoFA(true)} className="bg-blue-600 text-white px-3 py-2 rounded">Enable 2FA</button>
                        <button onClick={() => handleTwoFA(false)} className="border px-3 py-2 rounded">Disable 2FA</button>
                    </div>
                    <div className="mt-3">Status: {user?.TwoFA ? 'Yes' : 'No'}</div>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-xl font-semibold mb-3">Change Password</h3>
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="Current Password"
                                className="w-full p-2 border rounded"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(s => !s)}
                                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            >
                                    {showCurrentPassword ? <FiEyeOff className="h-5 w-5 text-gray-600" /> : <FiEye className="h-5 w-5 text-gray-600" />}
                            </button>
                        </div>

                        <div className="relative mt-2">
                            <input
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="New Password"
                                className="w-full p-2 border rounded"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(s => !s)}
                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            >
                                    {showNewPassword ? <FiEyeOff className="h-5 w-5 text-gray-600" /> : <FiEye className="h-5 w-5 text-gray-600" />}
                            </button>
                        </div>

                        <div className="relative mt-2">
                            <input
                                value={confirmNewPassword}
                                onChange={e => setConfirmNewPassword(e.target.value)}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm New Password"
                                className="w-full p-2 border rounded"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(s => !s)}
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            >
                                    {showConfirmPassword ? <FiEyeOff className="h-5 w-5 text-gray-600" /> : <FiEye className="h-5 w-5 text-gray-600" />}
                            </button>
                        </div>
                        <button onClick={submitPassword} className="bg-blue-600 text-white px-4 py-2 rounded">Change Password</button>
                    </div>
                </div>

                {/* Change Email */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-xl font-semibold mb-3">Change Email Address</h3>
                    <div className="space-y-3">
                        <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="New email" className="w-full p-2 border rounded" />
                        <div className="relative">
                            <input value={emailPassword} onChange={e => setEmailPassword(e.target.value)} type={showEmailPassword ? 'text' : 'password'} placeholder="Your password" className="w-full p-2 border rounded" />
                            <button type="button" onClick={() => setShowEmailPassword(s => !s)} aria-label={showEmailPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                                {showEmailPassword ? <FiEyeOff className="h-5 w-5 text-gray-600" /> : <FiEye className="h-5 w-5 text-gray-600" />}
                            </button>
                        </div>
                        <button onClick={submitChangeEmail} className="bg-blue-600 text-white px-4 py-2 rounded">Change Email Address</button>
                    </div>
                </div>

                {/* Delete Account */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-xl font-semibold mb-3">My Subscription</h3>
                    <p className="mb-3">Access Level: {usage?.plan}</p>
                    <button onClick={deleteAccount} className="bg-red-600 text-white px-4 py-2 rounded">Delete Account</button>
                </div>

                {/* Cancel Subscription (conditional) */}
                {usage?.payment && (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-xl font-semibold mb-3">Cancel Subscription</h3>
                        <button onClick={cancelSubscription} className="bg-yellow-600 text-white px-4 py-2 rounded">Cancel Subscription</button>
                    </div>
                )}
            </section>
        </main>
    )
}

export default Settings