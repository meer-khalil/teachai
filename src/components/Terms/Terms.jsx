import React from 'react'


const data = [
    {
        title: '1. Introduction',
        description: 'Welcome to AI Teacher Tool. This document, our Terms and Conditions ("Terms"), is a legal agreement between AI Teacher Tool ("us," "we," or "our") and you ("user," "you," or "your"). These Terms govern your access to and use of our website and services (collectively, the "Services"). Please read them carefully.'
    },
    {
        title: "2. Acceptance of Terms",
        description: "By accessing or using our Services, you agree to be bound by these Terms, our Privacy Policy, and any additional terms applicable to certain programs in which you may elect to participate. If you do not agree to these Terms, you should not use or access our Services."
    },
    {
        title: "3. Changes to Terms",
        description: "We reserve the right to modify these Terms at any time. We will always post the most current version on our website. By continuing to use the Services after changes become effective, you agree to abide by the revised Terms."
    },
    {
        title: "4. Account Registration",
        description: "To use our Services, you may need to create an account. You are responsible for safeguarding your account and for all activities that occur under your account. You agree to notify us immediately if you suspect any unauthorized use of your account."
    },
    {
        title: "5. User Responsibilities",
        description: "You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to use our Services in any way that could interfere with the rights of others or the operation of our Services."
    },
    {
        title: "6. Intellectual Property Rights",
        description: "All content, features, and functionality on our Services are owned by AI Teacher Tool and are protected by international copyright, trademark, patent, trade secret, and other intellectual property rights laws."
    },
    {
        title: "7. Subscription Services",
        description: "We may offer subscription-based services. By subscribing to these services, you agree to pay all applicable fees as described in the specific terms for these services."
    },
    {
        title: "8. Termination",
        description: "We reserve the right to terminate or suspend your access to our Services, without notice, for any reason, including breach of these Terms."
    },
    {
        title: "9. Limitation of Liability",
        description: "To the fullest extent permitted by law, AI Teacher Tool, its affiliates, officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Services."
    },
    {
        title: "10.Governing Law",
        description: "These Terms are governed by the laws of Australia, without regard to its conflict of laws rules."
    },

]
const Terms = () => {
    return (
        <div className=' max-w-[1440px] mx-auto'>
            <h1 className='text-center text-4xl font-extrabold my-10'>
                Terms & Conditions
            </h1>
            <div className=' mx-5 md:mx-10 pt-20'>

                {
                    data.map((el, i) => (
                        <div className='mb-10'>

                            <h3 className='text-3xl font-semibold'>{el.title}</h3>
                            <p className='text-xl mt-5 mr-10 text-justify'>
                                {el.description}
                            </p>
                        </div>
                    ))
                }

                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>11. Contact Information</h3>
                    <p className='text-xl mt-5 mr-10 text-justify'>
                        If you have any questions about these Terms, please contact us at
                        <a href="/" className=' text-blue-500 underline ml-4'>
                            support@teachassistai.com.au.
                        </a>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Terms