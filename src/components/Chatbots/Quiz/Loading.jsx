import React from 'react'

const Loading = ({ message }) => {
    return (
        <div className='flex justify-center items-center text-5xl text-white absolute left-0 right-0 bottom-0 top-0'>
            <div className='absolute left-0 right-0 bottom-0 top-0 opacity-60 bg-gray-700 -z-10'>

            </div>
            
            {message ? message : "Loading...."}
        </div>
    )
}

export default Loading