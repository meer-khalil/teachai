import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'
import Header from '../Header'
import ExportButtons from '../ExportButtons';


import _6_MathLessonPlanner from '../../../images/bots/6.Math Lesson Planner - Lucy.png'
import AnswerAndHistory from '../AnswerAndHistory';

const MathLessonPlanner = () => {


    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')


    const componentRef = useRef(null);


    return (
        <div className='border-b-2 border-black pb-24'>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Lucy'}
                        image={_6_MathLessonPlanner}
                        heading={'Math Lesson Planner'}
                        desc={'Allow me to aid you in designing well-structured math lessons that align with your goals and requirements.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    url={'/math/lesson'}
                    answer={answer}
                    setAnswer={setAnswer}
                    componentRef={componentRef}
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                    chatbot="Math Lesson Planner"            
                />
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />


        </div>
    )
}

export default MathLessonPlanner