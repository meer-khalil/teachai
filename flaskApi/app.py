from flask import Flask, render_template, jsonify, request, send_file
import config
import lessonplannerapi
import quizapi
import math_quiz
import math_lesson
import grade_essay
import ytgpt
import aipresentation
import lesson_comp
from detect_ai import detect_ai
from plag_cheker import get_plag_report
from gptutils import get_title


def page_not_found(e):
  return render_template('404.html'), 404


app = Flask(__name__)
app.config.from_object(config.config['development'])

app.register_error_handler(404, page_not_found)


@app.route('/lessonplanner', methods = ['POST'])
def lessonplanner():
    data = request.get_json()

    print('Here is your Data: ', data)

    conversation_id = data['conversation_id']
    user_id = data['user_id']

    data = data['prompt']
    language = data['language']
    question = data

    res = {}
    res['lesson_plan'] = lessonplannerapi.plan_lessons_chat(question, user_id,conversation_id, language)
    return jsonify(res), 200

@app.route('/quiz', methods = ['POST'])
def quiz():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    
    print(data)

    data = data['prompt']

    grade = data['grade']
    quiz_topic = data['topic']
    subject = data['subject']
    summary = data['summary']
    quiz_type = data['type']
    qn = data['questionnumber']
    language = data['language']
    user_input = f"Generate a quiz for grade {grade}, subject: {subject}, topic: {quiz_topic}, type: {quiz_type}, note: {summary}, number of questions: {qn}"
    res = {}
    res['quiz'] = quizapi.generate_quiz(user_input, user_id, conversation_id, language)
    return jsonify(res), 200

@app.route('/gradeEssay', methods = ['POST'])
def grade():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    
    data = data['prompt']
    language = data['language']
    user_input = data
    res = {}
    res['grades'] = grade_essay.grade(user_input, user_id, conversation_id, language)
    return jsonify(res), 200

@app.route('/gradeEssay/rubric', methods=['POST'])
def rubric():
    data = request.get_json()
    essay_question = data["essay_question"]
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    grade = data["grade"]
    language = data['language']
    essay_question = essay_question + "for grade:" + grade
    rubric = grade_essay.generate_rubric(essay_question, user_id, conversation_id, language)
    result = {"rubric": rubric}
    return jsonify(result), 200

@app.route('/lessonComp/chat', methods = ['POST'])
def gen_questions_chat():
    """for generating more questions for the write_up with the chat"""
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    data = data['prompt']
    user_input = data
    language = data['language']
    res = {}
    res['questions'] = lesson_comp.generate_questions(user_input, user_id, conversation_id, language)
    return jsonify(res), 200

@app.route("/lessonComp/questions", methods=['POST'])
def gen_questions():
    data = request.get_json()

    user_id = data['user_id']
    conversation_id = data['conversation_id']

    data = data['prompt']
    writeup = data["writeup"]
    qtype = data["qtype"]
    qnumber = data["qnumber"]
    language = data['language']
    notes = f"question type: {qtype}, number of questions: {qnumber}"
    # Generate questions
    questions = lesson_comp.generate_questions(writeup, user_id, conversation_id, notes, language)
    # Return the result as JSON
    result = {"questions": questions}
    return jsonify(result), 200

@app.route("/lessonComp/answer", methods=["POST"])
def answer():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    language = data['language']
    answers = lesson_comp.generate_answers(user_id, conversation_id, language)
    result = {"answers": answers}
    return jsonify(result), 200

@app.route('/mathquiz/evaluate', methods = ['POST'])
def index():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    user_input = data["prompt"]
    language = data['language']
    res = {}
    res['evaluation'] = math_quiz.evaluate_quiz(user_input, user_id, conversation_id, language)
    return jsonify(res), 200

@app.route("/mathquiz/gen", methods=["POST"])
def gen_quiz():
    data = request.get_json()
    conversation_id = data['conversation_id']
    user_id = data['user_id']

    data = data["prompt"]
    language = data['language']
    mathproblem = data["mathproblem"]
    multiple = data["type"]
    mathquiz = math_quiz.generate_quiz(mathproblem, multiple, user_id, conversation_id, language)
    # Return the result as JSON
    result = {"math_quiz": mathquiz}
    return jsonify(result), 200

