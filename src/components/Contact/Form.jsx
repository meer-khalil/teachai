import React from 'react'

const Form = () => {
    return (
        <form action="mailto:info@teachassistai.com" method="post" enctype="text/plain" className="space-y-8 border px-10 py-8 rounded-lg shadow-lg shadow-black-500 bg-white">

            <div className='flex flex-col md:flex-row gap-7 md:gap-10'>
                <div className='flex-1'>
                    <label for="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">First Name</label>
                    <input type="text" id="firstName" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="First Name" required />
                </div>
                <div className='flex-1'>
                    <label for="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Last Name</label>
                    <input type="text" id="lastName" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="Last Name" required />
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-7 md:gap-10">
                <div className='flex-1'>
                    <label for="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Your email</label>
                    <input type="email" id="email" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="name@flowbite.com" required />
                </div>
                <div className='flex-1'>
                    <label for="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Phone Number</label>
                    <input 
                        type="phone"
                        id="phone"
                        className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="(201)-1234-1234" />
                </div>
            </div>
            <div className="sm:col-span-2">
                <label for="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">How can We help you?</label>
                <textarea id="message" rows="6" className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Leave a comment..."></textarea>
            </div>
            <button type="submit" className="py-3 px-5 text-sm font-medium text-center text-secondary rounded-lg sm:w-fit focus:ring-4 focus:outline-none focus:ring-primary-300 border-2 hover:bg-dark hover:text-white border-dark">Send message</button>
        </form>
    )
}

export default Form