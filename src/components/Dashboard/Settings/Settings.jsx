import React from 'react'

import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import DeleteAccount from './components/DeleteAccount';
import ChangeEmail from './components/ChangeEmail';
import TwoFA from './components/TwoFA';

const Settings = () => {
    return (
        <div>
            <div className=' grid grid-cols-1 md:grid-cols-2 gap-5'>
                <Profile />
                <TwoFA />
                <ChangePassword />
                <ChangeEmail />
                <DeleteAccount />
            </div>
        </div>
    )
}

export default Settings