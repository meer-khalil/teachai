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
        category: 'Student Engagement & Activity Ideas'
    },

    {
        title: "Essay Grading",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'essay',
        category: 'Assessment & Progress Monitoring'
    },
    {
        title: 'Comprehension Lesson Generator Bot',
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot1,
        url: 'lessonComp',
        category: 'Lesson Planning'
    },
    {
        title: 'Math Quiz',
        description: "4,729 curated design resources to energize your creative workflow",
        icon: bot2,
        url: 'mathquiz',
        category: "Student Engagement & Activity Ideas"
    },
    {
        title: "Math Lesson Planner",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'math-lesson-planner',
        category: 'Lesson Planning'
    },
    {
        title: "Video to notes Bot",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'video-summarize',
        category: 'Digital Learning & Teaching Tools'
    },
    {
        title: "Video to Quiz Bot",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'video-to-quiz',
        category: ''
    },
    {
        title: "Detect AI-Writing & Plagiarism BOT",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'plagrism',
        category: 'Assessment & Progress Monitoring'
    },
    {
        title: "PowerPoint Presentation ",
        description: '4,729 curated designresources to energize your creative workflow',
        icon: bot3,
        url: 'powerpoint-presentation',
        category: 'Digital Learning & Teaching Tools'
    }
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