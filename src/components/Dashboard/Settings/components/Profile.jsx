import React from 'react'

import Layout from '../Layout';
import { toast } from 'react-toastify';
import { useContext } from 'react';
import { UserContext } from '../../../../context/UserContext';
import { useEffect } from 'react';
import { useState } from 'react';
import api from '../../../../util/api';

const Profile = () => {

  const [userData, setUserData] = useState({});

  const { user, getUserData } = useContext(UserContext);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      console.log('request_data: ', userData);
      const { data } = await api.put('/me', userData);
      getUserData()
      toast("User Detail Updated Successfully");
    } catch (error) {
      console.log("Error: ", error);
      toast("Error While Updating User Detail")
    }
  }

  useEffect(() => {
    setUserData({
      firstName: user?.firstName,
      lastName: user?.lastName,
      country: user?.country,
      emailUpdate: user?.emailUpdate
    })
  }, [])

  return (
    <Layout heading="My Details">
      <div>
        <form class="w-full max-w-lg" onSubmit={handleSubmit}>
          <div class="flex flex-wrap -mx-3 mb-6">

            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-first-name">
                First Name
              </label>
              <input
                onChange={handleChange}
                name='firstName'
                value={userData?.firstName}
                class="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="text" placeholder="Jane" />
              {/* <p class="text-red-500 text-xs italic">Please fill out this field.</p> */}
            </div>

            <div class="w-full md:w-1/2 px-3">
              <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-last-name">
                Last Name
              </label>
              <input
                onChange={handleChange}
                name='lastName'
                value={userData?.lastName}
                class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-last-name" type="text" placeholder="Doe" />
            </div>
          </div>

          <div class="flex flex-wrap -mx-3 mb-2">
            {/* <div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-city">
                City
              </label>
              <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-city" type="text" placeholder="Albuquerque" />
            </div> */}

            <div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
              <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-state">
                Country
              </label>
              <div class="relative">
                <select
                  onChange={handleChange}
                  name='country'
                  value={userData?.country}
                  class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-state">
                  <option>New Mexico</option>
                  <option>Missouri</option>
                  <option>Texas</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full flex gap-2 items-center md:w-1/3 mb-6 md:mb-0 mt-3">
            <input name='emailUpdate' onChange={(e) => setUserData((prev) => ({ ...prev, [e.target.name]: !userData.emailUpdate }))} className=' w-3 h-3' type="checkbox" checked={userData?.emailUpdate ? true : false} id='email-update' />
            <label class=" text-sm font-bold" for="email-update">
              Zip
            </label>
            {/* <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-zip" type="checkbox" placeholder="90210" /> */}
          </div>

          <button className=' bg-blue-600 py-3 px-5 rounded text-white mt-4' type='submit'>Update Details</button>
        </form>
      </div>
    </Layout>
  )
}

export default Profile