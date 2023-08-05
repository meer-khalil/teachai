import React from 'react'

const ExportButtons = ({ exportToPdf }) => {
    return (
        <div className='flex justify-end gap-5 items-center'>
            <h3 className=' text-2xl font-bold uppercase'>Export</h3>
            <div className=' flex gap-3'>
                <button className='px-5 py-2 rounded bg-orange-400  text-white' onClick={exportToPdf}>PDF</button>
                <button className='px-5 py-2 rounded bg-orange-400  text-white'>DOCS</button>
                <button className='px-5 py-2 rounded bg-orange-400  text-white'>Excel</button>
            </div>
        </div>
    )
}

export default ExportButtons