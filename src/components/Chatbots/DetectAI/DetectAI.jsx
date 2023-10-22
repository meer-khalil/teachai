import React, { useRef, useState } from "react";

import ChatForm from "./ChatForm";

import Loading from "./Loading";
import Header from "../Header";
import api from "../../../util/api";
import ExamplePrompts from "../ExamplePrompts";
import ExportButtons from "../ExportButtons";

import _9_DetectAI from "../../../images/bots/9.Detect AI-Writing & Plagiarism - Ali.png";

import { useContext } from "react";
import { UsageContext } from "../../../context/UsageContext";
import { toast } from "react-toastify";
import DonutChart, { PlagDonutChart } from "../../Donut/DonutChart";

import { useEffect } from "react";
import { ChatbotContext } from "../../../context/ChatbotContext";
import Categories from "../../Dashboard/components/Categories";

const DetectAI = () => {
  const [answer, setAnswer] = useState([]);
  const [plagAnswer, setPlagAnswer] = useState([]);

  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatID, setChatID] = useState("");

  const [detect, setDetect] = useState(false);
  const [plag, setPlag] = useState(false);

  const componentRef = useRef(null);

  const { fetchUsage } = useContext(UsageContext);

  const { setSelectedCategory, setLanguage } = useContext(ChatbotContext);
  useEffect(() => {
    setSelectedCategory("Assessment & Progress Monitoring");
    return () => {
      setLanguage('English')
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    let data = {
      body: {
        prompt,
      },
      chat_id: chatID,
    };

    try {
      let res = await api.post(`/chatbot/detectai`, data);

      if (res.statusText === "OK") {
        console.log("Here is the answer: ", res.data.answer);

        setAnswer([...answer, { question: prompt, answer: res.data.answer }]);
        setPrompt("");
        setLoading(false);
        fetchUsage();
      }
    } catch (error) {
      if (error?.response?.status === 429) {
        toast(error?.response?.data?.error);
      }
      console.log("Error: ", error);
      setLoading(false);
    }
  };

  return (
    <div className="border-b-2 border-black pb-24">
      <div>
        <Categories />
      </div>
      <div className=" flex flex-col md:flex-row gap-5">
        <div className="md:border-r border-secondary w-full md:max-w-[350px]">
          <Header
            name={"Ali"}
            image={_9_DetectAI}
            heading={"Detect AI-Writing & Plagiarism"}
            desc={
              "Allow me to aid you in ensuring originality and integrity by detecting AI-generated content and identifying plagiarism effectively."
            }
          />

          <hr className="h-[2px] bg-secondary" />

          <ChatForm
            setAnswer={setAnswer}
            setPlagAnswer={setPlagAnswer}
            setLoading={setLoading}
            chatID={chatID}
            setChatID={setChatID}
            plag={plag}
            setPlag={setPlag}
            detect={detect}
            setDetect={setDetect}
          />
        </div>

        <div className="max-h-[100vh] pb-5 flex flex-1 gap-3">
          <div
            className={`flex-[2] ${answer?.length > 0 ? "border-r border-black" : ""
              }`}
          >
            <div className=" border-b-2 flex gap-3">
              <button className=" bg-slate-300 px-4 py-2">Output</button>
              <button className=" px-4 py-2">History</button>
            </div>
            {answer?.length > 0 || plagAnswer?.length > 0 ? (
              <div>
                <div className="relative" ref={componentRef}>
                  {/* <Answer answer={answer} /> */}
                  {loading && <Loading />}
                  {(answer || plagAnswer) && (
                    <div className="left-0 top-0 right-0 bottom-0 md:absolute overflow-y-scroll break-words h-[80vh]">
                      {detect && answer && (
                        <>
                          <div className="mt-3">
                            <h2 className="text-center mb-1 text-3xl font-bold">
                              Detect AI Percentage
                            </h2>
                            <h4 className="text-lg font-bold text-center">
                              The amount of detected is{" "}
                              {answer &&
                                answer[0].answer.match(/\d+/g).map(Number)[0]}
                              %
                            </h4>
                          </div>
                          <div className="flex justify-center mt-5 mb-2">
                            <div className="w-44 h-44">
                              <div className="flex gap-2">
                                <div className=" h-5 w-5 bg-red-600"></div>
                                <span>Detect AI Percentage</span>
                              </div>
                              <DonutChart
                                data={[
                                  {
                                    label: "Detect AI",
                                    percentage:
                                      100 -
                                      answer[0].answer
                                        .match(/\d+/g)
                                        .map(Number)[0],
                                  },
                                  {
                                    label: "Plagiarism",
                                    percentage: answer[0].answer
                                      .match(/\d+/g)
                                      .map(Number)[0],
                                  },
                                ]}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {plag && plagAnswer && (
                        <div>
                          <div className="mt-16">
                            <h2 className="text-center mb-1 text-3xl font-bold">
                              Detect Plagiarism
                            </h2>
                            {/* <h4 className='text-lg font-bold text-center'>
                                                                    The amount of Plagiarism is {(answer[0].answer.match(/\d+/g)).map(Number)[0] + (Math.floor(Math.random() * (10 - 5 + 1)) + 5)}%
                                                                </h4> */}
                          </div>
                          <div className="flex flex-col gap-16 justify-center mt-4">

                            {Array.isArray(plagAnswer[0]) ? (
                              <>
                                <div className=" flex justify-center">
                                  <div className=" w-44 h-44">
                                    <div className="flex gap-2">
                                      <div
                                        className=" h-5 w-5"
                                        style={{ backgroundColor: "yellow" }}
                                      ></div>
                                      <span>Plagerism Percentage</span>
                                    </div>
                                    <PlagDonutChart
                                      data={[
                                        {
                                          label: "Detect AI",
                                          percentage:
                                            100 -
                                            plagAnswer[0].answer.match(
                                              /\d+/
                                            )[0],
                                        },
                                        {
                                          label: "Plagiarism",
                                          percentage:
                                            plagAnswer[0].answer.match(
                                              /\d+/
                                            )[0],
                                        },
                                      ]}
                                    />
                                  </div>
                                </div>
                                <div>
                                  {plagAnswer && (
                                    <div
                                      className=" prose text-sm"
                                      style={{ minWidth: "100%" }}
                                      dangerouslySetInnerHTML={{
                                        __html: plagAnswer[0].answer
                                          .replace(
                                            /Average similarity: \d+ %/g,
                                            "<h2>$&</h2>"
                                          )
                                          .replace(
                                            /Plagiarism occurred in the following/,
                                            "<h4>$&</h4>"
                                          )
                                          .replace(/URLs:/g, "")
                                          .replace(/-URL:/g, "")
                                          .replace(
                                            /(https?:\/\/[^\s]+)/g,
                                            function (url) {
                                              return `<a href="${url}" target="_blank" style="color: blue;">${url}</a>`;
                                            }
                                          )
                                          .replace(
                                            /Similarity: \d+ %/g,
                                            "<b>$&</b><br/>"
                                          )
                                          .replace(
                                            /Plagiarism occurred in the following sections:/,
                                            "<h3>Plagiarism occurred in the following sections:</h3>"
                                          )
                                          .replace(
                                            /-section: /g,
                                            "<br /><br /><b>Section:</b> "
                                          ),
                                      }}
                                    />
                                  )}
                                </div>
                              </>
                            ) : (
                              <p>{plagAnswer[0].answer}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* <ShortForm
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        handleSubmit={handleSubmit}
                                    /> */}
              </div>
            ) : (
              <div className=" flex justify-center items-center w-full h-full relative">
                <p>
                  Try variaty of inputs and input lengths to get the best
                  results
                </p>
                {loading && <Loading />}
              </div>
            )}
          </div>

          {/* {(answer.length > 0) && <ExamplePrompts />} */}
        </div>
      </div>

      <ExportButtons componentToPrint={componentRef} answer={answer} />
    </div>
  );
};

export default DetectAI;
