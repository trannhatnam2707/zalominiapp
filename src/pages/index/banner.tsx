import React, { FC } from "react";
import { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Box } from "zmp-ui";

// Import trực tiếp các ảnh từ thư mục docs/dummy
import banner1 from "../../../docs/dummy/banner-1.webp";
import banner2 from "../../../docs/dummy/banner-2.webp";
import banner3 from "../../../docs/dummy/banner-3.webp";
import banner4 from "../../../docs/dummy/banner-4.webp";
import banner5 from "../../../docs/dummy/banner-5.webp";

export const Banner: FC = () => {
  // Tạo mảng chứa các biến ảnh đã import
  const banners = [banner1, banner2, banner3, banner4, banner5];

  return (
    <Box className="bg-white" pb={4}>
      <Swiper
        modules={[Pagination]}
        pagination={{
          clickable: true,
        }}
        autoplay
        loop
        cssMode
      >
        {banners.map((banner, i) => (
            <SwiperSlide key={i} className="px-4">
              <Box
                className="w-full rounded-lg aspect-[2/1] bg-cover bg-center bg-skeleton"
                style={{ backgroundImage: `url(${banner})` }}
              />
            </SwiperSlide>
          ))}
      </Swiper>
    </Box>
  );
};