import { useEffect } from "react";

function Answer({ answer }) {

  const slideDown = () => {
    console.log('Here I am to scroll');
    let content = document.getElementById('chat_content');
    console.log('content: ', content);
    content.scrollTop = content.scrollHeight;
  }

  useEffect(() => {
    slideDown();
  }, [answer])

  return (
    <div>
      <div id='chat_content' className='overflow-y-scroll h-[70vh] pr-4 pt-4'>
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
    </div>
  );
}

export default Answer;