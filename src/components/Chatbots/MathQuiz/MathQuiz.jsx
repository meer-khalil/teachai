import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'


import Header from '../Header'
import ExportButtons from '../ExportButtons';


import _5_MathsQuiz from '../../../images/bots/5.Maths Quiz - Matthew.png'
import AnswerAndHistory from '../AnswerAndHistory';
import Categories from '../../Dashboard/history/Categories';


const MathQuiz = () => {

    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')

    const componentRef = useRef(null);


    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories selectedCategory={'Student Engagement & Activity Ideas'} />
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

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default MathQuiz