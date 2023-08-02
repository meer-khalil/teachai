import React from 'react'

import botImage from '../../images/bots/1.Lesson Planning - Lisa.png';

const Header = ({ heading, desc }) => {
    return (
        <div className='pr-4'>
            <img src={botImage} alt="lesson planner" className=' w-20' />
            <h1 className=' capitalize text-2xl font-semibold text-secondary'>
                {heading}
            </h1>
            {
                desc && (
                    <p>
                        {desc}
                    </p>
                )
            }
        </div>
    )
}

export default Header