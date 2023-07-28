import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { backend_url } from '../../util/variables';

const BlogPost = () => {
    // Access the dynamic value from the route parameters

    const [post, setPost] = useState(null)

    const { postId } = useParams();


    const fetchPost = async () => {
        try {
            const { data } = await axios.get((backend_url ? backend_url : '') + `/post/${postId}`)
            setPost(data.post)
        } catch (error) {
            alert('Hello Posts blog Error')
        }
    }

    useEffect(() => {

        fetchPost()

    }, [])
    // Fetch the data for the specific blog post using the postId
    // ...

    return (
        <div className=' max-w-[1440px] mx-auto'>
            <div className=' mx-3 md:mx-8'>

                {
                    post ? (
                        <>
                            <img src={post.image.url} className=' h-[20rem] w-full' alt="" />
                            <div className=' my-5'>
                                <h3 className='text-3xl md:text-4xl'>{post.title}</h3>
                                <p className=' text-lg md:text-xl'>{post.longDescription}</p>
                            </div>
                        </>
                    ) : (
                        <div>Loading</div>
                    )
                }
            </div>

        </div>
    );
};

export default BlogPost;
