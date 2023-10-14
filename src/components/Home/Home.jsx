import React, { useContext, useEffect } from 'react'
import Hero from './Hero';
// import Logos from './Logos';
import Stats from './Stats';
// import Steps from './Steps';
import { Features } from './Features';
import History from './History';
import Integration from './Integration';
import Feature from './Feature';
import FindOut from './FindOut';
import Productivity from './Productivity';
// import Solo from './Solo';
import TestimonialSlider from './Testimonial/TestimonialSlider';
import { UserContext } from '../../context/UserContext';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChatbotProvider } from '../../context/ChatbotContext';

import hero_image from '../../images/Edited/webp/hero_image.webp'
import Banner from './Banner';



export const Home = () => {

  const location = useLocation()

  const { isLoggedin, isAuthenticated, getUserData } = useContext(UserContext)

  useEffect(() => {
    console.log('location: ', location.pathname);
    isLoggedin()
    getUserData()
  }, [isAuthenticated])


  return (
    <ChatbotProvider>
      <div className='max-w-[1640px] mx-auto overflow-hidden'>

        <Helmet>
          <meta charSet="utf-8" />
          <title>Teach Assist AI</title>
        </Helmet>

        <Hero />

        {/* <Logos /> */}

        <Productivity />

        <Stats />

        {/* <Steps /> */}

        <Features />

        <History />

        {/* <Benefits /> */}

        <Banner />

        <Integration />

        <div className='md:px-10'>
          <Feature
            title="Transforming Videos into Notes and Quizzes"
            description="Our innovative platform empowers you to effortlessly create guided notes from any YouTube video, regardless of its length. Utilizing advanced technology, we accurately summarize video content, enabling you to capture key information and insights in a condensed format. Take your learning to the next level with the option to generate custom questions based on the video, facilitating active engagement. Say goodbye to tedious note-taking and embrace the efficiency of video-based learning."
            buttonText="See More"
            image={hero_image}
          />
        </div>

        <FindOut />

        {/* <Solo /> */}
        <h1 className='text-3xl md:text-4xl text-center font-extrabold tracking-tight md:mt-12 mb-5 md:mb-10 text-primary'>
          What People Say
        </h1>
        <TestimonialSlider />

      </div>
    </ChatbotProvider>
  )
}

export default Home;