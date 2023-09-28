import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Header from '../Header'
import ExportButtons from '../ExportButtons';

import _3_AutomatedEssay from '../../../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'
import AnswerAndHistory from '../AnswerAndHistory';
import Categories from '../../Dashboard/history/Categories';


const Essay = () => {

    const componentRef = useRef(null)

    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')


    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories selectedCategory={'Assessment & Progress Monitoring'} />
            </div>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Elsa'}
                        image={_3_AutomatedEssay}
                        heading={'Essay Grading'}
                        desc={'Let me provide you with assistance for your essay grading tasks.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    url={'/gradeEssay'}
                    answer={answer}
                    setAnswer={setAnswer}
                    componentRef={componentRef}
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                    chatbot="Essay Grading"
                    dontFollow={true}
                />
            </div>

            {/* <ExportButtons componentToPrint={componentRef} answer={answer} /> */}
            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default Essay