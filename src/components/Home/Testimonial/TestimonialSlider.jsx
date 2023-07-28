import { Navigation, Pagination, Scrollbar, A11y } from 'swiper';

import { Swiper, SwiperSlide } from 'swiper/react';

import { useMediaQuery } from '@react-hook/media-query';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

import './TestimonialSlider.css'
import Testimonial from './Testimonial'

export default function TestimonialSlider() {

    const isMobile = useMediaQuery('(max-width: 680px)');


    const containerStyle = {
        paddingBottom: '100px',
        // backgroundColor: 'gray',
        paddingLeft: '50px',
        paddingRight: '50px',
        width: '100%',
      };
    
      const padding = '20px'
      if (isMobile) {
        containerStyle.paddingLeft = padding;
        containerStyle.paddingRight = padding;
        containerStyle.paddingBottom = '50px'
    }

    return (
        <Swiper
            // install Swiper modules
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            // spaceBetween={120}
            // slidesPerView={3}
            navigation
            // pagination={{ clickable: true }}
            // scrollbar={{ draggable: true }}
            onSwiper={(swiper) => console.log(swiper)}
            onSlideChange={() => console.log('slide change')}
            breakpoints={
                {
                    // when window width is >= 320px
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 70,

                    },
                    // when window width is >= 480px
                    // 480: {
                    //     slidesPerView: 2,
                    //     spaceBetween: 50
                    // },
                    // // when window width is >= 640px
                    640: {
                        slidesPerView: 3,
                        spaceBetween: 50
                    }
                }
            }
            style={containerStyle}
        >
            {
                [0, 1, 2, 3, 4, 5, 6].map((el, i) => (
                    <SwiperSlide key={i}>
                        <Testimonial />
                    </SwiperSlide>
                ))
            }
        </Swiper >
    );
};