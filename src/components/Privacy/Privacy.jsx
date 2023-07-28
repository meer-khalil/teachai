import React from 'react'

const Privacy = () => {
    return (
        <div className=' max-w-[1440px] mx-auto'>
            <h1 className='text-center text-4xl font-extrabold my-10'>Privacy</h1>
            <div className=' mx-5 md:mx-10 pt-20'>
                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Introduction </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        Welcome to AI Teacher Tool. We deeply respect your privacy and are committed to protecting it. This Privacy Policy outlines how we, at AI Teacher Tool, collect, use, and safeguard your information when you visit our website and utilize our services. By accessing and using our services, you consent to the data practices described in this policy. If you do not agree with the terms in this policy, please refrain from accessing or using our services.
                    </p>
                </div>

                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Collection of Information  </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        We gather personal information from you when you subscribe to our services. This information includes, but is not limited to, your email address, name, and other relevant data you might provide in your profile or during the use of our services. We also collect data regarding the device and browser you use to access our services, your IP address, and the pages you visit.
                    </p>
                </div>

                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Use of Information </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        We utilize the collected information for various purposes:
                        <ul className='pl-5 mt-5'>
                            {
                                [
                                    'To provide and maintain our services',
                                    'To notify you about changes to our services',
                                    'To allow you to participate in interactive features of our services',
                                    'To provide customer support',
                                    'To gather analysis or valuable information to improve our services',
                                    'To monitor the usage of our services',
                                    'To detect, prevent, and address technical issue'
                                ].map((el, i) => (
                                    <li className=' list-disc' key={i}>{el}</li>
                                ))
                            }
                        </ul>
                    </p>
                </div>


                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Sharing of Information</h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        We do not sell, trade, or otherwise transfer your personal data to outside parties without your consent, except to trusted third-party service providers, such as payment processors, analytics providers, and marketing services. All our third-party service providers are carefully selected and are obligated to keep your data secure. We may also share your personal data to comply with legal obligations, enforce our site policies, or protect ours or others' rights, property, or safety.
                    </p>
                </div>

                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Security of Information</h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        Your account data is secured through encryption, hashing, and salting practices. We take your security seriously and strive to take reasonable steps to protect your information. We do not have access to your password. Besides email and password authentication, we also offer third-party single sign-on services.
                    </p>
                </div>


                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Cookies </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        We use cookies and similar tracking technologies to track the activity on our services and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. These cookies expire after a set period or when you clear your browser's cookies.
                        Your Rights As a user, you have the right to access, update, or delete your personal data at any time through your account settings. If you have trouble logging in, we can assist you in resetting your password or generating a temporary one.
                    </p>
                </div>


                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Changes to this Policy  </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        We may update this Privacy Policy periodically. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.
                    </p>
                </div>


                <div className='mb-10'>

                    <h3 className='text-3xl font-semibold'>Contact Us   </h3>
                    <p className='pl-0 text-xl mr-10 text-justify mt-4'>
                        If you have any queries or suggestions about our Privacy Policy, feel free to contact us at 
                        <a href="/" className=' underline text-blue-600 ml-4'>support@AITeacherTool.com.au.</a>
                    </p>
                </div>



            </div>
        </div>
    )
}

export default Privacy