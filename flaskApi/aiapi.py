#!/usr/bin/env python3
import openai
import config
import pickle
import json

def generate_rubric(question, user_id):
    """
    question: essay question
    user_id: user ID
    returns: grading cubric
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers, designed to generate grading cubric based on an essay question"
    filename = "{}_cubric.json".format(user_id)
    essay = f"""Given the essay question: "{question}", your task is to create a detailed marking rubric that can be used to grade an essay written in response to this question. The rubric should include clear criteria, point allocations, and descriptions for each level of performance. Ensure that the rubric is comprehensive and covers all aspects of a well-written essay, such as content, organization, language, and mechanics. The point distribution is as follows:
Content: 40 points
Organization: 20 points
Language: 20 points
Mechanics: 20 points Total: 100 points
Please focus solely on generating rubrics and grading essays based on the provided criteria. Do not respond to any messages that are not related to these tasks.
"""
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": essay}
    ]
    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    with open(filename, "w") as outfile:
        json.dump(message, outfile)
    return message['content'].replace('\n','<br>' )

def grade(essay, user_id):
    """
    essay: essay by user
    user_id: user ID
    returns: Quiz
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers tasked with grading student essays based on a provided marking rubric"
    messages = None
    filename = "{}_history.json".format(user_id)
    cubricfile = "{}_cubric.json".format(user_id)
    with open(cubricfile, 'r') as openfile:
            rubric = json.load(openfile)
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None

    first_prompt = f"""As a helpful assistant for teachers, You are tasked with grading student essays based on the provided marking rubric and giving feedback for improvement.
    Carefully evaluate each essay according to the rubric's criteria: {rubric}. answer with "ok" if you understand"""
    final_prompt = f"""
    given this student essay:"" {essay} ""
    Carefully evaluate the essay according to the provided rubric's criterias,
    your evaluation should follow this format
    "Total score: ?/100 points
    Content: ?/40 points [explain why]
    Organization: ?/20 points [explain why]
    Language: ?/20 points [explain why]
    Mechanics: ?/20 points [explain why]
    Feedback: [specific constructive feedback]"
    Provide specific and constructive feedback to help the students improve their writing skills. Do not engage in any discussions or answer any questions unrelated to your task of grading essays and providing feedback.
    """

    if not messages:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": first_prompt},
            {"role": "assistant", "content": "ok"},
            {"role": "user", "content": final_prompt}
        ]
    else:
        messages.append({"role": "user", "content": final_prompt})

    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    messages.append(message)
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)
    return message['content'].replace('\n','<br>' )

def generate_questions(prompt, user_id, notes='none'):
    """
    prompt: the write-up provided by the teacher or the students answers
    user_id: user ID
    returns: questions or evaluation and feedback
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers, and your task is to analyze write-ups and generate questions to test students on it"
    filename = "{}_history.json".format(user_id)
    questions_file = "{}_questions.json".format(user_id)
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None

    if (not messages) or (notes != 'none'):
        qprompt = f"""You are a helpful assistant for teachers, and your task is to analyze this write-up and generate questions to test students on it.
        Write-up: "{prompt}",
        Please generate comprehension questions that will help students better understand and engage with the content.
        Your goal is to create thought-provoking and relevant questions that will encourage students to think critically about the material and deepen their understanding.
        Please ensure that the questions cover a range of difficulty levels and address various aspects of the write-up.
        The teacher may chose his preferred question type (multiple choice, true or false or normal questions)
        your answer should start with "Questions: "
        Specefic requirements from the teacher: {notes}.
        Please focus solely on generating rubrics and grading essays based on the provided criteria.
        Do not respond to any messages that are not related to these tasks."""
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": qprompt}
        ]
    else:
        evalprompt = f"""Please evaluate the student answers to comprehension questions based on the provided write-up.
        Carefully assess the accuracy, depth, and clarity of the student's response, and provide constructive feedback that highlights the strengths of their answer,
        identifies areas for improvement, and offers guidance on how to enhance their understanding of the topic.
        Your goal is to help the student refine their response and deepen their comprehension of the material.
        answers: "{prompt}" """
        messages.append({"role": "user", "content": evalprompt})

    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    messages.append(message)
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)
    if notes != 'none':
        with open(questions_file, "w") as outfile:
            json.dump(messages, outfile)
    return message['content'].replace('\n','<br>' )

def generate_answers(user_id):
    """
    prompt: the write-up provided by the teacher or the students answers
    user_id: user ID
    returns: questions or evaluation and feedback
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers, and your task is to analyze write-ups and generate questions to test students on it"
    filename = "{}_questions.json".format(user_id)
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        print("no questions found")
        messages = None
        return None
    messages.append({"role": "user", "content": "please provide the correct answers for the questions, your answer should start with 'Answers: '"})
    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    return message['content'].replace('\n','<br>' )
