import React, { useState } from 'react'
import api from '../../../util/api';
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';


const ChatForm = ({ setAnswer, setLoading, setChatID, setFileName, fetchFile }) => {

    const [data, setData] = useState({})

    const { fetchUsage } = useContext(UsageContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(data);

        if (data.number_of_slides > 10) {
            toast("Maximum Slides could be 10")
            return
        }

        setLoading(true)
        let _body = {
            body: data
        }

        try {
            let res = await api.post(`/chatbot/presentation`, _body)

            if (res.statusText === 'OK') {

                const { data } = res
                // console.log('Response from chatform: ', res);
                console.log('Here is the answer: ', data.answer);

                setChatID(data.chat_id)

                let fileName = data.answer.split('/')
                fileName = fileName[fileName.length - 1]

                console.log('FileName: ', fileName);
                setAnswer([{ answer: fileName.split('_')[1] }])

                setFileName(fileName)
                fetchFile(fileName)
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
                    <label htmlFor="grade" className='font-medium'>
                        Grade
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
                    <label htmlFor="subject" className='font-medium'>
                        Subject
                    </label>
                    <input
                        type="text"
                        id='subject'
                        placeholder='Type here'
                        name='subject'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div>

                <div className='flex flex-col mb-5'>

                    <label
                        htmlFor="description"
                        className="block mb-2 text-sm font-medium text-gray-900">
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows="4"
                        name='description'
                        className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add description of your PowerPoint Presentation"
                        onChange={handleChange}
                    >
                    </textarea>
                </div>
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
                    <label htmlFor="summary" className='font-medium'>
                        Short Summary Learning Objectives
                    </label>
                    <input
                        type="text"
                        id='summary'
                        name='summary'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div> */}


                {/* <div className='flex flex-col mb-5'>
                    <label htmlFor="type" className='font-medium'>
                        Quiz Type (Eg: multiple choice, true or false etc)
                    </label>
                    <input
                        type="text"
                        id='type'
                        name='type'
                        onChange={handleChange}
                        className='px-2 h-8 rounded border  bg-white outline-none'
                    />
                </div> */}

                <div className='flex flex-col mb-5'>
                    <label htmlFor="noOfSlides" className='font-medium'>
                        Number of Slides
                    </label>
                    <input
                        type="text"
                        id='noOfSlides'
                        name='number_of_slides'
                        placeholder='Maximum 10 slides'
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