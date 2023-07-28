import { Link } from 'react-router-dom'
import bot1 from '../../../images/bots/1.Lesson Planning - Lisa.png'
import bot2 from '../../../images/bots/2.Quiz - Qasim.png'
import bot3 from '../../../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'

import ProductivityItem from './ProductivityItem'
const Productivity = () => {

    return (
        <div className='flex flex-col my-5 px-4 md:px-0 gap-5 py-7'>


            <div className='grid grid-cols-1 md:grid-cols-3 gap-7'>
                {
                    [
                        {
                            title: 'Lesson Planner Assistant',
                            description: '4,729 curated designresources to energize your creative workflow',
                            icon: bot1,
                            url: 'lesson-planner'
                        },

                        {
                            title: 'Quiz Generator Assistant',
                            description: "4,729 curated design resources to energize your creative workflow",
                            icon: bot2,
                            url: "quiz"
                        },

                        { title: "Control everything in one place", description: '4,729 curated designresources to energize your creative workflow', icon: bot3 },
                        { title: 'General Assistant', description: '4,729 curated designresources to energize your creative workflow', icon: bot1 },
                        { title: 'Super Smart Search', description: "4,729 curated design resources to energize your creative workflow", icon: bot2 },
                        { title: "Control everything in one place", description: '4,729 curated designresources to energize your creative workflow', icon: bot3 },

                    ].map((el, i) => (
                        <ProductivityItem el={el} key={i} />
                    ))
                }
            </div>
        </div>
    )
}

export default Productivity