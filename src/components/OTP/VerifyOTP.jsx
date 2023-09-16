import React from 'react'
import { useContext } from 'react';
import { useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';
import api from '../../util/api';
import { useNavigate } from 'react-router-dom';

const VerifyOTP = () => {

    const navigate = useNavigate();
    const [otp, setOTP] = useState(null);
    const { tempUser } = useContext(UserContext)

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (otp.length === 4) {
            try {
                const { data } = await api.post('/verifyOTP', { userId: tempUser.userId, otp })
                console.log('data: ', data);
                toast(`${data.message}`)
                setTimeout(() => {
                    navigate("/login")
                }, 3000);
            } catch (error) {
                console.log('Error: ', error);
                toast(error?.response?.data?.message)
            }
        }
    }

    const resendOTP = async (e) => {
        e.preventDefault();

        try {
            console.log('sending Data: ', tempUser);
            const { data } = await api.post('/resendOTPVerificationCode', { ...tempUser })
            toast(`${data.message}`)
            console.log('Response: ', data);
        } catch (error) {
            console.log('Error: ', error);
            toast(error?.response?.data?.message)
        }

    }

    return (
        <div className=' max-w-[1640px] mx-auto min-h-screen flex justify-center items-center'>
            <div className=''>
                <form onSubmit={handleSubmit} className='relative'>
                    <input type="text" onChange={(e) => setOTP(e.target.value)} className='h-10 rounded-md px-2 focus:border focus-within:border' placeholder='Enter Your OTP' />
                    <button type='submit' className=' bg-blue-500 h-10 px-3 rounded-tr-md rounded-br-md absolute right-0'>Verify</button>
                </form>
                <button onClick={resendOTP} className=' bg-gray-400 text-white h-10 px-5 rounded-md mt-4'>Resend OTP</button>
            </div>
        </div>
    )
}

export default VerifyOTP