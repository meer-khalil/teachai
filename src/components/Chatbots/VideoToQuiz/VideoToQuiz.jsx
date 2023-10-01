import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Header from '../Header'
import ExportButtons from '../ExportButtons';

import _8_VideotoQuizBot from '../../../images/bots/8. Video to Quiz Bot.png'
import AnswerAndHistory from '../AnswerAndHistory';

import { useContext } from 'react';
import { ChatbotContext } from '../../../context/ChatbotContext';
import { useEffect } from 'react';
import Categories from '../../Dashboard/components/Categories';

const VideoToQuiz = () => {


    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')

    const componentRef = useRef(null);

    const { setSelectedCategory } = useContext(ChatbotContext)
    useEffect(() => {
        setSelectedCategory('Digital Learning & Teaching Tools')
    }, [])

    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories />
            </div>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Hunter'}
                        image={_8_VideotoQuizBot}
                        heading={'Video To Quiz'}
                        desc={'Allow me to help you craft interactive quizzes from videos, enhancing engagement and learning experiences effortlessly.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    url={'/video/chat'}
                    answer={answer}
                    setAnswer={setAnswer}
                    componentRef={componentRef}
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                    chatbot="Video To Quiz"
                    examplePrompts={[
                        "The quiz was quite challenging. Could you provide explanations for the answers to help me understand where I went wrong?",
                        "Based on the summary, it seems like the video touched on several complex topics. Could you generate a few more quiz questions to help me test my understanding?",
                        "The quiz questions were thought-provoking! Could you generate a few more questions that focus on the practical applications or real-world implications of the concepts discussed in the video?",
                        "I found the quiz challenging but enjoyable. Can you generate a summary of the correct answers and provide some additional insights or explanations for each question?"
                    ]}
                />
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default VideoToQuiz