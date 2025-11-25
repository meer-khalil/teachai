import React, { useContext, useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'

import './Aside.css';
import { UserContext } from '../../context/UserContext';
import { UsageContext } from '../../context/UsageContext';

const IconChatbots = ({ className = 'text-lg mr-2' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className={className} viewBox="0 0 16 16">
        <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z" />
    </svg>
)

const IconCredits = ({ className = 'text-lg mr-2' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className={className} viewBox="0 0 16 16">
        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
    </svg>
)

const IconSettings = ({ className = 'text-lg mr-2' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className={className} viewBox="0 0 16 16">
        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
    </svg>
)

const IconLogout = ({ className = 'text-lg mr-2' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className={className} viewBox="0 0 16 16">
        <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
    </svg>
)

const Aside = ({ selectedCategory, setSelectedCategory }) => {

    const { logout } = useContext(UserContext)
    const { fetchUsage, usage, creditWidth, uploadBarWidth } = useContext(UsageContext)

    useEffect(() => {
        if (typeof fetchUsage === 'function') fetchUsage()
    }, [fetchUsage])

    // Dev-only logging if needed
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.debug('usage updated', usage)
        }
    }, [usage])

    const safeCreditWidth = useMemo(() => Math.max(0, Math.min(100, Math.round(Number(creditWidth) || 0))), [creditWidth])
    const safeUploadWidth = useMemo(() => Math.max(0, Math.min(100, Math.round(Number(uploadBarWidth) || 0))), [uploadBarWidth])

    return (
        <aside className="">
            <nav aria-label="Dashboard navigation">
                <ul className="space-y-2 md:space-y-4 grid grid-cols-1">
                    <li>
                        <NavLink to="/user/dashboard/chatbots" className={({ isActive }) => `flex rounded-xl font-bold text-sm py-3 px-4 ${isActive ? 'text-yellow-900' : 'text-gray-900'}`}>
                            <IconChatbots />
                            Chatbots
                        </NavLink>
                    </li>

                    <li>
                        <div className={`flex rounded-xl py-3 px-4`}>
                            <IconCredits />
                            <div className=' flex flex-col gap-1'>
                                <div className='font-bold text-sm text-yellow-900'>Credits</div>
                                <div>{usage?.plan ?? '—'} Plan</div>
                            </div>
                        </div>

                        <div className=' mx-4 mt-2'>
                            <div className="font-bold text-xs">Number of Chat Requests</div>

                            <div className=' h-3 border border-blue-400 rounded-full overflow-hidden' role="progressbar"
                                aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeCreditWidth}
                                aria-label={`Chat requests used ${usage?.usageCount ?? 0} of ${usage?.usageLimit ?? 0}`}>
                                <div className={`bg-blue-500 h-full`} style={{ width: `${safeCreditWidth}%` }}></div>
                            </div>

                            <div className=' text-blue-600 font-bold text-xs mt-2'>
                                {`${usage?.usageCount ?? 0} / ${usage?.usageLimit ?? 0}`}
                                <span className='ml-4'>[Today]</span>
                            </div>

                            <div className=' text-blue-600 font-bold text-xs mt-5'>
                                <div className='mb-1'>Number of Files Uploaded</div>
                                <div className=' mb-2 h-3 border border-blue-400 rounded-full overflow-hidden' role="progressbar"
                                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeUploadWidth}
                                    aria-label={`Files uploaded ${usage?.noOfFilesUploaded ?? 0} of ${usage?.noOfFilesUploadedLimit ?? 0}`}>
                                    <div className={`bg-blue-500 h-full`} style={{ width: `${safeUploadWidth}%` }}></div>
                                </div>
                                <div>{usage?.noOfFilesUploaded ?? 0} / {usage?.noOfFilesUploadedLimit ?? 0} Month</div>
                            </div>
                        </div>
                    </li>

                    <li>
                        <NavLink to="/user/dashboard/settings" className={({ isActive }) => `flex items-center rounded-xl font-bold text-sm py-3 px-4 ${isActive ? 'text-yellow-900' : 'text-gray-900'}`}>
                            <IconSettings />
                            Settings
                        </NavLink>
                    </li>

                    <li>
                        <button type="button" onClick={logout} className={`flex items-center rounded-xl font-bold text-sm text-yellow-900 py-3 px-4`}>
                            <IconLogout />
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}

Aside.propTypes = {
    selectedCategory: PropTypes.string,
    setSelectedCategory: PropTypes.func,
}

export default React.memo(Aside)