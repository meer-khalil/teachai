import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import api from "../../../util/api";
import { useEffect, useState } from "react";
import Answer from "../../Chatbots/Answer";
import Content from "./Content";





const History = () => {

    const { chatbot } = useParams();
    const [chatIDs, setChatIDs] = useState();


    const getChatIDs = async () => {
        try {

            const res = await api.post('/chat/get-chat-ids/', { chat_name: chatbot })
            console.log(res.data);
            setChatIDs(res.data.ids)

        } catch (error) {
            console.log('Error while fetching ids: \n', error);
        }
    }


    useEffect(() => {
        getChatIDs()
    }, [])

    if (!chatIDs) {
        return <div>Loading....</div>
    }

    return (
        <div className="flex gap-5">
            <div className="flex-[1] flex flex-col gap-3 pl-3">
                <h1>{chatbot}</h1>
                {
                    chatIDs.map((e) => (
                        <Link to={`/user/dashboard/history/${chatbot}/${e}`}>
                            <p className=" border-b border-blue-500">{e}</p>
                        </Link>
                    ))
                }
            </div>
            <div className="flex-[5] max-h-[100vh]">
                <Routes>
                    <Route path="/:chatbotid" element={<Content />} />
                </Routes>
            </div>
        </div>
    );
}

export default History;