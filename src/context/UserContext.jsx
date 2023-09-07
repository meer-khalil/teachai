import axios from 'axios';
import React, { createContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backend_url } from '../util/variables';
import api from '../util/api';
import { toast } from 'react-toastify';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const [pdfAnswer, setPdfAnswer] = useState([])
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const [categoryOpen, setCategoryOpen] = useState('')

    const login = async (credentials) => {
        try {
            const { data } = await axios.post((backend_url ? backend_url : '') + '/login', credentials);

            console.log('Here is the data for User: ', data);
            const { token, user } = data;

            localStorage.setItem("teachai_token", token)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAuthenticated(true)
            setUser(user);

            toast("LoggedIn Successfully")

            if (user.role === 'admin') {

                navigate('/admin/dashboard/users')
            } else {

                navigate('/user/dashboard/chatbots')
            }

        } catch (error) {
            console.error('Failed to Login:', error.message);
            toast("Email or Password is Wrong!")
        }
    };

    const register = async (data) => {
        try {
            const res = await axios.post((backend_url ? backend_url : '') + '/register', data);

            console.log('User registered successfully:', res.data);

            if (res.data.success) {
                localStorage.setItem('("teachai_token', res.data.token);
                api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setIsAuthenticated(true)
                setUser(res.data);
                navigate('/')
            }
        } catch (error) {
            if (error.response.status) {
                toast("Email is Already Used!")
                // toast("Use Another Email! Thank You!")
            }
            console.log("Error", error.response.status);
            console.error('Failed to register user:', error?.response.data);
        }
    };

    const logout = async () => {

        try {

            const res = await api.get("/logout");


            console.log('User Logout successfully:', res);

            if (res.data.success) {
                delete api.defaults.headers.common['Authorization'];
                localStorage.removeItem("teachai_token")
                localStorage.removeItem("teachai_user")
                setIsAuthenticated(false)
                setUser(null);
                toast('Logout Successfuly!')
                navigate('/')
            } else {
                navigate('/')
            }
        } catch (error) {
            console.error('Failed To Logout:', error.message);
            navigate('/signup')
        }
    };

    const isLoggedin = () => {
        // Check if the token exists in local storage
        const storedToken = localStorage.getItem('teachai_token');
        const user = localStorage.getItem('teachai_user')

        if (storedToken) {
            // Use the stored token for authentication
            console.log('Token is stored');
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            console.log('\n\n\nToken: ', storedToken);
            setIsAuthenticated(true)

            if (user) {
                setUser(JSON.parse(user))
            } else {
                getUserData()
            }
        }
        else {
            if (!location.pathname === '/') {
                navigate('/login')
            }
        }

    }


    const getUserData = async () => {
        try {

            const { data } = await api.get((backend_url ? backend_url : '') + '/me');

            const { user } = data
            setUser(user);
            localStorage.setItem('teachai_user', JSON.stringify(user))


        } catch (error) {
            console.error('Failed to Get User Data:', error.message);
        }
    }

    const getAllUsers = () => {

        api.get((backend_url ? backend_url : '') + '/admin/users')
            .then(({ data }) => {
                // Handle the response data
                const { users } = data
                setUsers(users)
                console.log('Users:', users);
            })
            .catch((error) => {
                console.error('Error retrieving users:', error);
            });

    }

    return (
        <UserContext.Provider value={{
            user,
            login,
            register,
            logout,
            isLoggedin,
            isAuthenticated,
            getUserData,
            users,
            getAllUsers,
            categoryOpen,
            setCategoryOpen,
            pdfAnswer,
            setPdfAnswer
        }}>
            {children}
        </UserContext.Provider>
    );
};