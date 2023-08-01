import axios from 'axios';
import React, { createContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backend_url } from '../util/variables';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const [categoryOpen, setCategoryOpen] = useState('')

    const login = async (user) => {
        try {
            const res = await axios.post((backend_url ? backend_url : '') + '/login', user);

            console.log('User Loggedin successfully:', res.data);

            if (res.data.success) {
                localStorage.setItem("teachai_token", res.data.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setIsAuthenticated(true)
                setUser(res.data);
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to register user:', error?.response?.data);
        }
    };

    const register = async (data) => {
        try {
            const res = await axios.post((backend_url ? backend_url : '') + '/register', data);

            console.log('User registered successfully:', res.data);

            if (res.data.success) {
                localStorage.setItem('("teachai_token', res.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setIsAuthenticated(true)
                setUser(res.data);
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to register user:', error?.response.data);
        }
    };

    const logout = async () => {

        try {

            const res = await axios.get((backend_url ? backend_url : '') + "/logout");


            console.log('User Logout successfully:', res);

            if (res.data.success) {
                localStorage.removeItem("teachai_token")
                setIsAuthenticated(false)
                setUser(null);
                navigate('/')
            } else {
                navigate('/')
            }
        } catch (error) {
            console.error('Failed to register user:', error);
            navigate('/signup')
        }
    };

    const isLoggedin = () => {
        // Check if the token exists in local storage
        const storedToken = localStorage.getItem('teachai_token');

        if (storedToken) {
            // Use the stored token for authentication
            console.log('Token is stored');
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setIsAuthenticated(true)
            getUserData()
        } else {
            if (!location.pathname === '/') {
                navigate('/login')
            }
        }

    }

    const isAdmin = async () => {
        await isLoggedin()
        setTimeout(() => {
            if (!(user?.role === 'admin')) {
                navigate("/")
            }
        }, 4000)
    }

    const getUserData = async () => {
        try {
            const res = await axios.get((backend_url ? backend_url : '') + '/me');

            console.log('UserData retrieved successfully:', res.data);

            if (res.data.success) {
                setUser(res.data.user);
            }
        } catch (error) {
            console.error('Failed to register user:', error);
        }
    }

    const getAllUsers = () => {

        axios.get((backend_url ? backend_url : '') + '/admin/users')
            .then((response) => {
                // Handle the response data
                const users = response.data.users;
                setUsers(users)
                console.log('Users:', users);
            })
            .catch((error) => {
                // Handle the error
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
            isAdmin,
            categoryOpen,
            setCategoryOpen
        }}>
            {children}
        </UserContext.Provider>
    );
};