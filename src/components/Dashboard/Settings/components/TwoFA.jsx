import React from 'react'
import Layout from '../Layout';


const TwoFA = () => {

  const handleTwoFA = () => {
    console.log('change 2fa');
  }

  return (
    <Layout heading="Secure Your Account">
      <div>
        <p className="text-xl font-['Poppins']">Two-factor authentication adds an extra layer of security to your account. To log in, in addition you'll need to provide a 6 digit code.</p>

        <div className="flex gap-5">
          <button onClick={handleTwoFA} className=' bg-blue-600 py-3 px-5 rounded text-white mt-4' type='submit'> Enable 2FA</button>
          <button onClick={handleTwoFA} className=' border-2 border-blue-600 py-3 px-5 rounded mt-4' type='submit'>Yes</button>
          <button onClick={handleTwoFA} className=' border-2 border-blue-600 py-3 px-5 rounded mt-4' type='submit'>No</button>
        </div>
      </div>
    </Layout>
  )
}

export default TwoFA