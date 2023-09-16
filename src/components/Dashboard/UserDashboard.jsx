import React, { useContext, useEffect, useState } from 'react'
import Aside from './Aside'
import ChatHistory from './history/ChatHistory'
import { UserContext } from '../../context/UserContext'
import { Route, Routes, useLocation } from 'react-router-dom'
import Chatbots from './components/Chatbots'
import { ChatbotProvider } from '../../context/ChatbotContext'


import LessonPlanner from '../Chatbots/LessonPlanner/LessonPlanner'
import Quiz from '../Chatbots/Quiz/Quiz'
import Essay from '../Chatbots/Essay/Essay'
import LessonComprehension from '../Chatbots/LessonComprehension/LessonComprehension'
import MathQuiz from '../Chatbots/MathQuiz/MathQuiz'
import MathLessonPlanner from '../Chatbots/MathLessonPlanner/MathLessonPlanner'
import VideoToNotes from '../Chatbots/VideoToNotes/VideoToNotes'
import VideoToQuiz from '../Chatbots/VideoToQuiz/VideoToQuiz'
import { UsageProvider } from '../../context/UsageContext'
import DetectAI from '../Chatbots/DetectAI/DetectAI'
import PowerPoint from '../Chatbots/PowerPoint/PowerPoint'

const UserDashboard = () => {

    const { isAuthenticated, user } = useContext(UserContext)

    if (!isAuthenticated) return <div>Loading....</div>

    if (!(user?.verified)) {
        return (
            <h1>Please Verify Your Account!</h1>
        )
    }

    return (
        <UsageProvider>
            <ChatbotProvider>
                <div className=' max-w-[1640px] mx-auto'>
                    <div className="relative overflow-hidden flex flex-col md:flex-row">

                        <div className="flex-[2] relative mt-52">
                            <Aside />
                        </div>

                        <main className="mt-40 min-h-screen md:mt-0 overflow-auto flex-[10]">
                            <div className="px-2 md:px-6 pt-2">

                                <Routes>


                                    <Route path={`history/*`} element={<ChatHistory />} />

                                    <Route path={`chatbots`} element={<Chatbots />} />

                                    <Route path={`chatbot/lesson-planner`} element={<LessonPlanner />} />

                                    <Route path={`chatbot/quiz`} element={<Quiz />} />

                                    <Route path={`chatbot/essay`} element={<Essay />} />

                                    <Route path={`chatbot/lessonComp`} element={<LessonComprehension />} />

                                    <Route path={`chatbot/mathquiz`} element={<MathQuiz />} />

                                    <Route path={`chatbot/math-lesson-planner`} element={<MathLessonPlanner />} />

                                    <Route path={`chatbot/video-summarize`} element={<VideoToNotes />} />

                                    <Route path={`chatbot/video-to-quiz`} element={<VideoToQuiz />} />

                                    <Route path={`chatbot/detect-ai`} element={<DetectAI />} />

                                    <Route path={`chatbot/powerpoint-presentation`} element={<PowerPoint />} />
                                    

                                </Routes>

                            </div>
                        </main>
                    </div>
                </div>
            </ChatbotProvider>
        </UsageProvider>
    )
}

export default UserDashboard