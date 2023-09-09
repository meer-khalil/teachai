#!/usr/bin/env python3
import openai
import config
import json
import os
from gptutils import create_chat_data


def generate_rubric(question, user_id, conversation_id):
    """
    question: essay question
    user_id: user ID
    returns: grading cubric
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers, designed to generate grading cubric based on an essay question"
    filename = "Cubrics/{}_{}.json".format(user_id, conversation_id)
    if not os.path.exists('Cubrics'):
        os.makedirs('Cubrics')
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

def grade(essay, user_id, conversation_id):
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
    filename = "ChatHistory/{}_{}.json".format(user_id, conversation_id)
    cubricfile = "Cubrics/{}_{}.json".format(user_id, conversation_id)

    if not os.path.exists('ChatHistory'):
        os.makedirs('ChatHistory')
    
    with open(cubricfile, 'r') as openfile:
            rubric = json.load(openfile)
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None
        first_message = f"{essay}, chatbot name: Grading essays"
        create_chat_data(user_id, conversation_id, first_message)

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
