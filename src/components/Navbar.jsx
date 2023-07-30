import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'


import logo from '../images/logo.png'
import Menu from './SVGs/Menu';
import Cross from './SVGs/Cross';
import { UserContext } from '../context/UserContext';

import { site } from '../util/variables';

const Navbar = () => {


    const { isAuthenticated, user, logout } = useContext(UserContext)

    const width = window.innerWidth
    const [menu, setMenu] = useState((width > 680) ? true : false)

    const handleClick = () => {

        setMenu(!menu)
    }
    return (
        <div className=''>
            <header className='flex justify-between pt-5 pb-5 px-4 md:px-8 items-center  relative max-w-[1440px] mx-auto'>
                <Link to='/'>
                    {/* <div className='text-3xl ml-8 tracking-wider'>Khalil Ahmad</div> */}
                    <img src={logo} className='h-8 ' alt="logo" />
                </Link>
                <div className='flex gap-14 items-center'>
                    {
                        menu && (
                            <div className={`absolute md:static right-0 top-[5rem] w-full h-screen md:h-auto z-10 bg-gray-400 md:bg-transparent flex flex-col gap-20`}>
                                <ul
                                    className=' md:bg-transparent text-white md:text-secondary pt-10 md:pt-3 md:pb-3 rounded flex flex-col md:flex-row gap-3 md:gap-5'>
                                    {
                                        [
                                            { text: 'AI Teachers', url: '/teachers' },
                                            { text: 'Blogs', url: '/blogs' },
                                            { text: 'Pricing', url: '/pricing' },
                                        ].map((el, i) => (
                                            <Link
                                                to={(site ? site : '') + el.url}
                                                className=' tracking-wide hover:text-primary'
                                                onClick={() => {
                                                    if (window.innerWidth < 680) {
                                                        setMenu(false)
                                                    }
                                                }}
                                                key={i}
                                            >
                                                <p className='pl-5 text-2xl md:text-lg'>
                                                    {el.text}
                                                </p>
                                            </Link>
                                        ))
                                    }
                                    {
                                        (isAuthenticated && user?.role === 'admin') ? (
                                            <Link
                                                to={(site ? site : '') + '/admin/dashboard'}
                                                className='text-md block tracking-wide hover:text-primary'
                                                onClick={() => {
                                                    if (window.innerWidth < 680) {
                                                        setMenu(false)
                                                    }
                                                }}

                                            >
                                                <p className='pl-5 text-2xl md:text-lg'>
                                                    Dashboard
                                                </p>
                                            </Link>
                                        ) : (isAuthenticated) && (
                                            <Link
                                                to={(site ? site : '') + '/user/dashboard'}
                                                className='text-md block tracking-wide hover:text-primary'
                                                onClick={() => {
                                                    if (window.innerWidth < 680) {
                                                        setMenu(false)
                                                    }
                                                }}

                                            >
                                                <p className='pl-5 text-2xl md:text-lg'>
                                                    Dashboard
                                                </p>
                                            </Link>
                                        )
                                    }
                                    {
                                        !isAuthenticated ? (
                                            <Link
                                                to={(site ? site : '') + '/login'}
                                                className=' text-2xl md:text-lg block md:hidden tracking-wide hover:text-primary'
                                                onClick={() => setMenu(false)}

                                            >
                                                <p className='pl-5'>
                                                    Login
                                                </p>
                                            </Link>
                                        ) : (
                                            <Link
                                                to={(site ? site : '') + '/login'}
                                                className='text-md block md:hidden tracking-wide hover:text-primary'
                                                onClick={() => { setMenu(false); logout(); }}

                                            >
                                                <p className='pl-5 text-2xl md:text-lg'>
                                                    Logout
                                                </p>
                                            </Link>
                                        )
                                    }
                                </ul>
                                {
                                    (window.innerWidth < 680) && <div className=' py-10 mx-5 flex flex-col gap-5'>
                                        <button className=' bg-secondary text-white py-5 mx-12 rounded-lg'>
                                            Get started for free
                                        </button>
                                        <button className=' border-secondary  text-secondary border-2 py-5 mx-12 rounded-lg'>
                                            what how it works
                                        </button>
                                    </div>
                                }
                            </div>
                        )
                    }
                </div>
                <div className='hidden md:flex items-center gap-5'>
                    {
                        !isAuthenticated ? (
                            <Link to='/login'>
                                <button className='text-lg opacity-75'>Login</button>
                            </Link>
                        ) : (
                            <button className='text-lg opacity-75' onClick={logout}>Logout</button>
                        )
                    }
                    <button className='px-3 py-1 rounded-md border-2 text-white bg-[#ed7742]'>
                        Start my free trial
                    </button>
                </div>
                <div className='block md:hidden cursor-pointer' onClick={handleClick}>
                    {
                        !menu ? <Menu /> : <Cross />
                    }
                </div>
            </header>
        </div>
    )
}

export default Navbar