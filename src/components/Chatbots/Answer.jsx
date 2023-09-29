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
          answer?.map((el, i) => {
            function wrapLinksWithAnchorTags(text) {
              // Regular expression to match URLs
              var urlRegex = /(https?:\/\/[^\s]+)/g;
            
              // Replace URLs with anchor tags
              var newText = text.replace(urlRegex, function (url) {
                return `<a href="${url}" target="_blank" style="color: blue;">${url}</a>`;
              });
            
              return newText;
            }
            
            let newText = wrapLinksWithAnchorTags(el?.answer)

            return (
              <div className="chat_content_item prose prose-xl" style={{ width: '100%'}}>
                {
                  el?.question && (
                    <h4 className='mt-20 mb-3 text-xl font-bold'>
                      {el.question}
                    </h4>
                  )
                }
                <div className=" text-sm" dangerouslySetInnerHTML={{ __html: newText }} />
              </div>
            )
          })
        }
      </div>
    </div>
  );
}

export default Answer;