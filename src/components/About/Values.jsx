import React from 'react'
import Desktop from '../SVGs/Desktop'
import Data from '../SVGs/Data'
import Control from '../SVGs/Control'
import Together from '../SVGs/Together'
import Circle from '../SVGs/Circle'
import Managment from '../SVGs/Managment'

const Values = () => {
    return (
        <div className='mt-16 md:mt-32'>
            <div

                className='grid grid-cols-1 md:grid-cols-3 rounded-3xl gap-y-20 gap-5 justify-items-center '>
                {
                    [
                        {
                            title: 'Transparency',
                            description: 'Being open and honest with customers about business practices and policies.',
                            icon: <Desktop />
                        },
                        {
                            title: 'Responsiveness',
                            description: "Quickly and effectively addressing customer concerns and complaints.",
                            icon: <Data />
                        },
                        {
                            title: "Personalization",
                            description: 'Tailoring products, services and experiences to meet individual customer needs and preferences.',
                            icon: <Control />
                        },
                        {
                            title: "Empathy",
                            description: "Being able to understand and relate to customers' feelings, needs and expectations",
                            icon: <Together />
                        },
                        {
                            title: "Continuous improvement",
                            description: 'Constantly seeking feedback from customers and working to improve the customer experience.',
                            icon: <Circle />
                        },
                        {
                            title: 'Loyalty',
                            description: 'Building long-term relationships with customers by consistently delivering value and a positive experience. ',
                            icon: <Managment />
                        }
                    ].map((el, i) => (

                        <div className={` max-w-[16rem] md:max-w-[14rem] flex flex-col items-center md:items-start gap-5`}>
                            {el.icon}
                            <h4 className='text-2xl font-semibold text-center md:text-start text-secondary'>{el.title}</h4>
                            <p className=' text-secondary text-center md:text-start rounded-full'>{el.description}</p>
                        </div>
                    ))
                }
            </div>

        </div>
    )
}

export default Values