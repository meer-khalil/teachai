import React, { useContext, useEffect, useState } from 'react'
import Aside from './Aside'
import Dashboard from './components/Dashboard'
import ChatHistory from './history/ChatHistory'
import { UserContext } from '../../context/UserContext'
import { Route, Routes, useLocation } from 'react-router-dom'
import LessonPlanner from '../Chatbots/LessonPlanner/LessonPlanner'
import Quiz from '../Chatbots/Quiz/Quiz'
import Chatbots from './components/Chatbots'
import { ChatbotProvider } from '../../context/ChatbotContext'

const UserDashboard = () => {

    const { isAuthenticated, isLoggedin } = useContext(UserContext)


    useEffect(() => {
        isLoggedin()
    }, [])

    if (!isAuthenticated) return <div>Loading....</div>

    return (
        <ChatbotProvider>
            <div className=' max-w-[1640px] mx-auto'>
                <div className="relative overflow-hidden flex flex-col md:flex-row">

                    <div className="flex-[2] relative">
                        <Aside  />
                    </div>

                    <main className="mt-40 min-h-screen md:mt-0 overflow-auto flex-[10]">
                        <div className="px-2 md:px-6 pt-2">

                            <Routes>
                                <Route path='/' element={<Dashboard />} />
                                <Route path={`history/*`} element={<ChatHistory />} />
                                <Route path={`chatbots`} element={<Chatbots />} />
                                <Route path={`chatbot/lesson-planner`} element={<LessonPlanner />} />
                                <Route path={`chatbot/quiz`} element={<Quiz />} />
                            </Routes>

                        </div>
                    </main>
                </div>
            </div>
        </ChatbotProvider>
    )
}

export default UserDashboard