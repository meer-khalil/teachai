import React, { useRef, useState } from 'react'

import ChatForm from './ChatForm'

import Loading from './Loading'
import Header from '../Header'
import api from '../../../util/api';
import Answer from '../Answer';
import ShortForm from './ShortForm';
import ExamplePrompts from '../ExamplePrompts';
import ExportButtons from '../ExportButtons';



import _2_Quiz from '../../../images/bots/2.Quiz - Qasim.png'
import { useContext } from 'react';
import { UsageContext } from '../../../context/UsageContext';
import { toast } from 'react-toastify';
import AnswerAndHistory from '../AnswerAndHistory';

const Quiz = () => {

    const componentRef = useRef(null);

    const [answer, setAnswer] = useState([])
    const [loading, setLoading] = useState(false)
    const [chatID, setChatID] = useState('')

    const { fetchUsage } = useContext(UsageContext);

    return (
        <div className='border-b-2 border-black pb-24'>
            <div className=' flex flex-col md:flex-row gap-5'>

                <div className='border-r border-secondary max-w-[350px]'>
                    <Header
                        name={'Qasim'}
                        image={_2_Quiz}
                        heading={'Quiz Generator'}
                        desc={'Allow me to offer assistance with your quiz creation tasks.'}
                    />

                    <hr className='h-[2px] bg-secondary' />

                    <ChatForm
                        setAnswer={setAnswer}
                        setLoading={setLoading}
                        setChatID={setChatID}
                    />

                </div>

                <AnswerAndHistory
                    url={'/quiz'}
                    answer={answer}
                    setAnswer={setAnswer} 
                    componentRef={componentRef} 
                    loading={loading}
                    setLoading={setLoading}
                    chatID={chatID}
                />
            </div>

            <ExportButtons componentToPrint={componentRef} answer={answer} />

        </div>
    )
}

export default Quiz