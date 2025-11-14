import { DisplayPrice } from "components/display/price";
import React, { FC } from "react";
import { useRecoilValue } from "recoil";
import { totalPriceState, totalQuantityState, cartState } from "state";
import pay from "utils/product";
import { Box, Button, Text } from "zmp-ui";

export const CartPreview: FC = () => {
  const quantity = useRecoilValue(totalQuantityState);
  const totalPrice = useRecoilValue(totalPriceState);
  const cart = useRecoilValue(cartState); // Lấy dữ liệu giỏ hàng

  const handleOrder = async () => {
    // Tạo orderData từ cart
    const orderData = {
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        options: item.options,
        totalPrice: item.quantity * item.product.price
      })),
      totalAmount: totalPrice,
      totalQuantity: quantity,
      createdAt: new Date().toISOString(),
      status: "pending",
      
      
    };

    try {
      await pay(totalPrice, "Đặt hàng từ giỏ hàng", orderData);
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      // Có thể hiển thị thông báo lỗi cho user
    }
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
      </Box>
      <Button
        type="highlight"
        disabled={!quantity}
        fullWidth
        onClick={handleOrder}
      >
        Đặt hàng
      </Button>
    </Box>
  );
};