import React from 'react'
import { useContext } from 'react';
import { useState } from 'react';
import { UsageContext } from '../../context/UsageContext';
import api from '../../util/api';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../context/ChatbotContext';

const ShortForm = ({ url, setLoading, setAnswer, chatID }) => {

    const [prompt, setPrompt] = useState('');


    const { fetchUsage } = useContext(UsageContext)
    const { language, videoUrl } = useContext(ChatbotContext)
    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        let data = {}
        if (url === '/mathquiz/gen') {
            data = {
                body: {
                    mathproblem: prompt,
                    type: '',
                    language: language
                },
                chat_id: chatID
            }
        }
        else if (url === '/video/chat') {
            data = {
                body: {
                    url: videoUrl,
                    videoChatPrompt: prompt,
                    language: language
                },
                chat_id: chatID
            }
        }
        else {
            data = {
                body: {
                    prompt
                },
                chat_id: chatID
            }
        }


        try {
            let res = await api.post(`/chatbot${url}`, data);

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer((prev) => ([...prev, { question: prompt, answer: res.data.answer }]))
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
        <form
            onSubmit={handleSubmit}
            className='flex gap-4 mt-10'
        >
            <input
                type="text"
                className='w-full px-3 h-10'
                name='prompt'
                placeholder='Write your prompt...'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)} />
            <button
                className='px-3 py-1 rounded-md border-2 text-white bg-[#ed7742]'
                disabled={prompt ? false : true}
            >
                Submit
            </button>
        </form>
    )
}

export default ShortForm