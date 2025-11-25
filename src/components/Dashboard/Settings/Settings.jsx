import React, { useContext } from 'react'

import Profile from './components/Profile'
import ChangePassword from './components/ChangePassword'
import DeleteAccount from './components/DeleteAccount'
import CancelSubscription from './components/CancelSubscription'
import ChangeEmail from './components/ChangeEmail'
import TwoFA from './components/TwoFA'
import { UsageContext } from '../../../context/UsageContext'

const Settings = () => {
    const { usage } = useContext(UsageContext)

    return (
        <main className="w-full max-w-6xl mx-auto">
            <header className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Settings</h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">Manage your profile, security and subscription settings.</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <Profile />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <TwoFA />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <ChangePassword />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <ChangeEmail />
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <DeleteAccount />
                </div>

                {usage?.payment && (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <CancelSubscription />
                    </div>
                )}
            </section>
        </main>
    )
}

export default Settings