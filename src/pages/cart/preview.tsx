// src/pages/cart/preview.tsx - PHIÊN BẢN CÓ XIN QUYỀN SĐT

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
  phoneState,
  requestPhoneTriesState // ✅ Thêm này
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
  const phone = useRecoilValueLoadable(phoneState);
  
  // ✅ State để kích hoạt yêu cầu quyền
  const setRequestPhone = useSetRecoilState(requestPhoneTriesState);
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
      
      // 3. ✅ KIỂM TRA VÀ YÊU CẦU QUYỀN SỐ ĐIỆN THOẠI
      console.log("📱 Phone state:", phone.state);
      console.log("📱 Phone contents:", phone.contents);
      
      if (phone.state === "loading") {
        throw new Error("Đang tải thông tin số điện thoại...");
      }
      
      if (phone.state === "hasError" || !phone.contents) {
        console.log("⚠️ Chưa có số điện thoại, yêu cầu quyền...");
        setRequestPhone((tries) => tries + 1); // Kích hoạt request
        throw new Error("Vui lòng cấp quyền truy cập số điện thoại!");
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
      const userPhone = phone.contents as string; // ✅ Lấy số thật từ Zalo
      const userAvatar = user.state === "hasValue" ? user.contents.avatar : "";
      
      console.log("👤 User Name:", userName);
      console.log("📱 User Phone:", userPhone); // ✅ Log để kiểm tra
      
      // 7. Tạo order data
      const orderData = {
        userId: userPhone,           // ✅ Số điện thoại thật
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
    if (phone.state === "loading") return "Đang tải...";
    if (phone.state === "hasError" || !phone.contents) return "⚠️ Chưa có quyền";
    return `📱 ${phone.contents}`;
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
        disabled={!quantity || isProcessing}
        fullWidth
        onClick={handleOrder}
        loading={isProcessing}
      >
        {isProcessing ? "Đang xử lý..." : "Đặt hàng"}
      </Button>
    </Box>
  );
};