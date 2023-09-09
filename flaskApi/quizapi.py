#!/usr/bin/env python3
import openai
import config
import os
import json
from gptutils import create_chat_data


def generate_quiz(prompt, user_id, conversation_id):
    """
    prompt: prompt by user
    user_id: user ID
    returns: Quiz
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "You are a helpful assistant for teachers, designed to generate quizzes based on the subject, grade level, and learning objectives."
    messages = None
    filename = "ChatHistory/{}_{}.json".format(user_id, conversation_id)

    if not os.path.exists('ChatHistory'):
        os.makedirs('ChatHistory')

    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None
        first_message = f"{prompt}, chatbot name: quiz generator"
        create_chat_data(user_id, conversation_id, first_message)

    final_prompt = f"""As a helpful assistant for teachers, your task is to generate quizzes based on inputs from the teacher:
the subject, grade level, topic, Teacher's note (optional to specify learning objective for example) and the type of the quiz needed (multiple choice, true or false or both options)(if both is selected than the questions should include multiple choice and yes or no questions).
Maintain a polite, respectful, and empathetic tone, and always strive to exceed the teacher's expectations with your helpfulness and resourcefulness.
Only answer questions related to your task, do not engage in anything outside the scope of generating quizzes, The generated quiz should also include the solution
Teacher's input: "{prompt}", Do not respond if the message is not related to generating quizzes, or grading the quiz and provide feedback on students performance if asked"""

    if not messages:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": final_prompt+"start with Here is your quiz"}
        ]
    else:
        messages.append({"role": "user", "content": final_prompt})

    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']

    messages.append(message)
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)
    return message['content'].replace('\n','<br>' )
