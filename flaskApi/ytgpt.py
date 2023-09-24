#!/usr/bin/env python3
import openai
import config
import json
import re
import os
import textwrap
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from gptutils import create_chat_data

def openhistory(filename):
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None
    return messages

def savehistory(filename, messages):
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)

def aicomplete(prompt, filename):
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "you are a helpfull assistant"
    messages = openhistory(filename)
    if messages:
        message= {"role": "user", "content": prompt}
        messages.append(message)
        response = completion.create(model=model, messages=messages)
    else:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    messages.append(message)
    if filename != 'dontsave':
        savehistory(filename, messages)
    return message['content'].replace('\n','<br>' )

def summarize(vidUrl, user_id, conversation_id, userinput=None, language="English"):
    """
    vidUrl: url to the youtube video
    useripnut: for the chat function
    returns: response content
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "you are a helpfull assistant"
    initialize = None
    PROMPT_STRING = f"Write a short summary in {language} of the following video:\n\n<<SUMMARY>>\n"
    messages = None
    video_id = get_video_id(vidUrl)
    if video_id == "Invalid YouTube link":
        return video_id

    filename = "ChatHistory/{}_{}.json".format(user_id, conversation_id)
    if not os.path.exists('ChatHistory'):
        os.makedirs('ChatHistory')
    
    messages = openhistory(filename)
    if messages == None:
        initialize = True
    if messages and userinput != 'longv':
        #print(messages)
        message= {"role": "user", "content": userinput}
        messages.append(message)
        response = completion.create(model=model, messages=messages)
        message = response['choices'][0]['message']
        messages.append(message)
        return message['content'].replace('\n','<br>' )

    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    formatter = TextFormatter()
    transcript = formatter.format_transcript(transcript)
    video_length = len(transcript)
    chunk_size = 4000 if video_length >= 25000 else 2000
    chunks = textwrap.wrap(transcript, chunk_size)
    summaries = list()

    for chunk in chunks:
        prompt = PROMPT_STRING.replace("<<SUMMARY>>", chunk)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        response = completion.create(model=model, messages=messages)
        summary = re.sub("\s+", " ", response.choices[0]['message']['content'].strip())
        summaries.append(summary)
    chunk_summaries = " ".join(summaries)
    if userinput == 'longv':
        return chunk_summaries
    prompt = PROMPT_STRING.replace("<<SUMMARY>>", chunk_summaries)
    messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
    response = completion.create(model=model, messages=messages)
    message = response['choices'][0]['message']
    messages.append(message)
    with open(filename, "w") as outfile:
        json.dump(messages, outfile)
    final_summary = response['choices'][0]['message']['content']
    if initialize:
        first_message = f"{final_summary}, chatbot name: youtube video summarizer"
        create_chat_data(user_id, conversation_id, first_message)
    #"""for idx, summary in enumerate(summaries):
    #    print(f"({idx}) - {summary}\n")
    #print(f"(Final Summary) - {final_summary}")"""
    return message['content'].replace('\n','<br>' )

def get_video_id(youtube_link):
    # Define a regular expression pattern to match the video ID
    pattern = r"(?:v=|v\/|vi=|vi\/|youtu.be\/|embed\/|\/v\/|youtu\.be\/|\/e\/|youtu\.be\/|v=|v%3D|youtube.com\/watch\?v=|%2Fvideos%2F|embed%\S+|youtu.be%2F|ytscreen.com\/\?video=|youtube.com\/embed\/)([^#?\&\n]*)"
    # Search for the video ID in the YouTube link using the regular expression pattern
    match = re.search(pattern, youtube_link)
    if match:
        # Extract the video ID from the match object
        video_id = match.group(1)
        return video_id
    else:
        return "Invalid YouTube link"

def generate_quiz(summary, num_questions, quiz_type, language="English"):
    prompt = f"{summary}\n\nBased on the above summary, generate a {quiz_type} quiz with {num_questions} questions.\n\nMake sure to not provide the answers just the questions for the quiz \n\nstart your message with '{quiz_type} quiz:', your response should be in {language}"
    response = aicomplete(prompt, filename='dontsave')
    return response

def get_quiz(vidUrl, user_id, conversation_id, num_questions, quiz_type, language="English"):
    summary = summarize(vidUrl, user_id,  conversation_id, userinput='longv', language=language)
    if summary == "Invalid YouTube link":
        return summary
    video_id = get_video_id(vidUrl)
    quizfile = "Quizzes/{}_{}.json".format(user_id, video_id)
    if not os.path.exists('Quizzes'):
        os.makedirs('Quizzes')
    quiz = generate_quiz(summary, num_questions, quiz_type, language)
    messages = [{"role": "user", "content": quiz.replace('<br>', '\n')}]
    savehistory(quizfile, messages)
    return quiz

def generate_answers(vidUrl, user_id, language="English"):
    video_id = get_video_id(vidUrl)
    quizfile = "Quizzes/{}_{}.json".format(user_id, video_id)
    try:
        with open(quizfile, 'r') as openfile:
            message = json.load(openfile)
            quiz = message[0]['content'].replace('\n','<br>' )
    except Exception as e:
        print(e)
        quiz = get_quiz(vidUrl, user_id, '10', 'true/ false and multiple choice', language)
        quiz  = quiz.replace('\n','<br>' )
    summary = summarize(vidUrl, user_id, userinput='longv', language=language)
    if summary == "Invalid YouTube link":
        return summary
    print(quiz)
    prompt = f"{summary}\n\nBased on the above summary, generate answers for this quiz's questions: \n\n{quiz}\n\nstart your message with 'Answers for the quiz:' your response should be in {language} "
    answers = aicomplete(prompt, filename='dontsave')
    return answers

def chatyoutube(vidUrl, user_id, prompt, language="english"):
    video_id = get_video_id(vidUrl)
    conversation_id = user_id+video_id
    filename = "Quizzes/{}_{}.json".format(user_id, video_id)
    quiz = openhistory(filename)
    summary = summarize(vidUrl, user_id, conversation_id, userinput = 'longv', language=language)
    if summary == "Invalid YouTube link":
        return summary
    if quiz == None:
        #quiz = get_quiz(vidUrl, user_id, conversation_id, '10', 'true/ false and multiple choice')
        #quiz  = quiz.replace('\n','<br>' )
        fprompt = f"This is a summary for a youtube video:\n\n{summary}\n\nprompt: {prompt}\n\nOnly answer the prompt if its related to the summary, respond in {language}"
    fprompt = f"{quiz}\n\nthis is a quiz for a youtube video, this is it's summary:\n\n{summary}\n\nprompt: {prompt}\n\nOnly answer the prompt if its related to the summary, respond in {language}"
    response =aicomplete(fprompt, filename='dontsave')
    return response