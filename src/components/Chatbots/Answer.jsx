
function Answer({reportTemplateRef, answer }) {


  return (
    <div>
      <div id='chat_content' ref={reportTemplateRef} className='overflow-y-scroll h-[70vh] pr-4 pt-4'>
        {
          answer?.map((el, i) => (
            <div className="chat_content_item">
              {
                el?.question && (
                  <h4 className='mt-20 mb-3 text-xl font-bold'>
                    {el.question}
                  </h4>
                )
              }
              <div dangerouslySetInnerHTML={{ __html: el.answer }} />
            </div>
          ))
        }
      </div>
      {/* <button className="button" onClick={handleGeneratePdf}>Generate PDF</button> */}
    </div>
  );
}

export default Answer;
