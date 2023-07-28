import React, { useContext, useEffect, useState } from 'react'
import Aside from './Aside'
import Header from './Header'
import Users from './components/Users'
import AddPost from './components/AddPost'
import Posts from './components/Posts'
import { UserContext } from '../../../context/UserContext'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const AdminDashboard = () => {


    const [which, setWhich] = useState('users')

    const { user, isAuthenticated, getAllUsers, isLoggedin, isAdmin } = useContext(UserContext)


    useEffect(() => {
        isLoggedin()
        isAdmin()
        getAllUsers()
    }, [])

    return (
        <div className=' max-w-[1440px] mx-auto'>
            {

                isAuthenticated ? (

                    (user?.role === 'admin') ? (
                        <div className="relative min-h-[80vh] overflow-hidden flex flex-col md:flex-row">

                            {/* <Header /> */}
                            <Aside which={which} setWhich={setWhich} />

                            <main className="md:ml-60 mt-40 md:mt-0 max-h-screen overflow-auto flex-1">
                                <div className="px-2 md:px-6 py-8">
                                    {
                                        (which === 'users') && <Users />
                                    }
                                    {
                                        (which === 'addpost') && <AddPost setWhich={setWhich} />
                                    }
                                    {
                                        (which === 'allposts') && <Posts />
                                    }
                                </div>
                            </main>
                        </div>
                    ) : (
                        // <Navigate to="/login" />
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