import React, { useContext, useState } from 'react'
import { ChatbotContext } from '../../../context/ChatbotContext'

const Categories = () => {


    const { filterChatbots, selectedCategory } = useContext(ChatbotContext);

    return (
        <div className='my-5'>
            <div className='flex flex-row gap-4 flex-wrap'>
                {
                    [
                        "All",
                        "Lesson Planning",
                        "Student Engagement & Activity Ideas",
                        "Special Education & English Second Language",
                        "Communication & Professional Learning",
                        "Digital Learning & Teaching Tools",
                        "Assessment & Progress Monitoring"
                    ].map((el, i) => (
                        <div
                            className={` min-w-min border border-secondary rounded-full px-3 cursor-pointer ${selectedCategory === el ? 'bg-black text-white' : ''}`}
                            onClick={() => filterChatbots(el)}
                        >
                            <p className={`${selectedCategory === el ? 'text-white' : ''}`}>
                                {el}
                            </p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Categories