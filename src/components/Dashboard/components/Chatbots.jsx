import React, { useState } from 'react';
import axios from 'axios';

import { backend_url } from '../../../util/variables';
import Productivity from './Productivity';
import Header from './Header';
import Categories from './Categories';


// bots images
import bot1 from '../../../images/bots/1.Lesson Planning - Lisa.png'
import bot2 from '../../../images/bots/2.Quiz - Qasim.png'
import bot3 from '../../../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'


const data = [
  {
    title: 'Lesson Planner Assistant',
    description: '4,729 curated designresources to energize your creative workflow',
    icon: bot1,
    url: 'lesson-planner',
    category: 'Lesson Planning'
  },

  {
    title: 'Quiz Generator Assistant',
    description: "4,729 curated design resources to energize your creative workflow",
    icon: bot2,
    url: "quiz",
    category: 'category 2'
  },

  { title: "Control everything in one place", description: '4,729 curated designresources to energize your creative workflow', icon: bot3 },
  { title: 'General Assistant', description: '4,729 curated designresources to energize your creative workflow', icon: bot1 },
  { title: 'Super Smart Search', description: "4,729 curated design resources to energize your creative workflow", icon: bot2 },
  { title: "Control everything in one place", description: '4,729 curated designresources to energize your creative workflow', icon: bot3 },

]

const Chatbots = () => {

  const [chatbots, setChatbots] = useState(data);


  return (
    <div>
      <Header
        heading={"Chatbots"}
        desc={"Which teachers assistance would you like?"}
      />
      <Categories 
        data={data}
        setChatbots={setChatbots}
      />
      <Productivity
        chatbots={chatbots}
      />
    </div>
  );
};

export default Chatbots;