import axios from 'axios';
import React, { useEffect, useState } from 'react'


import { backend_url } from '../../../util/variables';

import Cross from '../../SVGs/Cross'
import Edit from '../../SVGs/Edit'
import Chatbots from './Chatbots';
import { Route, Routes } from 'react-router-dom';
import History from './History';


const ChatHistory = () => {

  const [posts, setPosts] = useState(null)
  const [post, setPost] = useState(null)


  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [image, setImage] = useState('');


  return (
    <div>
      <Routes>
        <Route path='/' element={<Chatbots />} />
        <Route path='/:chatbot/*' element={<History />} />
      </Routes>
    </div>
  )
}

export default ChatHistory