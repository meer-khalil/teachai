from flask import Flask, render_template, jsonify, request
import openai
import config
import lessonplannerapi
import quizapi
import mathapi
import mathlesson
import aiapi
import ytgpt


def page_not_found(e):
  return render_template('404.html'), 404


app = Flask(__name__)
app.config.from_object(config.config['development'])

app.register_error_handler(404, page_not_found)


# @app.route('/khalil')
# def khalil():
#     res = {}
#     res['message'] = "Hello I am Khalil!"
#     return jsonify(res)


@app.route('/lessonplanner', methods = ['POST'])
def lessonplanner():
    data = request.get_json()

    print('data: ', data)

    question = data['prompt']    
    user_id = data['id']    
    # question = request.form['prompt']
    # user_id = request.form['id']
    res = {}
    res['answer'] = lessonplannerapi.plan_lessons_chat(question, user_id)
    return jsonify(res), 200

@app.route('/quiz', methods = ['POST', 'GET'])
def quiz():
    data = request.get_json()

    user_id = data['id']

    data = data['prompt']
    
    grade = data['grade']
    quiz_topic = data['topic']
    subject = data['subject']
    summary = data['summary']
    quiz_type = data['type']
    qn = data['questionnumber']

    #user_id = request.form['id']
    #grade = request.form['grade']
    #quiz_topic = request.form['topic']
    #subject = request.form['subject']
    #summary = request.form['summary']
    #quiz_type = request.form['type']
    #qn = request.form['questionnumber']
    
    user_input = f"Generate a quiz for grade {grade}, subject: {subject}, topic: {quiz_topic}, type: {quiz_type}, note: {summary}, number of questions: {qn}"
 
    res = {}
    res['answer'] = quizapi.generate_quiz(user_input, user_id)
    return jsonify(res), 200

@app.route('/gradeEssay', methods = ['POST'])
def grade():
    data = request.get_json()
    user_id = data['id']
    user_input = data['prompt']

    #user_id = request.form['id']
    #user_input = request.form['prompt']

    res = {}
    res['answer'] = aiapi.grade(user_input, user_id)
    return jsonify(res), 200


@app.route('/gradeEssay/rubric', methods=['POST'])
def rubric():
    data = request.get_json()
    user_id = data["id"]

    data = data['prompt']
    essay_question = data["essay_question"]
    grade = data["grade"]

    #essay_question = request.form.get("essay_question")
    #user_id = request.form.get("user_id")
    #grade = request.form.get("grade")
    
    essay_question = essay_question + "for grade:" + grade
    rubric = aiapi.generate_rubric(essay_question, user_id)
    result = {"rubric": rubric}
    return jsonify(result), 200


@app.route("/lessonComp/questions", methods=['POST'])
def gen_questions():
    data = request.get_json()

    #writeup = request.form.get("writeup")
    #user_id = request.form.get("user_id")
    #notes = request.form.get("notes")
    
    user_id = data["id"]
    data = data['prompt']
    writeup = data["writeup"]
    qtype = data["qtype"]
    qnumber = data["qnumber"]

    notes = f"question type: {qtype}, number of questions: {qnumber}"

    # Generate questions
    questions = aiapi.generate_questions(writeup, user_id, notes)
    # Return the result as JSON
    result = {"questions": questions}
    return jsonify(result), 200



@app.route('/lessonComp/chat', methods = ['POST'])
def gen_questions_chat():
    """for generating more questions for the write_up with the chat"""
    data = request.get_json()
    user_id = data['id']
    user_input = data['prompt']

    #user_id = request.form['id']
    #user_input = request.form['prompt']
    
    res = {}
    res['answer'] = aiapi.generate_questions(user_input, user_id)
    return jsonify(res), 200

@app.route("/lessonComp/answer", methods=["POST"])
def answer():
    data = request.get_json()
    user_id = data["id"]
    #user_id = request.form.get("id")
    # Generate answers
    answers = aiapi.generate_answers(user_id)
    result = {"answers": answers}
    return jsonify(result), 200

@app.route('/mathquiz/evaluate', methods = ['POST'])
def index():
    data = request.get_json()
    user_id = data["id"]
    user_input = data["prompt"]
    #user_id = request.form["id"]
    #user_input = request.form["prompt"]
    res = {}
    res['answer'] = mathapi.evaluate_quiz(user_input, user_id)
    return jsonify(res), 200

@app.route("/mathquiz/gen", methods=["POST"])
def gen_quiz():
    data = request.get_json()

    print('\n\nMath Quiz Generator Data: ', data, '\n\n')
    
    user_id = data["id"]
    data = data['prompt']
    mathproblem = data["mathproblem"]
    multiple = data["type"]

    #mathproblem = request.form.get("mathproblem")
    #multiple = request.form.get("type")
    #user_id = request.form.get("id")
    mathquiz = mathapi.generate_quiz(mathproblem, multiple, user_id)
    # Return the result as JSON
    print('mathQuiz: ', mathquiz)
    result = {"mathquiz": mathquiz}
    return jsonify(result), 200

@app.route("/mathquiz/answer", methods=["POST"])
def answers():
    data = request.get_json()
    user_id = data["id"]
    answers = mathapi.reveal_answers(user_id)
    # Return the result as JSON
    result = {"answers": answers}
    return jsonify(result), 200

@app.route('/math/lesson', methods = ['POST'])
def lesson():
    data = request.get_json()
    question = data["prompt"]
    user_id = data["id"]
    #question = request.form["prompt"]
    #user_id = request.form["id"]
    res = {}
    res['answer'] = mathlesson.plan_lessons_chat(question, user_id)
    return jsonify(res), 200

@app.route('/video/summarize', methods = ['POST'])
def summarizevid():
    data = request.get_json()
    user_id =  data['id']
    data = data["prompt"]
    url =  data['url']
    userinput = data['userinput']
    #url = request.form['url']
    #user_id = request.form['id']
    #userinput = request.form['userinput']
    res = {}
    res['answer'] = ytgpt.summarize(url, user_id, userinput)
    return jsonify(res), 200

    return render_template('index.html', **locals())

@app.route('/video/quiz', methods = ['POST'])
def videoquiz():
  data = request.get_json()
  user_id =  data['id']
  data = data['prompt']
  
  vidUrl =  data['url']
  num_questions =  data['num_question']
  quiz_type =  data['quiz_type']
  
  #vidUrl =  request.form['url']
  #user_id =  request.form['id']
  #num_questions =  request.form['num_questions']
  #quiz_type =  request.form['quiz_type']
  res = {}
  res['answer'] = ytgpt.get_quiz(vidUrl, user_id, num_questions, quiz_type)
  return jsonify(res), 200

@app.route('/video/answers', methods = ['POST'])
def videoquizanswers():
  data = request.get_json()

  vidUrl =  data['url']
  user_id =  data['id']
  #vidUrl =  request.form['url']
  #user_id =  request.form['id']
  res = {}
  res['answer'] = ytgpt.generate_answers(vidUrl, user_id)
  return jsonify(res), 200

@app.route('/video/chat', methods = ['POST'])
def videochat():
  data = request.get_json()

  vidUrl =  data['url']
  user_id =  data['id']
  prompt = data['prompt']
  #vidUrl =  request.form['url']
  #user_id =  request.form['id']
  #prompt = request.form['prompt']
  res = {}
  res['answer'] = ytgpt.chatyoutube(vidUrl, user_id, prompt)
  return jsonify(res), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5000')
