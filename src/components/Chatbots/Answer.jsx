const Answer = ({ answer }) => {
    console.log('answer: ', answer);
    // alert('check')
    return (
        <div id='chat_content' className='overflow-y-scroll h-[70vh] pr-4 pt-4'>
            {
                answer?.map((el, i) => (
                    <>
                        {
                            el?.question && (
                                <h4 className='mt-20 mb-3 text-xl font-bold'>
                                    {el.question}
                                </h4>
                            )
                        }
                        <div dangerouslySetInnerHTML={{ __html: el.answer }} />
                    </>
                ))
            }
        </div>
    )
}

export default Answer;