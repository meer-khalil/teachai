#!/usr/bin/env python3
import openai
import config
import json
import re
import os
import textwrap
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def summarize(vidUrl, user_id, userinput="none"):
    """
    vidUrl: url to the youtube video
    useripnut: for the chat function
    returns: response content
    """
    openai.api_key = config.DevelopmentConfig.OPENAI_KEY
    completion = openai.ChatCompletion()
    model = "gpt-3.5-turbo"
    system = "you are a helpfull assistant"
    PROMPT_STRING = "Write a short summary of the following video:\n\n<<SUMMARY>>\n"
    messages = None
    video_id = get_video_id(vidUrl)
    if video_id == "Invalid YouTube link":
        return video_id

    filename = "{}_{}_history.json".format(user_id, video_id)
    try:
        with open(filename, 'r') as openfile:
            messages = json.load(openfile)
    except:
        messages = None
    if messages:
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
    if userinput != "none":
        PROMPT_STRING = f"""{userinput} questions for the following video:\n\n<<SUMMARY>>\n"""
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
    """for idx, summary in enumerate(summaries):
        print(f"({idx}) - {summary}\n")
    print(f"(Final Summary) - {final_summary}")"""
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