import React, { useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';


const ChatForm = ({ setAnswer, setLoading, setChatID }) => {

    const [data, setData] = useState({})

    const { fetchUsage } = useContext(UsageContext);


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true)
        let _body = {
            body: data
        }

        try {
            let res = await api.post(`/chatbot/lessonComp/questions`, _body)

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
    return (
        <div className='mr-4'>
            <form onSubmit={handleSubmit} className='mt-10'>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="writeUp" className='font-medium'>
                        Comprehension Text
                    </label>
                    <textarea
                        id='writeUp'
                        name='writeup'
                        rows="4"
                        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add comprehension text here"
                        onChange={handleChange}
                    >
                    </textarea>
                    {/* <input
                        type="text"
                        id='writeUp'
                        name='writeup'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    /> */}
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="question" className='font-medium'>
                        Question Type (Eg 1. multiple choice 2. true or false etc)

                    </label>
                    <input
                        type="text"
                        id='question'
                        placeholder='Type here'
                        name='qtype'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>


                <div className='flex flex-col mb-5'>
                    <label htmlFor="qnumber" className='font-medium'>
                        Number of Questions
                    </label>
                    <input
                        type="text"
                        id='qnumber'
                        name='qnumber'
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
                        onChange={handleChange}
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