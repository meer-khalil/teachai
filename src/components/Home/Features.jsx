import Feature from './Feature'
import feature1 from '../../images/check.avif'
import feature2 from '../../images/feature-2.avif'
import feature3 from '../../images/feature-3.avif'

const features = [
    {
        title: "Curriculum Creation Simplified",
        description: "With the assistance of our AI Teacher chatbots and curated resources, you can effortlessly generate customized learning materials and worksheets. Our platform leverages advanced technology and AI capabilities to ensure that the content you create aligns perfectly with your classroom needs. Say goodbye to hours of searching for suitable resources - our streamlined approach saves you time and empowers you to focus on what matters most: delivering high-quality education to your students.",
        buttonText: "See More",
        image: feature1
    },
    {
        title: "AI-Writing and Plagiarism Detection",
        description: "Discover the ultimate tool for AI-Writing and Plagiarism Detection. Our advanced solution offers unrivaled accuracy in identifying AI- generated content, ensuring academic integrity. Assess student effort, detect plagiarism, and promote a fair academic environment.",
        buttonText: "See More",
        image: feature2

    },
    {
        title: "Generate Custom Quizzes",
        description: "With this innovative chatbot, teachers can simply input a subject, and the bot will automatically generate quizzes tailored to the topic. Whether it's true and false questions or multiple-choice questions, QuizMaster Bot ensures a variety of engaging quiz formats. After students complete the quiz, the chatbot seamlessly grades their responses and provides valuable feedback on their performance. Say goodbye to manual quiz creation and grading.",
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
