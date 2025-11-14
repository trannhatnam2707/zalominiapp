import React, { FC, Suspense } from "react";
import { Divider } from "components/divider";
import { Header, Page, Box, Text } from "zmp-ui";
import { CartItems } from "./cart-items";
import { CartPreview } from "./preview";
import { TermsAndPolicies } from "./term-and-policies";
import { Delivery } from "./delivery";
import { useVirtualKeyboardVisible } from "hooks";

const CartPage: FC = () => {
  const keyboardVisible = useVirtualKeyboardVisible();

  return (
    <Page className="flex flex-col">
      <Header title="Giỏ hàng" showBackIcon={false} />
      <Suspense fallback={
        <Box className="flex-1 flex items-center justify-center">
          <Text>Đang tải...</Text>
        </Box>
      }>
        <CartItems />
        <Delivery />
        <Divider size={12} />
        <TermsAndPolicies />
        <Divider size={32} className="flex-1" />
        {!keyboardVisible && <CartPreview />}
      </Suspense>
    </Page>
  );
};

export default CartPage;