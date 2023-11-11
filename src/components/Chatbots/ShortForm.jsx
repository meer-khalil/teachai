import React from 'react'
import { useContext } from 'react';
import { useState } from 'react';
import { UsageContext } from '../../context/UsageContext';
import api from '../../util/api';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../context/ChatbotContext';
import { backend_url } from '../../util/variables';
import { useEffect } from 'react';

const ShortForm = ({ url, setLoading, realAnswer, setAnswer, chatID }) => {

    const [prompt, setPrompt] = useState('');

    const [currentAnswer, setCurrentAnswer] = useState('');

    const { fetchUsage } = useContext(UsageContext);
    const { language, videoUrl, quizRequest } = useContext(ChatbotContext);

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
        else if (url === '/quiz') {
            data = {
                body: {
                    ...quizRequest,
                    summary: prompt,
                    // grade: '',
                    // topic: '',
                    // subject: '',
                    // type: '',
                    // questionnumber: '',
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
                    prompt,
                    language
                },
                chat_id: chatID
            }
        }


        try {
            // let res = await api.post(`/chatbot${url}`, data);

            // if (res.statusText === 'OK') {

            //     console.log('Here is the answer: ', res.data.answer);

            //     setAnswer((prev) => ([...prev, { question: prompt, answer: res.data.answer }]))
            //     setPrompt('')
            //     setLoading(false)
            //     fetchUsage();
            // }
            const response = await fetch(`${backend_url}/chatbot${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("teachai_token")}`
                },
                body: JSON.stringify(data)
            });

            // Check if the response is successful (status code 200)
            if (response.status === 200) {
                const reader = response.body.getReader();

                setAnswer((prev) => ([...prev, { question: prompt, answer: '' }]))
                let answer = 'Wait a moment...<br />';

                const read = async () => {
                    const { done, value } = await reader.read();

                    if (done) {
                        // All data has been received
                        console.log('Stream finished');
                        answer = answer.replace(/Wait a moment...<br \/>/g, '');

                        setCurrentAnswer(answer)
                        fetchUsage();
                    } else {
                        // Process the received chunk
                        setLoading(false);
                        setPrompt('')
                        // receivedChunks.push(value);
                        let text = new TextDecoder().decode(value)
                        text = text.replace(/\n/g, '<br />');

                        if (text.includes('chat_id')) {
                            try {
                                // Attempt to parse the string as JSON
                                let jsonResult = JSON.parse(text);
                                // setChatID(jsonResult['chat_id'])

                                console.log("Parsed JSON:", jsonResult);
                            } catch (error) {
                                // If parsing fails, handle the error
                                console.error("Error parsing JSON:", error);
                            }
                        } else {
                            answer += text;
                        }

                        // console.log('Received chunk:', text);
                        setCurrentAnswer(answer)
                        // Call read() again to receive the next chunk
                        read();
                    }
                };

                read();
            } else {
                console.error('Error:', response.status, response.statusText);
                setLoading(false);
                toast('Something Wrong!')
                // Handle any errors from the request
            }
        } catch (error) {
            if (error?.response?.status === 429) {
                toast(error?.response?.data?.error)
            }
            console.log('Error: ', error);
            setLoading(false)
        }

    }


    useEffect(() => {
        let temp = [...realAnswer]
        temp[temp.length - 1].answer = currentAnswer;
        setAnswer(temp)
    }, [currentAnswer])
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