@app.route("/mathquiz/answer", methods=["POST"])
def answers():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    language = data['language']
    answers = math_quiz.reveal_answers(user_id, conversation_id, language)
    # Return the result as JSON
    result = {"answers": answers}
    return jsonify(result), 200

@app.route('/math/lesson', methods = ['POST'])
def lesson():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    print(data)
    data = data['prompt']
    question = data
    language = data['language']
    res = {}
    res['response'] = math_lesson.plan_lessons_chat(question, user_id, conversation_id, language)
    return jsonify(res), 200

@app.route('/video/summarize', methods = ['POST'])
def summarizevid():
    data = request.get_json()
    print('Recieved Data: ', data)
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    data = data['prompt']
    url =  data['url']
    userinput = data['userinput']
    language = data['language']

    res = {}
    res['summary'] = ytgpt.summarize(url, user_id, conversation_id, userinput, language)
    return jsonify(res), 200

@app.route('/video/quiz', methods = ['POST'])
def videoquiz():
    data = request.get_json()
    print('Recieved Data: ', data)
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    data = data['prompt']
    vidUrl =  data['url']
    num_questions =  data['num_question']
    quiz_type =  data['quiz_type']
    language = data['language']
    res = {}
    res['video_quiz'] = ytgpt.get_quiz(vidUrl, user_id, conversation_id, num_questions, quiz_type, language)
    return jsonify(res), 200

@app.route('/video/answers', methods = ['POST'])
def videoquizanswers():
    data = request.get_json()
    print('Recieved Data: ', data)
    vidUrl =  data['url']
    user_id = data['user_id']
    language = data['language']
    #conversation_id = data['conversation_id']
    res = {}
    res['answers'] = ytgpt.generate_answers(vidUrl, user_id, language)
    return jsonify(res), 200

@app.route('/video/chat', methods = ['POST'])
def videochat():
  data = request.get_json()
  print('Recieved Data: ', data)

  user_id = data['user_id']

  data = data['prompt']
  vidUrl =  data['url']
  language = data['language']
  #conversation_id = data['conversation_id']
  prompt = data['videoChatPrompt']
  res = {}
  res['answer'] = ytgpt.chatyoutube(vidUrl, user_id, prompt, language)
  return jsonify(res), 200

@app.route('/detectai', methods = ['POST'])
def aidetect():
  data = request.get_json()
  print('Recieved Data: ', data)
  data = data['prompt']
  text = data['text']
  res = {}
  res['result'] = detect_ai(text)
  return jsonify(res), 200

@app.route('/checkplag', methods = ['POST'])
def plagiarism():
  data = request.get_json()
  print('Recieved Data: ', data)
  data = data['prompt']
  text = data['text']
  res = {}
  res['report'] = get_plag_report(text)
  return jsonify(res), 200

@app.route('/powerpoint', methods = ['POST'])
def powerpoint():
    data = request.get_json()
    print('Recieved Data: ', data)
    user_id =  data['user_id']

    description = data['prompt']['description']
    grade = data['prompt']['grade']
    subject = data['prompt']['subject']
    number_of_slides = data['prompt']['number_of_slides']
    language = data['prompt']['language']
    res = {}
    file_path = aipresentation.get_presentation(description ,grade ,subject ,number_of_slides, user_id, language)
    res['presentation_link'] = f"{request.host_url}{file_path}"
    return jsonify(res), 200

@app.route('/GeneratedPresentations/<path:path>')
def send_generated_image(path):
    return send_file(f'GeneratedPresentations/{path}', as_attachment=True)

@app.route('/chattitles', methods = ['POST'])
def title():
    data = request.get_json()
    print('Recieved Data: ', data)
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    res = {}
    res['title'] = get_title(user_id, conversation_id)
    return jsonify(res), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5000')
