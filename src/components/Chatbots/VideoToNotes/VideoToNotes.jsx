import React, { useContext, useRef, useState } from 'react'
import jsPDF from 'jspdf';

import ChatForm from './ChatForm'

import Loading from './Loading'
import { backend_url } from '../../../util/variables'
import Header from '../Header'
import api from '../../../util/api';
import Answer from '../Answer';
import ShortForm from './ShortForm';
import ExamplePrompts from '../ExamplePrompts';
import ExportButtons from './ExportButtons';
import { UserContext } from '../../../context/UserContext';
import { useNavigate } from 'react-router-dom';

// import { saveAs } from 'file-saver';
// import { HtmlToDocx } from 'html-docx-js';

const VideoToNotes = () => {


    const [answer, setAnswer] = useState([])
    const [prompt, setPrompt] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [chatID, setChatID] = useState('')

    const reportTemplateRef = useRef(null);

    const exportToPdf = async () => {
        let pdf = new jsPDF('p', 'pt', 'a4');
        let element = document.getElementById('chat_content'); // Replace 'idName' with the id of your HTML element

        // Calculate the scale factor to fit the content within the PDF
        let pdfWidth = pdf.internal.pageSize.width;
        let elementWidth = element.scrollWidth;
        let margin = 18; // Set a margin to avoid the content touching the edges of the PDF
        let scaleFactor = (pdfWidth - margin * 2) / elementWidth;

        pdf.html(element, {
            x: margin,
            y: margin,
            html2canvas: {
                scale: scaleFactor,
                windowHeight: element.scrollHeight,
                windowWidth: element.scrollWidth,
                useCORS: true
            },
            autoPaging: 'text',
            callback: function () {
                window.open(pdf.output('bloburl')); // For debugging
            }
        });

    };


    const exportToDocx = async () => {
        // let element = document.getElementById('chat_content'); // Replace 'idName' with the id of your HTML element
        // const convertedDoc = HtmlToDocx.asBlob(element.outerHTML);
        // saveAs(convertedDoc, 'document.doc');
        console.log('setup to download docx');
    };

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
            let res = await api.post(`/math/lesson`, data);

            if (res.statusText === 'OK') {

                console.log('Here is the answer: ', res.data.answer);

                setAnswer([...answer, { question: prompt, answer: res.data.answer }])
                setPrompt('')



                setLoading(false)

            }
        } catch (error) {
            console.log("error: ", error?.response?.data);
            alert('Error While fetching response for LessonPlanner!')
            setLoading(false)
        }

    }

    return (
        <div className='border-b-2 border-black pb-24'>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        heading={'Video To Notes'}
                        desc={'Which teachers assistance would you like?'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setMessage={setMessage}
                        setChatID={setChatID}
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
                                <div>
                                    <div className='relative'>

                                        <Answer reportTemplateRef={reportTemplateRef} answer={answer} />
                                        {loading && <Loading />}

                                    </div>

                                    <ShortForm
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        handleSubmit={handleSubmit}
                                    />
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

            <ExportButtons
                exportToPdf={exportToPdf}
                exportToDocx={exportToDocx}
            />

        </div>
    )
}

export default VideoToNotes