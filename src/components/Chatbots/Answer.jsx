import { useContext } from "react";
import { useEffect } from "react";
import { ChatbotContext } from "../../context/ChatbotContext";

function Answer({ answer }) {



  const { setAnswerForPrint } = useContext(ChatbotContext)

  const slideDown = () => {
    console.log('Here I am to scroll');
    let content = document.getElementById('chat_content');
    console.log('content: ', content);

    // Get the last child element
    let lastChild = content.lastElementChild;

    // Calculate the height to subtract (last child's height)
    let subtractHeight = lastChild ? lastChild.clientHeight : 0;

    // Scroll down, but subtract the height of the last child
    content.scrollTop = content.scrollHeight - subtractHeight;
  }


  useEffect(() => {
    slideDown();
    setAnswerForPrint(answer);

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
              var newText = text?.replace(urlRegex, function (url) {
                return `<a href="${url}" target="_blank" style="color: blue;">${url}</a>`;
              });

              return newText;
            }

            let newText = wrapLinksWithAnchorTags(el?.answer)

            return (
              <div className="chat_content_item prose prose-xl" style={{ width: '100%' }}>
                {
                  el?.question && (
                    <h4 className='mt-20 mb-3 text-xl font-bold'>
                      {el?.question}
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