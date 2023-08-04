import { Link, Route, Routes, useParams } from "react-router-dom";

const Content = () => {

    const { chatbot } = useParams();

    return (
        <h1>Content: {chatbot}</h1>
    );
}


const History = () => {
    return (
        <div className="flex gap-5">
            <div className="flex-[1] flex flex-col gap-3 pl-3">
                {
                    ['one', 'two', 'three', 'four'].map((e) => (
                        <Link to={`/user/dashboard/history/chatbot/${e}`}>
                            <p className=" border-b border-blue-500">{e}</p>
                        </Link>
                    ))
                }
            </div>
            <div className="flex-[5] bg-green-400 max-h-[100vh]">
                <Routes>
                    <Route path="/:chatbot" element={<Content />} />
                </Routes>
            </div>
        </div>
    );
}

export default History;