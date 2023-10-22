import React, { useEffect, useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../../context/ChatbotContext';


const ChatForm = ({ setAnswer, setLoading, setChatID }) => {

    const [data, setData] = useState({})

    const { fetchUsage } = useContext(UsageContext);
    const { setLanguage, language, setQuizRequest } = useContext(ChatbotContext);


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true)
        setQuizRequest(data);
        let _body = {
            body: data
        }

        try {
            let res = await api.post(`/chatbot/quiz`, _body)

            if (res.statusText === 'OK') {

                console.log('Response from chatform: ', res);
                console.log('Here is the answer: ', res.data.answer);
                setChatID(res.data.chat_id)
                setAnswer([{ answer: res.data.answer }])
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

    const handleChange = (e) => {

        const { name, value } = e.target

        setData({
            ...data,
            [name]: value
        })
    }

    useEffect(() => {
        setData((prev) => ({ ...prev, language }))
    }, [])

    useEffect(() => {

        return () => {
            setQuizRequest({})
        }
    }, [])

    return (
        <div className='mr-4'>
            <form onSubmit={handleSubmit} className='mt-10'>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="gradeLevel" className='font-medium'>
                        Grade Level
                    </label>
                    <input
                        type="text"
                        id='grade'
                        name='grade'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="topic" className='font-medium'>
                        Quiz Topic
                    </label>
                    <input
                        type="text"
                        id='topic'
                        placeholder='Type here'
                        name='topic'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>


                <div className='flex flex-col mb-5'>
                    <label htmlFor="subject" className='font-medium'>
                        Subject
                    </label>
                    <input
                        type="text"
                        id='subject'
                        name='subject'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="summary" className='font-medium'>
                        Short Summary Learning Objectives
                    </label>
                    <textarea
                        id='summary'
                        name='summary'
                        onChange={handleChange}
                        className='px-2 h-28 rounded-md border  bg-white outline-none'
                    ></textarea>
                </div>


                <div className='flex flex-col mb-5'>
                    <label htmlFor="type" className='font-medium'>
                        Quiz Type (Eg: multiple choice, true or false & short answer)
                    </label>
                    <input
                        type="text"
                        id='type'
                        name='type'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="questionnumber" className='font-medium'>
                        Number of Questions
                    </label>
                    <input
                        type="text"
                        id='questionnumber'
                        name='questionnumber'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>
                <div className='flex flex-col mb-5'>
                    <label htmlFor="language" className='font-medium'>
                        Language
                    </label>
                    <input
                        type="text"
                        id='language'
                        name='language'
                        placeholder='English'
                        value={data?.language}
                        onChange={(e) => {
                            handleChange(e);
                            setLanguage(e.target.value)
                        }}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>
                <div>
                    <button className='px-5 py-2 rounded-lg bg-secondary text-white'>submit</button>
                </div>
            </form>
        </div>
    )
}

export default ChatForm