import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Loading from './Loading'
import Header from '../Header'
import api from '../../../util/api';
import Answer from '../Answer';
import ShortForm from './ShortForm';
import ExamplePrompts from '../ExamplePrompts';
import ExportButtons from '../ExportButtons';



import _10_PowerPoint from '../../../images/bots/10.PowerPoint Presentation - Priyanka.png'
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import Categories from '../../Dashboard/history/Categories';

const PowerPoint = () => {

    const componentRef = useRef(null);

    const [answer, setAnswer] = useState([])
    const [prompt, setPrompt] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [chatID, setChatID] = useState('')
    const [fileData, setFileData] = useState(null);
    const [fileName, setFileName] = useState(null);


    const { fetchUsage } = useContext(UsageContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        let data = {
            body: {
                prompt
            },
            chat_id: chatID
        }


        try {
            let res = await api.post(`/quiz`, data);

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer([...answer, { question: prompt, answer: res.data.answer }])
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


    const fetchFile = (fileName) => {
        let url = `/chatbot/presentation/download/${fileName}`

        // Make the HTTP GET request to your API
        api.get(url, { responseType: 'arraybuffer' })
            .then(response => {
                // Handle the successful response here
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                setFileData(blob);
            })
            .catch(error => {
                // Handle any errors here
                console.error('Error:', error);
            });
    }

    const handleDownloadClick = () => {
        if (fileData) {
            const url = window.URL.createObjectURL(fileData);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName.split('_')[1]}`; // Set the desired file name
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            console.log('fileData is not there');
        }
    };

    return (
        <div className='border-b-2 border-black pb-24'>
            <div>
                <Categories selectedCategory={'Digital Learning & Teaching Tools'} />
            </div>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Priyanka'}
                        image={_10_PowerPoint}
                        heading={'Power Point Presentation'}
                        desc={'Let me provide you with support for your PowerPoint presentation slides.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                        setFileName={setFileName}
                        fetchFile={fetchFile}
                        dontFollow={true}
                    />

                </div>

                <div className='max-h-[100vh] pb-5 flex flex-1 gap-3'>
                    <div className={`flex-[2] ${answer.length > 0 ? 'border-r border-black' : ''}`}>
                        <div className=' border-b-2 flex gap-3'>
                            <button className=' bg-slate-300 px-4 py-2'>Output</button>
                            <button className=' px-4 py-2'>History</button>
                        </div>
                        {
                            (answer.length > 0) ? (
                                <div className=' relative'>
                                    <div className='relative' ref={componentRef}>

                                        <Answer answer={answer} />
                                        {loading && <Loading />}

                                    </div>
                                    {
                                        fileData &&
                                        <button onClick={handleDownloadClick} disabled={!fileData ? true : false} className=' bg-blue-500 px-5 py-3 rounded absolute top-12 left-0'>Download File</button>
                                    }

                                    {/* <ShortForm
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        handleSubmit={handleSubmit}
                                    /> */}
                                </div>
                            )
                                : (
                                    <div className=' flex justify-center items-center w-full h-full relative'>
                                        <p>Try variaty of inputs and input lengths to get the best results</p>
                                        {
                                            loading && <Loading message={message} />
                                        }
                                    </div>
                                )

                        }
                    </div>

                    {(answer.length > 0) && <ExamplePrompts />}

                </div>
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default PowerPoint