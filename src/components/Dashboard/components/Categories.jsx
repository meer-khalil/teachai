import React from 'react'

const Categories = () => {
    return (
        <div className='my-5'>
            <div className='flex flex-row gap-4 flex-wrap'>
                {
                    ["All", "Lesson Planning"].map((el, i) => (
                        <div className=' min-w-min border border-secondary rounded-full px-3'>
                            {el}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Categories