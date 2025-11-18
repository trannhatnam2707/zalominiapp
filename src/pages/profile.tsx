// src/pages/profile.tsx - ĐÃ XÓA PHẦN ĐÁNH GIÁ VÀ LIÊN HỆ
import React, { FC } from "react";
import { Box, Header, Icon, Page, Text } from "zmp-ui";
import subscriptionDecor from "static/subscription-decor.svg";
import { ListRenderer } from "components/list-renderer";
import { useRecoilCallback } from "recoil";
import { userState } from "state";
import { useNavigate } from "react-router";

const Subscription: FC = () => {
  const requestUserInfo = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const userInfo = await snapshot.getPromise(userState);
        console.warn("Các bên tích hợp có thể sử dụng userInfo ở đây...", {
          userInfo,
        });
      },
    []
  );

  return (
    <Box className="m-4" onClick={requestUserInfo}>
      <Box
        className="bg-green text-white rounded-xl p-4 space-y-2"
        style={{
          backgroundImage: `url(${subscriptionDecor})`,
          backgroundPosition: "right 8px center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Text.Title className="font-bold">Đăng ký thành viên</Text.Title>
        <Text size="xxSmall">Tích điểm đổi thưởng, mở rộng tiện ích</Text>
      </Box>
    </Box>
  );
};

const Personal: FC = () => {
  const navigate = useNavigate();

  return (
    <Box className="m-4">
      <ListRenderer
        title="Cá nhân"
        items={[
          {
            left: <Icon icon="zi-user" />,
            right: (
              <Box flex>
                <Text.Header className="flex-1 items-center font-normal">
                  Thông tin tài khoản
                </Text.Header>
                <Icon icon="zi-chevron-right" />
              </Box>
            ),
            onClick: () => navigate("/account-info"),
          },
          {
            left: <Icon icon="zi-clock-2" />,
            right: (
              <Box flex>
                <Text.Header className="flex-1 items-center font-normal">
                  Lịch sử đơn hàng
                </Text.Header>
                <Icon icon="zi-chevron-right" />
              </Box>
            ),
            onClick: () => navigate("/order-history"),
          },
        ]}
        renderLeft={(item) => item.left}
        renderRight={(item) => item.right}
        onClick={(item) => item.onClick?.()}
      />
    </Box>
  );
};

const ProfilePage: FC = () => {
  return (
    <Page>
      <Header showBackIcon={false} title="&nbsp;" />
      <Subscription />
      <Personal />
    </Page>
  );
};

export default ProfilePage;