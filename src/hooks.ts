import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { matchStatusBarColor } from "utils/device";
import { EventName, events, Payment } from "zmp-sdk";
import { useNavigate, useSnackbar } from "zmp-ui";
import { useRecoilValue, useRecoilValueLoadable, useSetRecoilState } from "recoil";
import {
  cartState,
  totalPriceState,
  totalQuantityState,
  selectedStoreState,
  selectedDeliveryTimeState,
  orderNoteState,
  deliveryAddressState,
  userState,
  phoneState,
} from "state";
import { createOrder } from "../services/ordersService";

export function useMatchStatusTextColor(visible?: boolean) {
  const changedRef = useRef(false);
  useEffect(() => {
    if (changedRef.current) {
      matchStatusBarColor(visible ?? false);
    } else {
      changedRef.current = true;
    }
  }, [visible]);
}

const originalScreenHeight = window.innerHeight;

export function useVirtualKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const detectKeyboardOpen = () => {
      setVisible(window.innerHeight + 160 < originalScreenHeight);
    };
    window.addEventListener("resize", detectKeyboardOpen);
    return () => {
      window.removeEventListener("resize", detectKeyboardOpen);
    };
  }, []);

  return visible;
}

export const useHandlePayment = () => {
  const navigate = useNavigate();
  useEffect(() => {
    events.on(EventName.OpenApp, (data) => {
      if (data?.path) {
        navigate(data?.path, {
          state: data,
        });
      }
    });

    events.on(EventName.OnDataCallback, (resp) => {
      const { appTransID, eventType } = resp;
      if (appTransID || eventType === "PAY_BY_CUSTOM_METHOD") {
        navigate("/result", {
          state: resp,
        });
      }
    });

    events.on(EventName.PaymentClose, (data = {}) => {
      const { zmpOrderId } = data;
      navigate("/result", {
        state: { data: { zmpOrderId } },
      });
    });
  }, []);
};

export function useToBeImplemented() {
  const snackbar = useSnackbar();
  return () =>
    snackbar.openSnackbar({
      type: "success",
      text: "Chức năng dành cho các bên tích hợp phát triển...",
    });
}

// ===== HOOK CHO CHECKOUT (ĐÃ SỬA) =====
// ===== HOOK CHO CHECKOUT (ĐÃ SỬA) =====
export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const cart = useRecoilValue(cartState);
  const totalPrice = useRecoilValue(totalPriceState);
  const totalQuantity = useRecoilValue(totalQuantityState);
  const selectedStore = useRecoilValue(selectedStoreState); //
  const deliveryTime = useRecoilValue(selectedDeliveryTimeState); // <-- Lấy giá trị
  const note = useRecoilValue(orderNoteState);
  const deliveryAddress = useRecoilValue(deliveryAddressState); 
  const user = useRecoilValueLoadable(userState);
  const phone = useRecoilValueLoadable(phoneState);
  
  const setCart = useSetRecoilState(cartState);

  const checkout = async () => {
    try {
      setIsProcessing(true);

      console.log("=== KIỂM TRA DỮ LIỆU ===");
      console.log("Cart:", cart);
      console.log("Store:", selectedStore);
      console.log("Phone state:", phone.state);
      console.log("Delivery time:", deliveryTime); // <-- Log ra
      console.log("Delivery address:", deliveryAddress);
      console.log("Note:", note);
      console.log("========================");

      // 1. Validate cart
      if (!cart || cart.length === 0) {
        throw new Error("Giỏ hàng trống!");
      }

      // 2. Validate store
      if (!selectedStore) {
        throw new Error("Vui lòng chọn cửa hàng!");
      }

      // 3. Validate phone
      if (phone.state !== "hasValue" || !phone.contents) {
        throw new Error("Vui lòng cấp quyền số điện thoại!");
      }

      // 4. Validate delivery address
      if (!deliveryAddress || deliveryAddress.trim() === "") {
        throw new Error("Vui lòng nhập địa chỉ giao hàng!");
      }

      // 5. ✅✅✅ THÊM VALIDATE CHO DELIVERY TIME ✅✅✅
      // (deliveryTime phải là một con số (milliseconds) mới hợp lệ)
      if (!deliveryTime || typeof deliveryTime !== 'number') {
        console.error("Lỗi: deliveryTime không hợp lệ:", deliveryTime);
        throw new Error("Vui lòng chọn thời gian nhận hàng!");
      }
      // ✅✅✅ KẾT THÚC SỬA ✅✅✅

      // 6. Get user info (trước đây là bước 5)
      const userName =
        user.state === "hasValue" ? user.contents.name : "Khách hàng";
      const userAvatar =
        user.state === "hasValue" ? user.contents.avatar : "";
      const userPhone = phone.contents as string;

      // 7. Prepare order data (trước đây là bước 6)
      const orderData = {
        userId: userPhone,
        userName,
        userAvatar,
        cart,
        totalPrice,
        totalQuantity,
        selectedStore,
        deliveryTime, 
        deliveryAddress,
        note,
      };

      console.log("=== CHUẨN BỊ TẠO ĐƠN HÀNG ===");
      // ... (các console.log khác giữ nguyên)

      // 8. Create order in Firestore (trước đây là bước 7)
      console.log("🚀 Đang gọi createOrder()...");
      const orderId = await createOrder(orderData);
      console.log("✅ createOrder() trả về ID:", orderId);

      // 9. Clear cart after success (trước đây là bước 8)
      console.log("🧹 Clearing cart...");
      setCart([]);

      console.log("✅ ĐẶT HÀNG THÀNH CÔNG!");
      console.log("====================");

      setIsProcessing(false);
      return { success: true, orderId };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      console.error("❌ LỖI ĐẶT HÀNG:", error);
      // (Phần catch giữ nguyên)
      setIsProcessing(false);
      return { success: false, error: error.message || "Lỗi không xác định" };
    }
  };

  //   const checkout = async () => {
  //   // Tạm thời chưa cần logic ở đây, chỉ cần test render
  //   console.log("Hook đang test render...");
  //   setIsProcessing(true);
    
  //   // Giả lập việc bấm nút
  //   alert("Nút bấm đã chạy, nhưng state Recoil đang bị vô hiệu hóa.");
    
  //   setIsProcessing(false);
  //   return { success: false, error: "Đang test render" };
  // };
  

  return {
    checkout,
    isProcessing,
  };
}