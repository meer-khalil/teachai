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


    // const submitForm = async (e) => {
    //     e.preventDefault();

    //     let data = {
    //         body: {
    //             gradeLevel: "12",
    //             keyLearning: "Learning",
    //             language: "English",
    //             lessonDuration: "12",
    //             subject: "Calculus",
    //             topic: "Derivation"
    //         }
    //     }

    //     try {
    //         let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MTE1MmViYjA3MTgyN2RmOTgyNTRjNCIsImlhdCI6MTY5OTUyODk4OSwiZXhwIjoxNzAwMTMzNzg5fQ.uTKnseZ7yRW_XigPGzXk0NwGXzF0idtuNWFXvv_WyF0'

    //         const response = await axios.post('http://localhost:4000/api/v1/chatbot/lessonplanner', data, {
    //             responseType: 'stream', // Indicate that the response should be treated as a stream
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });

    //         // Handle the streaming response
    //         response.data.on('data', (chunk) => {
    //             // Process each data chunk as it arrives
    //             console.log('Received chunk:', chunk.toString());
    //             // Update your UI with the data as it arrives
    //         });

    //         response.data.on('end', () => {
    //             // All data has been received
    //             console.log('Stream finished');
    //             // Perform any final actions when the stream ends
    //         });
    //     } catch (error) {
    //         console.error('Error:', error);
    //         // Handle any errors from the request
    //     }
    // };


    // const submitForm = async (e) => {
    //     e.preventDefault();

    //     let data = {
    //         body: {
    //             gradeLevel: "12",
    //             keyLearning: "Learning",
    //             language: "English",
    //             lessonDuration: "12",
    //             subject: "Calculus",
    //             topic: "Derivation"
    //         }
    //     };

    //     // const token = 'YOUR_AUTH_TOKEN'; // Replace with your actual token
    //     let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MTE1MmViYjA3MTgyN2RmOTgyNTRjNCIsImlhdCI6MTY5OTUyODk4OSwiZXhwIjoxNzAwMTMzNzg5fQ.uTKnseZ7yRW_XigPGzXk0NwGXzF0idtuNWFXvv_WyF0'

    //     const xhr = new XMLHttpRequest();

    //     console.log('Data: ', data);

    //     xhr.open('POST', 'http://localhost:4000/api/v1/chatbot/lessonplanner', true);
    //     xhr.responseType = 'blob'; // Use 'blob' for binary response data

    //     xhr.setRequestHeader('Content-Type', 'application/json');
    //     xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    //     xhr.onprogress = (event) => {
    //         if (event.lengthComputable) {
    //             // Calculate the progress if needed
    //             const percentComplete = (event.loaded / event.total) * 100;
    //             console.log(`Progress: ${percentComplete}%`);
    //         }

    //         // Process each chunk as it arrives
    //         const chunk = new Uint8Array(xhr.response, xhr.response.byteLength - event.loaded, event.loaded);
    //         console.log('Received chunk:', chunk);

    //         // Handle the chunk data here
    //     };

    //     xhr.onreadystatechange = () => {
    //         if (xhr.readyState === 4) {
    //             if (xhr.status === 200) {
    //                 console.log('Stream finished');
    //                 // Perform any final actions when the stream ends
    //             } else {
    //                 console.error('Error:', xhr.status, xhr.statusText);
    //                 // Handle any errors from the request
    //             }
    //         }
    //     };

    //     xhr.send(JSON.stringify(data));
    // };


    const fetchData = async () => {
        let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MTE1MmViYjA3MTgyN2RmOTgyNTRjNCIsImlhdCI6MTY5OTUyODk4OSwiZXhwIjoxNzAwMTMzNzg5fQ.uTKnseZ7yRW_XigPGzXk0NwGXzF0idtuNWFXvv_WyF0'

        try {
            const response = await fetch('http://localhost:4000/api/v1/chatbot/lessonplanner');
            if (!response.ok || !response.body) {
                throw response.statusText;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    setLoading(false);
                    break;
                }

                const decodedChunk = decoder.decode(value, { stream: true });
                setData(prevValue => `${prevValue}${decodedChunk}`);
            }
        } catch (error) {
            setLoading(false);
            // Handle other errors
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();

        const data = {
            body: {
                gradeLevel: "12",
                keyLearning: "Learning",
                language: "English",
                lessonDuration: "12",
                subject: "Calculus",
                topic: "Derivation"
            }
        };

        let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MTE1MmViYjA3MTgyN2RmOTgyNTRjNCIsImlhdCI6MTY5OTUyODk4OSwiZXhwIjoxNzAwMTMzNzg5fQ.uTKnseZ7yRW_XigPGzXk0NwGXzF0idtuNWFXvv_WyF0'


        try {
            const response = await fetch('http://localhost:4000/api/v1/chatbot/lessonplanner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            // Check if the response is successful (status code 200)
            if (response.status === 200) {
                const reader = response.body.getReader();
                let receivedChunks = [];

                const read = async () => {
                    const { done, value } = await reader.read();

                    if (done) {
                        // All data has been received
                        console.log('Stream finished');
                        // Perform any final actions when the stream ends
                    } else {
                        // Process the received chunk
                        receivedChunks.push(value);
                        console.log('Received chunk:', new TextDecoder().decode(value));

                        // Call read() again to receive the next chunk
                        read();
                    }
                };

                read();
            } else {
                console.error('Error:', response.status, response.statusText);
                // Handle any errors from the request
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle any network or other errors
        }
    };


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
                // console.log('Response: ', response);
                console.log('Sucks(Coding)');
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
            <form onSubmit={submitForm} className='mt-10'>

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