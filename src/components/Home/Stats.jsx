

import stats_image from '../../images/stat.jpg'

const Stats = () => {

    return (
        <div className='px-2 md:px-20'>

            <div className=' hidden md:flex flex-col md:flex-row-reverse pt-5 bg-gradient-to-bl from-dark via-secondary to-primary bg-secondary rounded-xl py-14 px-10'>

                <div className='flex-1'>

                    <div className='md:mx-8'>

                        <h1 className={`text-5xl mb-6 mt-2 pb-2  font-extrabold text-white`}>
                            Simplify Teaching with AI
                        </h1>

                        <p className='text-white text-lg'>
                        With our AI Teacher chatbots, creating high quality classrooms resources becomes a breeze, saving you hours of times. Simply input your desired topic, and the chatbot will generate an array of materials, including, learning intentions, lesson plans, activities, worksheets, and more. Our advanced language processing algorithms enable a comprehensive understanding of the teacher's input. 
                        </p>

                        <div className='flex gap-5 items-center mt-8'>

                            <button className='px-6 py-3 text-white rounded-md border-2 border-[#ed7742] bg-[#ed7742]'>Start Your Free Trial</button>
                        </div>
                    </div>
                </div>
                <div className='flex-1 rounded overflow-hidden'>
                    <img src={stats_image} className='mt-10 md:mt-5 md:m-5 min-h-xs' alt="hero imgae" />
                </div>
            </div>

            <div className=' hidden md:flex bg-[#4c5583] flex-col md:flex-row rounded-3xl mx-4 relative -top-2 -z-10'>
                {
                    [
                        { stat: 400, title: 'Teachers Registered' },
                        { stat: 25, title: 'Schools Registered' },
                        { stat: 30, title: 'All Teacher Chatbots' },
                    ].map((el, i) => (
                        <div className={`p-14 flex flex-col flex-1 ${i !== 0 ? "border-l-2 border-gray-300" : ''}  justify-center items-center gap-5`}>
                            <div className='relative'>
                                <h3 className='text-7xl font-extrabold text-white'>{el.stat}+</h3>

                                {/* <span className={`absolute font-bold text-2xl text-white ${i === 0 ? "top-0" : 'bottom-2'} -right-6`}>{i === 0 ? "+" : "m"}</span> */}

                            </div>
                            <p className='bg-white px-2 text-secondary rounded-full shadow-lg'>{el.title}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Stats