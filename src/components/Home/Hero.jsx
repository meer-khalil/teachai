import hero_image from '../../images/hero_image.jpg'

const Hero = () => {


    return (
        <div className='flex flex-col md:flex-row items-center justify-between pt-12 mx-2 md:mx-8'>
            <div className='flex-1  mb-8 md:mb-0'>
                <div className='md:mr-8'>

                    <p className='text-gray-600 animate-flash'>
                        RISK-FREE 7 DAY TRIAL
                    </p>

                    <h1
                        className=' text-5xl md:text-6xl mb-6 mt-2  font-extrabold text-secondary'>
                        Embrace the Future of Teaching with Teach Assist AI.
                    </h1>

                    <p
                        className='text-secondary text-justify md:text-lg'>
                        Streamline your teacher workload and prioritize your students with an efficient tool that harnesses the power of AI. Wether you're seasoned pro or starting out. It simplifies and enhances your teaching experience.
                    </p>

                    <div className='flex gap-5 items-center mt-8'>

                        <button className='bg-primary px-6 py-3 rounded-md border-2 text-white border-primary'>
                            Try it free
                        </button>

                        <button className='px-6 py-3 rounded-md border-2 text-white bg-[#ed7742]'>
                            Watch How it Works
                        </button>
                    </div>
                </div>
            </div>
            <div className='flex-1'>
                <img src={hero_image} className=' rounded-lg md:rounded-[2rem] w-full' alt="hero imgae" />
            </div>
        </div>
    )
}

export default Hero