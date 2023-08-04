import React from 'react'

import bot from '../../../images/bots/2.Quiz - Qasim.png'
const Categories = ({ selectedCategory, setSelectedCategory }) => {
    return (
        <div className='my-5'>
            <div className='flex flex-col gap-4 pl-10'>
                {
                    [
                        "All",
                        "Lesson Planning",
                        "Student Engagement & Activity Ideas",
                        "Special Education & Inclusive Practice",
                        "Communication & Professional Learning",
                        "Digital Learning & Teaching Tools",
                        "Assessment & Progress Monitoring"
                    ].map((el, i) => (
                        <div className=' min-w-min font-bold flex gap-2 items-start' onClick={() => setSelectedCategory(el)}>
                            <img src={bot} alt="" className=' w-5 h-5 rounded-full mt-1' />
                            <p className={`${selectedCategory === el? ' font-extrabold text-xl': ''}`}>
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