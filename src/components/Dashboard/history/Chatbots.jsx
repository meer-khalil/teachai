import React, { useState } from 'react';
import axios from 'axios';

import { backend_url } from '../../../util/variables';
import Productivity from './Productivity';
import Header from './Header';
import Categories from './Categories';


// bots images
import lessonPlanning_bot from '../../../images/bots/1.Lesson Planning - Lisa.png'
import quiz_bot from '../../../images/bots/2.Quiz - Qasim.png'
import automatedEssay from '../../../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'
import comprehension from '../../../images/bots/4.Comprehension Lesson Generator - Cara.png'
import maths from '../../../images/bots/5.Maths - Matthew.png'
import video from '../../../images/bots/6.Video to notes - Vincent .png'
import writting from '../../../images/bots/7.Detect AI-Writing & Plagiarism - Ali.png'
import powerpoint from '../../../images/bots/8.PowerPoint Presentation - Priyanka .png'


const data = [
  {
    title: 'Lesson Planner Assistant',
    description: '4,729 curated designresources to energize your creative workflow',
    icon: lessonPlanning_bot,
    url: 'lesson-planner',
    category: 'Lesson Planning'
  },

  {
    title: 'Quiz Generator Assistant',
    description: "4,729 curated design resources to energize your creative workflow",
    icon: quiz_bot,
    url: "quiz",
    category: 'Student Engagement & Activity Ideas'
  },

  {
    title: "Essay Grading",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: automatedEssay,
    url: 'essay',
    category: 'Assessment & Progress Monitoring'
  },
  {
    title: 'Comprehension Lesson Generator Bot',
    description: '4,729 curated designresources to energize your creative workflow',
    icon: comprehension,
    url: 'lessonComp',
    category: 'Lesson Planning'
  },
  {
    title: 'Math Quiz',
    description: "4,729 curated design resources to energize your creative workflow",
    icon: maths,
    url: 'mathquiz',
    category: "Student Engagement & Activity Ideas"
  },
  {
    title: "Math Lesson Planner",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: lessonPlanning_bot,
    url: 'math-lesson-planner',
    category: 'Lesson Planning'
  },
  {
    title: "Video to notes Bot",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: video,
    url: 'video-summarize',
    category: 'Digital Learning & Teaching Tools'
  },
  {
    title: "Video to Quiz Bot",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: video,
    url: 'video-to-quiz',
    category: ''
  },
  {
    title: "Detect AI-Writing & Plagiarism BOT",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: writting,
    url: 'plagrism',
    category: 'Assessment & Progress Monitoring'
  },
  {
    title: "PowerPoint Presentation ",
    description: '4,729 curated designresources to energize your creative workflow',
    icon: powerpoint,
    url: 'powerpoint-presentation',
    category: 'Digital Learning & Teaching Tools'
  }
]

const Chatbots = ({ selectedCategory, setSelectedCategory }) => {

  const [chatbots, setChatbots] = useState(data);


  return (
    <div>
      <Header
        heading={"Chatbots History"}
        desc={"Which teachers assistance would you like?"}
      />
      <Categories
        data={data}
        setChatbots={setChatbots}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <Productivity
        chatbots={chatbots}
      />
    </div>
  );
};

export default Chatbots;