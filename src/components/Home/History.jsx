import history from '../../images/history.jpg'

const History = () => {


    return (
        <div
            className='flex flex-col-reverse md:flex-row  shadow-2xl shadow-slate-700 mx-2  md:mx-20 py-4 md:py-20 px-2 md:px-10 rounded-lg md:rounded-2xl mb-32'>
            <div className='flex-1 px-2 md:mx-0'>
                <div className='md:mx-8 pt-8 md:pt-0'>

                    {/* <p className='text-secondary'>
                        EASILY FIND WHAT YOU’RE LOOKING FOR
                    </p> */}

                    <img src={history} alt="History" className='rounded-[1rem]' />

                    <h1 className='text-4xl md:text-4xl mb-6 mt-2  font-extrabold text-secondary'>
                        Teach Smart, Teach Efficient
                        {/* :Harness the Power of AI Assistance */}
                    </h1>

                    <div className='flex gap-5 justify-center md:justify-start mt-8'>

                        <button className='px-6 py-3 rounded-2xl border-2 border-secondary hover:bg-secondary hover:text-white'>
                            Start Your Free Trial
                        </button>

                    </div>
                </div>
            </div>
            <div className='flex-1 pt-6'>
                {
                    [
                        {
                            title: 'Effortless Prompting',
                            desc: 'Say goodbye to prompt troubles. Our solution handles it all for you.'
                        },
                        {
                            title: 'Capture and Access',
                            desc: 'AI Teacher chatbots capture and store your chat history, ensuring easy retrieval.'
                        },
                        {
                            title: 'Extract Text, Multiple Formats',
                            desc: 'Seamlessly extract chatbot text to Excel, Word, PDF, and Google Docs for versatile use.'
                        },
                    ].map((el, i) => (
                        <div className='mb-5'>
                            <h4 className='text-xl font-semibold text-primary'>{el.title}</h4>
                            <p className='text-secondary text-xl'>{el.desc}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default History