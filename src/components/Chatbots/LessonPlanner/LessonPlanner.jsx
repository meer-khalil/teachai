import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Header from '../Header'
import ExportButtons from '../ExportButtons';



import _1_LessonPlanning from '../../../images/bots/1.Lesson Planning - Lisa.png'
import AnswerAndHistory from '../AnswerAndHistory';
import Categories from '../../Dashboard/history/Categories';

const LessonPlanner = () => {

    const componentRef = useRef(null)


    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')

    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories selectedCategory={'Lesson Planning'}/>
            </div>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Lisa'}
                        heading={'General Lesson Planner'}
                        desc={'Let me provide you with assistance for your lesson planning needs.'}
                        image={_1_LessonPlanning}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    answer={answer}
                    setAnswer={setAnswer}
                    componentRef={componentRef}
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                    url={'/lessonplanner'}
                    chatbot="Lesson Planning"
                />
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default LessonPlanner