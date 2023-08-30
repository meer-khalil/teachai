import React, { useContext, useEffect, useState } from 'react'
import Aside from './Aside'
import Users from './components/Users'
import AddPost from './components/AddPost'
import Posts from './components/Posts'
import { UserContext } from '../../../context/UserContext'
import { Route, Routes } from 'react-router-dom'

const AdminDashboard = () => {

    const { user, isAuthenticated, getAllUsers } = useContext(UserContext)

    useEffect(() => {
        getAllUsers()
    }, [])

    return (
        <div className=' max-w-[1440px] mx-auto'>
            {

                isAuthenticated ? (

                    (user?.role === 'admin') ? (
                        <div className="relative min-h-[80vh] overflow-hidden flex flex-col md:flex-row">

                            <Aside />

                            <main className="md:ml-60 mt-40 md:mt-0 max-h-screen overflow-auto flex-1">
                                <div className="px-2 md:px-6 py-8">
                                    <Routes>
                                        <Route index path='users' element={<Users />} />
                                        <Route path='post/new' element={<AddPost />} />
                                        <Route path='posts' element={<Posts />} />
                                    </Routes>
                                </div>
                            </main>
                        </div>
                    ) : (
                        <div>Loading</div>
                    )

                ) : (
                    <div>Loading</div>
                )
            }
        </div>
    )
}

export default AdminDashboard