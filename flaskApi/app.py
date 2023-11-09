from flask import Flask, render_template, jsonify, request, send_file, Response
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
import json
import openai

def page_not_found(e):
  return render_template('404.html'), 404


app = Flask(__name__)
app.config.from_object(config.config['development'])

app.register_error_handler(404, page_not_found)

openai.api_key = config.DevelopmentConfig.OPENAI_KEY
def send_messages(messages):
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        stream=True
    )

def event_stream(messages, filename):
    full_message = []
    for line in send_messages(messages=messages):
        #print(line)
        text = line.choices[0].delta.get('content', '')
        if len(text): 
            full_message.append(text)
            yield text
    str_message = ''.join(full_message)
    message = {"role": "assistant", "content": str_message}
    messages.append(message)
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)
    

@app.route('/lessonplanner', methods = ['GET', 'POST'])
def lessonplanner():
    data = request.get_json()

    print('Here is your Data: ', data)

    conversation_id = data['conversation_id']
    user_id = data['user_id']

    data = data['prompt']
    language = data['language']
    question = str(data)

    #res = {}
    #res['lesson_plan'] = lessonplannerapi.plan_lessons_chat(question, user_id,conversation_id, language)
    messages, filename = lessonplannerapi.plan_lessons_chat(question, user_id,conversation_id, language)
    
    return Response(event_stream(messages, filename), mimetype='text/event-stream')
    #return jsonify(res), 200

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
    #res['quiz'] = quizapi.generate_quiz(user_input, user_id, conversation_id, language)
    #return jsonify(res), 200
    messages, filename = quizapi.generate_quiz(user_input, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route('/gradeEssay', methods = ['POST'])
def grade():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    
    data = data['prompt']
    data = json.loads(data)
    print('gradeEssay: ', data['language'])
    language = data['language']
    user_input = data
    messages, filename = grade_essay.grade(user_input, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route('/gradeEssay/rubric', methods=['POST'])
def rubric():
    data = request.get_json()
    essay_question = data["essay_question"]
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    grade = data["grade"]
    language = data['language']
    essay_question = essay_question + "for grade:" + grade
    messages, filename = grade_essay.generate_rubric(essay_question, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route('/lessonComp/chat', methods = ['POST'])
def gen_questions_chat():
    """for generating more questions for the write_up with the chat"""
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    data = data['prompt']
    user_input = data
    language = data['language']
    messages, filename = lesson_comp.generate_questions(user_input, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

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
    messages, filename = lesson_comp.generate_questions(writeup, user_id, conversation_id, notes, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route('/mathquiz/evaluate', methods = ['POST'])
def index():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    user_input = data["prompt"]
    language = data['language']
    messages, filename = math_quiz.evaluate_quiz(user_input, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route("/mathquiz/gen", methods=["POST"])
def gen_quiz():
    data = request.get_json()
    conversation_id = data['conversation_id']
    user_id = data['user_id']

    data = data["prompt"]
    language = data['language']
    mathproblem = data["mathproblem"]
    multiple = data["type"]
    messages, filename = math_quiz.generate_quiz(mathproblem, multiple, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route("/mathquiz/answer", methods=["POST"])
def answers():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']
    data = data['prompt']
    language = data['language']
    messages, filename = math_quiz.reveal_answers(user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

@app.route('/math/lesson', methods = ['POST'])
def lesson():
    data = request.get_json()
    user_id = data['user_id']
    conversation_id = data['conversation_id']

    print(data)
    data = data['prompt']
    question = data
    language = data['language']

    messages, filename = math_lesson.plan_lessons_chat(question, user_id, conversation_id, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

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
    messages, filename = ytgpt.summarize(url, user_id, conversation_id, userinput, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

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
    userinput = data['userinput']
    language = data['language']

    messages, filename = ytgpt.get_quiz(vidUrl, user_id, conversation_id, userinput, num_questions, quiz_type, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

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
    messages, filename =  ytgpt.chatyoutube(vidUrl, user_id, prompt, language)
    return Response(event_stream(messages, filename), mimetype='text/event-stream')

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
