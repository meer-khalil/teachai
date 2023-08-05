import { Children, createContext, useState } from "react";


// bots images
import bot1 from '../images/bots/1.Lesson Planning - Lisa.png'
import bot2 from '../images/bots/2.Quiz - Qasim.png'
import bot3 from '../images/bots/3.Automated Essay Scoring and Feedback - Elsa.png'


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

export const ChatbotContext = createContext()


export const ChatbotProvider = ({ children }) => {

    const [chatbots, setChatbots] = useState(data);
    const [selectedCategory, setSelectedCategory] = useState('');


    const filterChatbots = (category) => {
        setSelectedCategory(category);

        if (category === 'All') {
            setChatbots(data)
            return
        }

        let temp = data.filter((e) => e.category?.toLowerCase() === category.toLowerCase())
        setChatbots(temp)
    }

    return (
        <ChatbotContext.Provider value={{
            data,
            chatbots,
            filterChatbots,
            selectedCategory
        }}>
            {children}
        </ChatbotContext.Provider>
    )
}