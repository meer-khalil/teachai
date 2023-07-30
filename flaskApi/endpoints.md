# endpoints
 1) Lesson Planning Bot:
* /lessonplanner : for generating lesson plans and for chat. data: 'prompt', 'id': user id.
 2) General Quiz Bot:
* /quiz: for generating the quiz. data: 'id','grade','topic','subject','summary','type','questionnumber'.
 3) Automated Essay Scoring and Feedback Bot:
* /gradeEssay : for grading the essay. data: 'prompt': the essay, 'id'.
* /gradeEssay/rubric :for generating rubric for the essay. data: 'essay_question', 'grade', 'id'.
 4) Comprehension Lesson Generator Bot:
* /lessonComp/questions: for generating questions for a write_up. data: "writeup","id",type","qnumber".
* /lessonComp/chat: for generating more questions for the write_up with the chat. data: 'prompt', 'id'.
* /lessonComp/answer: for revealing the answers. data: 'id'.
 5) Maths Quiz Bot:
* /mathquiz/gen: for generating the quiz. data: "mathproblem", "type", "id"
* /mathquiz/evaluate: for evaluating the quiz and chat. data: 'prompt': contains the answers to evaluate or chat message, 'id'
* /mathquiz/answer: for revealing the answers for the quiz. data: "id"
 6) Maths lesson Planner Bot :
* /math/lesson: for generating math lesson plan and chat. data: "prompt, "id"
 7) Video to Note Summary Bot:
* /video/summarize: for summarizing a youtube video from a link. data: 'url', 'id'.
* /video/chat: for chat after generating the summary. data: 'url', 'id', 'prompt'.
 8) Video to Quiz Bot:
* /video/quiz: for generating the quiz. data: 'url', 'id','num_question', 'quiz_type'.
* /video/answers: for revealing the answers after generating the quiz. data: 'url', 'id'.
* /video/chat: for chat after generating the summary. data: 'url', 'id', 'prompt'.

- Still in progress:  
  9) Detect AI Writing and Plagiarism Bot 
  10) PowerPoint Presentation Bot