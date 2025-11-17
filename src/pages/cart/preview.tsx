// src/pages/cart/preview.tsx - CẬP NHẬT SỬ DỤNG MANUAL PHONE

import { DisplayPrice } from "components/display/price";
import React, { FC, useState } from "react";
import { useRecoilValue, useRecoilValueLoadable, useSetRecoilState } from "recoil";
import { 
  totalPriceState, 
  totalQuantityState, 
  cartState,
  selectedStoreState,
  selectedDeliveryTimeState,
  deliveryAddressState,
  orderNoteState,
  userState,
  manualPhoneState, // ✅ Đổi từ phoneState sang manualPhoneState
} from "state";
import { Box, Button, Text, useSnackbar } from "zmp-ui";
import { createOrder } from "../../../services/ordersService";

export const CartPreview: FC = () => {
  const quantity = useRecoilValue(totalQuantityState);
  const totalPrice = useRecoilValue(totalPriceState);
  const cart = useRecoilValue(cartState);
  const setCart = useSetRecoilState(cartState);
  
  const selectedStore = useRecoilValue(selectedStoreState);
  const deliveryTime = useRecoilValue(selectedDeliveryTimeState);
  const deliveryAddress = useRecoilValue(deliveryAddressState);
  const orderNote = useRecoilValue(orderNoteState);
  
  const user = useRecoilValueLoadable(userState);
  const manualPhone = useRecoilValue(manualPhoneState); // ✅ Lấy số điện thoại thủ công
  
  const [isProcessing, setIsProcessing] = useState(false);
  const snackbar = useSnackbar();

  const handleOrder = async () => {
    console.log("=== BẮT ĐẦU ĐẶT HÀNG ===");
    
    try {
      setIsProcessing(true);
      
      // 1. Validate giỏ hàng
      if (!cart || cart.length === 0) {
        throw new Error("Giỏ hàng trống!");
      }
      
      // 2. Validate cửa hàng
      if (!selectedStore) {
        throw new Error("Vui lòng chọn cửa hàng!");
      }
      
      // 3. ✅ KIỂM TRA SỐ ĐIỆN THOẠI THỦ CÔNG
      console.log("📱 Manual phone:", manualPhone);
      
      if (!manualPhone || manualPhone.length < 10) {
        throw new Error("Vui lòng nhập số điện thoại hợp lệ (10 số)!");
      }
      
      // 4. Validate địa chỉ
      if (!deliveryAddress || deliveryAddress.trim() === "") {
        throw new Error("Vui lòng nhập địa chỉ giao hàng!");
      }
      
      // 5. Validate thời gian
      if (!deliveryTime || typeof deliveryTime !== 'number') {
        throw new Error("Vui lòng chọn thời gian nhận hàng!");
      }
      
      // 6. ✅ LẤY THÔNG TIN USER VÀ PHONE
      const userName = user.state === "hasValue" ? user.contents.name : "Khách hàng";
      const userPhone = manualPhone; // ✅ Sử dụng số điện thoại thủ công
      const userAvatar = user.state === "hasValue" ? user.contents.avatar : "";
      
      console.log("👤 User Name:", userName);
      console.log("📱 User Phone:", userPhone);
      
      // 7. Tạo order data
      const orderData = {
        userId: userPhone,
        userName: userName,
        userAvatar: userAvatar,
        cart: cart,
        totalPrice: totalPrice,
        totalQuantity: quantity,
        selectedStore: selectedStore,
        deliveryTime: deliveryTime,
        deliveryAddress: deliveryAddress,
        note: orderNote || "",
      };
      
      console.log("📦 Order Data:", orderData);
      
      // 8. Lưu đơn hàng
      console.log("🚀 Đang lưu đơn hàng...");
      const orderId = await createOrder(orderData);
      console.log("✅ Đơn hàng đã lưu! ID:", orderId);
      
      // 9. Xóa giỏ hàng
      setCart([]);
      
      // 10. Thông báo thành công
      snackbar.openSnackbar({
        type: "success",
        text: "Đặt hàng thành công!",
        duration: 3000,
      });
      
      console.log("=== HOÀN TẤT ===");
      
    } catch (error) {
      console.error("❌ Lỗi:", error);
      
      snackbar.openSnackbar({
        type: "error",
        text: error instanceof Error ? error.message : "Có lỗi xảy ra!",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Hiển thị trạng thái số điện thoại
  const getPhoneStatus = () => {
    if (!manualPhone) return "⚠️ Chưa nhập SĐT";
    if (manualPhone.length < 10) return "⚠️ SĐT chưa đủ 10 số";
    return `📱 ${manualPhone}`;
  };

  return (
    <Box flex className="sticky bottom-0 bg-background p-4 space-x-4">
      <Box
        flex
        flexDirection="column"
        justifyContent="space-between"
        className="min-w-[120px] flex-none"
      >
        <Text className="text-gray" size="xSmall">
          {quantity} sản phẩm
        </Text>
        <Text.Title size="large">
          <DisplayPrice>{totalPrice}</DisplayPrice>
        </Text.Title>
        {/* ✅ Debug: Hiển thị trạng thái phone */}
        <Text className="text-gray" size="xxxSmall">
          {getPhoneStatus()}
        </Text>
      </Box>
      <Button
        type="highlight"
        disabled={!quantity || isProcessing || !manualPhone || manualPhone.length < 10}
        fullWidth
        onClick={handleOrder}
        loading={isProcessing}
      >
        {isProcessing ? "Đang xử lý..." : "Đặt hàng"}
      </Button>
    </Box>
  );
};