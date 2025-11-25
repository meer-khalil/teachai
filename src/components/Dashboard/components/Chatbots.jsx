import React from 'react'
import Productivity from './Productivity'
import Header from './Header'
import Categories from './Categories'


const Chatbots = () => {

  return (
    <main className="w-full max-w-6xl mx-auto">
      <section className="">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Header
              heading={"Chatbots"}
              desc={"Which teacher's assistance would you like?"}
            />
            {/* <p className="mt-4 text-gray-600 text-base sm:text-lg md:text-xl">
              Choose a chatbot to help you plan lessons, create quizzes, summarize videos, and more. The interface adapts to your screen for the best experience.
            </p> */}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mt-6">
            <Categories />
          </div>

          <div className="mt-10">
            <Productivity />
          </div>
        </div>
      </section>
    </main>
  )
}

export default Chatbots