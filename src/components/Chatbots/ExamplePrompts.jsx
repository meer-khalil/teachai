import React from 'react'

const ExamplePrompts = () => {
    return (
        <div className='flex-[0.75]'>

            <h2 className=' text-2xl font-bold mb-5'>
                Follow Up Prompts
            </h2>
            
            <div className='flex items-center'>
                <div className=' bg-gray-300 px-8 py-5'>
                    {
                        [
                            'Thanks for the lesson plan! Can you suggest some additional hands-on activities to help students better understand? ',
                            'Teacher: I appreciate the lesson plan. Can you recommend other videos or multimedia resources that I can use to supplement the lesson? ',
                            "Thank you for the lesson plan. I'd like to include a short assessment at the end of the lesson to check my students' understanding of the water cycle. Can you provide some sample questions or ideas for the assessment?"
                        ].map((item, i) => (
                            <div className=' mb-1'>
                                <h4 className=' font-bold'>Example {i + 1}</h4>
                                <p className='text-xs'>Teacher: {item}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default ExamplePrompts