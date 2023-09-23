import React, { useContext, useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Loading from './Loading'
import Header from '../Header'
import api from '../../../util/api';
import Answer from '../Answer';
import ShortForm from './ShortForm';
import ExamplePrompts from '../ExamplePrompts';
import ExportButtons from '../ExportButtons';


import _5_MathsQuiz from '../../../images/bots/5.Maths Quiz - Matthew.png'
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import AnswerAndHistory from '../AnswerAndHistory';


const MathQuiz = () => {

    const [answer, setAnswer] = useState([])
    const [prompt, setPrompt] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [chatID, setChatID] = useState('')

    const componentRef = useRef(null);


    return (
        <div className='border-b-2 border-black pb-24'>
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
                        setMessage={setMessage}
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
                />
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default MathQuiz