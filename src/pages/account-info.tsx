// src/pages/account-info.tsx
import React, { FC, useState, useEffect } from "react";
import { Box, Header, Page, Text, Input, Button, useSnackbar } from "zmp-ui";
import { useRecoilValueLoadable, useRecoilState } from "recoil";
import { userState, manualPhoneState, deliveryAddressState } from "state";

const AccountInfoPage: FC = () => {
  const user = useRecoilValueLoadable(userState);
  const [phone, setPhone] = useRecoilState(manualPhoneState);
  const [address, setAddress] = useRecoilState(deliveryAddressState);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempAddress, setTempAddress] = useState(address);
  
  const snackbar = useSnackbar();

  useEffect(() => {
    setTempPhone(phone);
    setTempAddress(address);
  }, [phone, address]);

  const handleSave = () => {
    // Validate số điện thoại
    if (tempPhone && tempPhone.length !== 10) {
      snackbar.openSnackbar({
        type: "error",
        text: "Số điện thoại phải có 10 số!",
        duration: 3000,
      });
      return;
    }

    // Lưu thông tin vào Recoil state
    setPhone(tempPhone);
    setAddress(tempAddress);
    
    // ✅ Lưu vào localStorage để giữ lại khi reload
    if (tempPhone) {
      localStorage.setItem('userPhone', tempPhone);
    }
    if (tempAddress) {
      localStorage.setItem('userAddress', tempAddress);
    }
    
    setIsEditing(false);

    snackbar.openSnackbar({
      type: "success",
      text: "Cập nhật thông tin thành công!",
      duration: 3000,
    });
  };

  const handleCancel = () => {
    setTempPhone(phone);
    setTempAddress(address);
    setIsEditing(false);
  };

  const userName = user.state === "hasValue" ? user.contents.name : "Khách hàng";
  const userAvatar = user.state === "hasValue" ? user.contents.avatar : "";

  return (
    <Page className="bg-background">
      <Header title="Thông tin tài khoản" />
      
      <Box className="m-4 space-y-4">
        {/* Avatar và Tên */}
        <Box className="bg-white rounded-xl p-4 flex items-center space-x-4">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <Box className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </Text>
            </Box>
          )}
          <Box>
            <Text.Title size="large">{userName}</Text.Title>
            <Text size="xSmall" className="text-gray">
              Thành viên
            </Text>
          </Box>
        </Box>

        {/* Thông tin chi tiết */}
        <Box className="bg-white rounded-xl p-4 space-y-4">
          <Text.Title size="small">Thông tin cá nhân</Text.Title>

          {/* Số điện thoại */}
          <Box className="space-y-2">
            <Text size="xSmall" className="text-gray font-medium">
              Số điện thoại
            </Text>
            {isEditing ? (
              <Input
                type="text"
                placeholder="Nhập số điện thoại (10 số)"
                value={tempPhone}
                onChange={(e) => {
                  const phoneNumber = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setTempPhone(phoneNumber);
                }}
                className="w-full"
              />
            ) : (
              <Text size="small">
                {phone || "Chưa cập nhật số điện thoại"}
              </Text>
            )}
          </Box>

          {/* Địa chỉ */}
          <Box className="space-y-2">
            <Text size="xSmall" className="text-gray font-medium">
              Địa chỉ
            </Text>
            {isEditing ? (
              <Input.TextArea
                placeholder="Nhập địa chỉ của bạn"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                className="w-full"
                maxLength={200}
                showCount
              />
            ) : (
              <Text size="small">
                {address || "Chưa cập nhật địa chỉ"}
              </Text>
            )}
          </Box>

          {/* Nút hành động */}
          <Box className="pt-4 space-y-2">
            {isEditing ? (
              <Box flex className="space-x-2">
                <Button
                  onClick={handleCancel}
                  fullWidth
                  variant="secondary"
                  type="neutral"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSave}
                  fullWidth
                  variant="primary"
                  type="highlight"
                >
                  Lưu thay đổi
                </Button>
              </Box>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                fullWidth
                variant="primary"
                type="highlight"
              >
                Chỉnh sửa thông tin
              </Button>
            )}
          </Box>
        </Box>

        {/* Thông tin bổ sung */}
        <Box className="bg-white rounded-xl p-4 space-y-3">
          <Text.Title size="small">Thông tin khác</Text.Title>
          
          <Box flex className="justify-between items-center">
            <Text size="small" className="text-gray">
              Tên đăng nhập
            </Text>
            <Text size="small" className="font-medium">
              {userName}
            </Text>
          </Box>

          <Box flex className="justify-between items-center">
            <Text size="small" className="text-gray">
              Nguồn tài khoản
            </Text>
            <Text size="small" className="font-medium">
              Zalo
            </Text>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default AccountInfoPage;