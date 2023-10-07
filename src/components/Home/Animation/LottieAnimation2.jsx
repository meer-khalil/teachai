import React from 'react';
// import './styles.css';
import Lottie from 'react-lottie';
import animationData from '../../../animation/iPad/iPad.json'

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
    <div>
      <Lottie
        options={defaultOptions}
      />
    </div>
  );
}