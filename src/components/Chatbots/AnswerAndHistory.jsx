import React from 'react'
import { useState } from 'react'
import Answer from './Answer';

import Loading from './Loading';
import ShortForm from './ShortForm';
import History from '../Dashboard/history/History';
import ExamplePrompts from './ExamplePrompts';


const AnswerAndHistory = ({
    answer, setAnswer,
    componentRef,
    loading, setLoading,
    chatID, url,
    chatbot, dontFollow
}) => {

    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className='max-h-[100vh] pb-5 flex flex-1 gap-3'>
            <div className={`flex-[2] ${answer.length > 0 ? 'border-r border-black' : ''}`}>
                <div className=' border-b-2 flex gap-3'>
                    <button className={`${!showHistory ? 'bg-slate-300' : ''} px-4 py-2`} onClick={() => setShowHistory(false)}>Output</button>
                    {/* <button className={`${showHistory ? 'bg-slate-300' : ''} px-4 py-2`} onClick={() => setShowHistory(true)}>History</button> */}
                </div>
                {
                    !showHistory ? (
                        <>
                            {
                                (answer.length > 0) ? (
                                    <div>
                                        <div className='relative' ref={componentRef}>

                                            <Answer answer={answer} />
                                            {loading && <Loading />}

                                        </div>

                                        {
                                            !dontFollow &&
                                            <ShortForm
                                                url={url}
                                                setLoading={setLoading}
                                                setAnswer={setAnswer}
                                                chatID={chatID}
                                            />
                                        }
                                    </div>
                                )
                                    : (
                                        <div className=' flex justify-center items-center w-full h-full relative'>
                                            <p>Try variaty of inputs and input lengths to get the best results</p>
                                            {
                                                loading && <Loading />
                                            }
                                        </div>
                                    )

                            }

                        </>
                    ) : (
                        <div>
                            <History chatbot={chatbot} />
                        </div>
                    )
                }
            </div>

            {((answer.length > 0) && (!showHistory)) && <ExamplePrompts />}

        </div>
    )
}

export default AnswerAndHistory