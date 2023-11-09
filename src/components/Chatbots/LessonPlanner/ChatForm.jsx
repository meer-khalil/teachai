import React, { useEffect, useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../../context/ChatbotContext';
import { backend_url } from '../../../util/variables';
import axios from 'axios';


const ChatForm = ({ setAnswer, setLoading, setChatID }) => {

    const [data, setData] = useState({ language: 'English' })

    const { fetchUsage } = useContext(UsageContext);
    const { setLanguage, language } = useContext(ChatbotContext);


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true)
        let _body = {
            body: data
        }

        try {
            // let token = localStorage.getItem('teachai_token');
            // const eventSource = new EventSource(`${backend_url}/chatbot/stream?token=${token}`); // Replace with your SSE endpoint
            // eventSource.onmessage = (event) => {
            //   const chunk = event.data;
            //   console.log('Received SSE:', chunk);
            //   // Process the SSE data as needed
            // };
            // eventSource.onerror = (error) => {
            //   console.error('EventSource failed:', error);
            // };

            // let res = await api.post(`/chatbot/lessonplanner`, _body, {
            //     responseType: 'stream', // Indicate that the response should be treated as a stream
            // });

            const response = await axios.post('http://localhost:4000/api/v1/chatbot/lessonplanner', _body, {
                responseType: 'stream', // Indicate that the response should be treated as a stream
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('teachai_token')}`
                }
            });
            
            // Handle the streaming response
            response.data.on('data', (chunk) => {
                // Process each data chunk as it arrivess
                setLoading(false);
                console.log('Received chunk:', chunk);
                // Update your UI with the data as it arrives
            });

            response.data.on('end', () => {
                // All data has been received
                console.log('Stream finished');
                // Perform any final actions when the stream ends
            });
            // let responseDataChunks = [];
            // res.data.on('data', (chunk) => {
            //     console.log('chunk: ', chunk);
            //     responseDataChunks.push(chunk);
            // });
            // console.log('Res: ', res);
            if (response.statusText === 'OK') {
                console.log('Response: ', response);
                // // Listen for the end of the response
                // res.data.on('end', async () => {
                //     // Concatenate all the data chunks into a single buffer
                //     const responseBodyBuffer = Buffer.concat(responseDataChunks);
                //     // Convert the buffer to a string (assuming it's a JSON response)
                //     const responseBody = responseBodyBuffer.toString('utf8');

                //     setChatID(res.data.chat_id)
                //     setAnswer([{ answer: res.data.answer }])
                //     setLoading(false)
                //     fetchUsage();
                // });
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

    return (
        <div className='md:mr-4'>
            <form onSubmit={handleSubmit} className='mt-10'>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="topic" className='font-medium'>
                        Topic
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
                </div>

                <div className='flex flex-col mb-5'>
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