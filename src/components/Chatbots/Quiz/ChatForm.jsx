import axios from 'axios';
import React, { useState } from 'react'
import { backend_url } from '../../../util/variables';


const ChatForm = ({ setAnswer, setLoading, setMessage }) => {

    const [data, setData] = useState({})

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);
        setLoading(true);
        
        try {
            let res = await axios.post(`${backend_url}/quiz`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer([res.data.answer])

                setMessage("Here is Your Data!");
                setTimeout(() => {
                    setMessage(null);
                    setLoading(false)
                }, 2000)
            }
        } catch (error) {
            console.log("error: ", error);
            setMessage("There is an Error While making Request!");

            setTimeout(() => {
                setMessage(null);
                setLoading(false)
            }, 6000)
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
        <div className='mr-5'>
            <form onSubmit={handleSubmit} className='mt-10'>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="topic" className=' text-lg'>
                        Topic
                    </label>
                    <input
                        type="text"
                        id='topic'
                        placeholder='Type here'
                        name='topic'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="gradeLevel" className=' text-lg'>
                        Grade Level
                    </label>
                    <input
                        type="text"
                        id='gradeLevel'
                        name='gradeLevel'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="numberOfQuestions" className=' text-lg'>
                        Number of Questions
                    </label>
                    <input
                        type="text"
                        id='numberOfQuestions'
                        name='numberOfQuestions'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="quizType" className=' text-lg'>
                        Quiz Type
                    </label>
                    <select
                        id="quizType"
                        name='quizType'
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    >
                        <option selected>Choose a Type</option>
                        <option value="Multiple Choice">Multiple Choice</option>
                        <option value="True or False">True or False</option>
                    </select>
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="subject" className=' text-lg'>
                        Subject
                    </label>
                    <input
                        type="text"
                        id='subject'
                        name='subject'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="shortSummaryLearningObjectives" className=' text-lg'>
                        Short Summary Learning Objectives
                    </label>
                    <input
                        type="text"
                        id='shortSummaryLearningObjectives'
                        name='shortSummaryLearningObjectives'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>
                    <label htmlFor="language" className=' text-lg'>
                        Language
                    </label>
                    <input
                        type="text"
                        id='language'
                        name='language'
                        onChange={handleChange}
                        className='px-2 h-10 border  bg-white outline-none'
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