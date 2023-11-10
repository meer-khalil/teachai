import React, { useEffect, useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import { ChatbotContext } from '../../../context/ChatbotContext';
import { backend_url } from '../../../util/variables';


const ChatForm = ({ setAnswer, setLoading, setChatID }) => {

    const [data, setData] = useState({})

    const { fetchUsage } = useContext(UsageContext);
    const { setLanguage, language, setQuizRequest } = useContext(ChatbotContext);


    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     console.log(data);
    //     setLoading(true)
    //     setQuizRequest(data);
    //     let _body = {
    //         body: data
    //     }

    //     try {
    //         let res = await api.post(`/chatbot/quiz`, _body)

    //         if (res.statusText === 'OK') {

    //             console.log('Response from chatform: ', res);
    //             console.log('Here is the answer: ', res.data.answer);
    //             setChatID(res.data.chat_id)
    //             setAnswer([{ answer: res.data.answer }])
    //             setLoading(false)
    //             fetchUsage();
    //         }
    //     } catch (error) {

    //         if (error?.response?.status === 429) {
    //             toast(error?.response?.data?.error)
    //         }
    //         console.log('Error: ', error);

    //         setLoading(false)

    //     }

    // }

    const submitForm = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true)

        try {
            const response = await fetch(`${backend_url}/chatbot/quiz`, {
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
            console.log('Error: ', error);
            setLoading(false)
            console.error('Error:', error);
            // Handle any network or other errors
        }
    };

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
            <form onSubmit={submitForm} className='mt-10'>

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