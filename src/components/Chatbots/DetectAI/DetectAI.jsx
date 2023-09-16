import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Loading from './Loading'
import Header from '../Header'
import api from '../../../util/api';
import Answer from '../Answer';
import ShortForm from './ShortForm';
import ExamplePrompts from '../ExamplePrompts';
import ExportButtons from './ExportButtons';

import _3_AutomatedEssay from '../../../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import DonutChart from '../../Donut/DonutChart';


const DetectAI = () => {


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
            let res = await api.post(`/chatbot/detectai`, data);

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer([...answer, { question: prompt, answer: res.data.answer }])
                setPrompt('')
                setLoading(false)
                fetchUsage();
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
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Elsa'}
                        image={_3_AutomatedEssay}
                        heading={'Detect AI-Writing & Plagiarism'}
                        desc={'Let me provide you with assistance for your essay grading tasks.'}
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
                                        {
                                            answer &&
                                            <div className=' w-44 h-44 right-3 top-1 absolute'>
                                                <div className='flex gap-2'>
                                                    <div className=' h-5 w-5 bg-red-600'></div>
                                                    <span>Detect AI Percentage</span>
                                                </div>
                                                <DonutChart data={
                                                    [
                                                        { label: 'Detect AI', percentage: 100 - (answer[0].answer.match(/\d+/g)).map(Number)[0] },
                                                        { label: 'Plagiarism', percentage: (answer[0].answer.match(/\d+/g)).map(Number)[0] },
                                                    ]
                                                } />
                                            </div>
                                        }
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

export default DetectAI