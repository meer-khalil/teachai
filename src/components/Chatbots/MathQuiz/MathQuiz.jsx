import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'


import Header from '../Header'
import ExportButtons from '../ExportButtons';


import _5_MathsQuiz from '../../../images/bots/5.Maths Quiz - Matthew.png'
import AnswerAndHistory from '../AnswerAndHistory';

import { useEffect } from 'react';
import { ChatbotContext } from '../../../context/ChatbotContext';
import { useContext } from 'react';
import Categories from '../../Dashboard/components/Categories';
import { toast } from 'react-toastify';
import { UsageContext } from '../../../context/UsageContext';
import api from '../../../util/api';


const MathQuiz = () => {

    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')

    const componentRef = useRef(null);


    const { language, setSelectedCategory, setLanguage } = useContext(ChatbotContext)
    const { fetchUsage } = useContext(UsageContext);

    useEffect(() => {
        setSelectedCategory('Student Engagement & Activity Ideas');

        return () => {
            setLanguage('English')
        }

    }, [])

    const getAnswers = async () => {

        setLoading(true)
        let _body = {
            body: {
                language: language || 'English'
            },
            chat_id: chatID
        }

        try {

            let res = await api.post(`/chatbot/mathquiz/answer`, _body)

            if (res.statusText === 'OK') {

                console.log('Response from chatform: ', res);
                console.log('Here is the answer: ', res.data.answer);
                setAnswer((prev) => [...prev, { question: "Answers", answer: res.data.answer }])
                setLoading(false)
                fetchUsage()
            }
        } catch (error) {

            if (error?.response?.status === 429) {
                toast(error?.response?.data?.error)
            }
            console.log('Error: ', error);
            setLoading(false)

        }

    }
    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories />
            </div>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Matthew'}
                        image={_5_MathsQuiz}
                        heading={'Maths Quiz'}
                        desc={'Allow me to assist you in creating math quizzes that meet your requirements.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    url={'/mathquiz/gen'}
                    answer={answer}
                    setAnswer={setAnswer}
                    componentRef={componentRef}
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                    chatbot="Math Quiz Generator"
                    examplePrompts={[
                        "Can you provide me with the correct answers to the quiz?",
                        "Can you increase the difficulty level of the quiz?",
                        "I want to track individual student performance on this quiz?",
                        "Are there any resources or study materials available to help students prepare for this quiz?"
                    ]}
                />
            </div>

            <div className=' flex gap-4 justify-end items-center'>
                {/* {
                    answer?.length > 0 && (
                        <div>
                            <button onClick={getAnswers} className='px-6 py-3 rounded-md border-2 text-white bg-[#ed7742]'>
                                Reveal Answers
                            </button>
                        </div>
                    )
                } */}
                <ExportButtons componentToPrint={componentRef} answer={answer} />
            </div>

        </div>
    )
}

export default MathQuiz