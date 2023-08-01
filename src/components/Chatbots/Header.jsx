import React from 'react'

const Header = ({ heading, desc }) => {
    return (
        <div className='pr-4'>
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