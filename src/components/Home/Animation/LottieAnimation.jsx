// import React, { useEffect, useRef } from 'react';
// import lottie from 'lottie-web'; // Import the Lottie library
// import animationData from '../../../animation/Front Panel/images/8c35f339-0595-4faf-9f57-7b65751195c1.json'; // Import your animation JSON file

// function LottieAnimation() {
//   const containerRef = useRef(null);

//   useEffect(() => {
//     // Load and display the animation when the component mounts
//     let animation = null;
//     if (containerRef?.current) {
//       animation = lottie.loadAnimation({/
//         container: containerRef.current,
//         animationData: animationData, // Pass your animation JSON
//         loop: true,
//         autoplay: true,
//       });
//     }

//     // Cleanup when the component unmounts
//     return () => {
//       animation?.destroy();
//     };
//   }, []);

//   return (
//     <div ref={containerRef} style={{ width: '100%', maxWidth: '1640px', margin: 'auto auto', height: '100vh' }}>
//       {/* Container for the Lottie animation */}
//     </div>
//   );
// }

// export default LottieAnimation;
