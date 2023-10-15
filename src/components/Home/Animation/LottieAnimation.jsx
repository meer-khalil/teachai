import React from 'react';
// import './styles.css';
import Lottie from 'react-lottie';
import animationData from '../../../animation/iPad/mobile.json'

export default function LottieAnimation() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <div className=' shadow-lg'>
      <Lottie
        options={defaultOptions}
      />
    </div>
  );
}