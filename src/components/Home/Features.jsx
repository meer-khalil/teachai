import Feature from './Feature'
import feature2 from '../../images/feature-2.webp'
import feature3 from '../../images/feature-3.webp'


const features = [
    {
        title: "Curriculum Creation Simplified",
        description: "With the assistance of our AI Teacher chatbots and curated resources, you can effortlessly generate customized learning materials and worksheets. Our platform leverages advanced technology and AI capabilities to ensure that the content you create aligns perfectly with your classroom needs. Say goodbye to hours of searching for suitable resources - our streamlined approach saves you time and empowers you to focus on what matters most: delivering high-quality education to your students.",
        buttonText: "See More"
    },
    {
        title: "AI-Writing and Plagiarism Detection",
        description: "Discover the ultimate tool for AI-Writing and Plagiarism Detection. Our advanced solution offers unrivaled accuracy in identifying AI- generated content, ensuring academic integrity. Assess student effort, detect plagiarism, and promote a fair academic environment.",
        buttonText: "See More",
        image: feature2
    },
    {
        title: "ESL Activity Suggestion",
        description: " Introducing our ESL Activity Suggestion Chatbot, a tailor-made tool designed specifically for teachers to support ESL students on their path to mastering the English language. This meticulously crafted chatbot serves as an invaluable resource for educators, providing a comprehensive set of features aimed at enriching language skills and advancing English proficiency. At its heart, you'll discover a diverse array of sample ESL activities thoughtfully curated to address specific elements of the English language, including nouns, verbs, and adjectives. If you're an ESL teacher in search of effective resources to empower your students, our chatbot stands ready as your trusted partner in making language learning both captivating and fruitful. Join us on this journey toward language mastery!",
        buttonText: "See More",
        image: feature3

    }

]



export const Features = () => {
    return (
        <div className='mt-20 md:mx-8'>

            {/* <p className='text-center text-secondary opacity-50'>AMAZING FEATURES</p> */}

            <h2 className=' text-3xl md:text-4xl text-center font-extrabold mt-4 mb-4 md:mb-12 text-secondary'>
                Discover the capabilities of the AI Teacher chatbots
            </h2>

            {
                features.map((el, i) => (
                    <Feature
                        title={el.title}
                        description={el.description}
                        buttonText={el.buttonText}
                        image={el.image}
                        key={i}
                        index={i} />
                ))
            }
        </div>
    )
}
