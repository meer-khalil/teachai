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


const MathQuiz = () => {

    const [answer, setAnswer] = useState([])
    const [prompt, setPrompt] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [chatID, setChatID] = useState('')

    const reportTemplateRef = useRef(null);


    const { fetchUsage } = useContext(UsageContext);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        let data = {
            body: {
                prompt
            },
            chat_id: chatID
        }


        try {
            let res = await api.post(`/mathquiz/gen`, data);

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer([...answer, { question: prompt, answer: res.data.answer }])
                setPrompt('')
                setLoading(false)
                fetchUsage();
            }
        } catch (error) {
            console.log("error: ", error?.response?.data);
            alert('Error While fetching response for LessonPlanner!')
            setLoading(false)
        }

    }

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

                <div className='max-h-[100vh] pb-5 flex flex-1 gap-3'>
                    <div className={`flex-[2] ${answer.length > 0 ? 'border-r border-black' : ''}`}>
                        <div className=' border-b-2 flex gap-3'>
                            <button className=' bg-slate-300 px-4 py-2'>Output</button>
                            <button className=' px-4 py-2'>History</button>
                        </div>
                        {
                            (answer.length > 0) ? (
                                <div>
                                    <div className='relative'>

                                        <Answer reportTemplateRef={reportTemplateRef} answer={answer} />
                                        {loading && <Loading />}

                                    </div>

                                    <ShortForm
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        handleSubmit={handleSubmit}
                                    />
                                </div>
                            )
                                : (
                                    <div className=' flex justify-center items-center w-full h-full relative'>
                                        <p>Try variaty of inputs and input lengths to get the best results</p>
                                        {
                                            loading && <Loading message={message} />
                                        }
                                    </div>
                                )

                        }
                    </div>

                    {(answer.length > 0) && <ExamplePrompts />}

                </div>
            </div>

            <ExportButtons />
        </div>
    )
}

export default MathQuiz