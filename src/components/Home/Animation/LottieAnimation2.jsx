import React from 'react';
// import './styles.css';
import Lottie from 'react-lottie';
import animationData from '../../../animation/iPad/descktop.json'

export default function LottieAnimation2() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <div className=''>
      <Lottie
        options={defaultOptions}
      />
    </div>
  );
}