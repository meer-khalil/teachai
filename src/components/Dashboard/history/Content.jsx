import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../util/api";
import Answer from "../../Chatbots/Answer";

const Content = () => {

    const { chatbotid } = useParams();
    const [chatHistory, setChatHistory] = useState();

    const getHistory = async () => {
        try {

            const res = await api.get(`/chat/history/${chatbotid}`)
            console.log(res.data.history);
            setChatHistory(res.data.history)

        } catch (error) {
            console.log('Error while fetching ids: \n', error);
        }
    }


    useEffect(() => {
        console.log('\n\n\nChatID: \n\n', chatbotid);
        getHistory();
    }, [chatbotid])

    return (
        <>
            {/* <h1>Content: {chatbotid}</h1> */}
            <div>
                {
                    chatHistory && <Answer answer={chatHistory.content} />
                }
            </div>
        </>

    );
}

export default Content