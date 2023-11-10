import axios from 'axios';
import React, { useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../../context/ChatbotContext';
import { backend_url } from '../../../util/variables';


const ChatForm = ({ setAnswer, setLoading, setChatID }) => {

    const [data, setData] = useState({ language: 'English' })

    const { fetchUsage } = useContext(UsageContext);
    const { videoUrl, setVideoURL, setLanguage } = useContext(ChatbotContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true)
        let _body = {
            body: data
        }

        try {
            // /chatbot/video/summarize
            const response = await fetch(`${backend_url}/chatbot/video/summarize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("teachai_token")}`
                },
                body: JSON.stringify({
                    body: data
                })
            });

            // Check if the response is successful (status code 200)
            if (response.status === 200) {
                const reader = response.body.getReader();
                let receivedChunks = [];

                let answer = 'Wait a moment...<br />';

                const read = async () => {
                    const { done, value } = await reader.read();

                    if (done) {
                        // All data has been received
                        console.log('Stream finished');
                        answer = answer.replace(/Wait a moment...<br \/>/g, '');
                        setAnswer([{ answer }])
                        fetchUsage();
                    } else {
                        // Process the received chunk
                        setLoading(false);
                        // receivedChunks.push(value);
                        let text = new TextDecoder().decode(value)
                        text = text.replace(/\n/g, '<br />');

                        if (text.includes('chat_id')) {
                            try {
                                // Attempt to parse the string as JSON
                                let jsonResult = JSON.parse(text);
                                setChatID(jsonResult['chat_id'])

                                console.log("Parsed JSON:", jsonResult);
                            } catch (error) {
                                // If parsing fails, handle the error
                                console.error("Error parsing JSON:", error);
                            }
                        } else {
                            answer += text;
                        }

                        setAnswer([{ answer }])
                        // console.log('Received chunk:', text);

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
            if (error?.response?.status === 504) {
                toast("Gateway Timeout, Try Again")
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
                    <label htmlFor="summary" className='font-medium'>
                        Video URL
                    </label>
                    <input
                        type="text"
                        id='summary'
                        placeholder='Add Youtube video link here'
                        name='url'
                        onChange={(e) => {
                            handleChange(e);
                            setVideoURL(e.target.value)
                        }}
                        value={videoUrl}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>

                {/* <div className='flex flex-col mb-5'>
                    <label htmlFor="gradeLevel" className='font-medium'>
                        Grade Level
                    </label>
                    <input
                        type="text"
                        id='gradeLevel'
                        name='gradeLevel'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div> */}

                {/* <div className='flex flex-col mb-5'>
                    <label htmlFor="lessonDuration" className='font-medium'>
                        Lesson Duration
                    </label>
                    <input
                        type="text"
                        id='lessonDuration'
                        name='lessonDuration'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div> */}

                {/* <div className='flex flex-col mb-5'>
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
                </div> */}

                {/* <div className='flex flex-col mb-5'>
                    <label htmlFor="keyLearning" className='font-medium'>
                        Key Learning Intention
                    </label>
                    <input
                        type="text"
                        id='keyLearning'
                        name='keyLearning'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div> */}

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