// src/pages/order-history.tsx - SỬ DỤNG CART_ITEMS
import React, { FC, useEffect, useState } from "react";
import { Box, Header, Page, Text, Button } from "zmp-ui";
import { useRecoilState } from "recoil";
import { manualPhoneState } from "state";
import { getUserOrders } from "../../services/ordersService";
import { Timestamp } from "firebase/firestore";
import { DisplayPrice } from "components/display/price";

interface CartItem {
  product_id: number;
  product_name: string;
  product_image: string;
  base_price: number;
  options: Record<string, any>;
  quantity: number;
  final_price: number;
  total_price: number;
}

interface Order {
  id: string;
  phone_number: string;
  address: string;
  note: string;
  cart_items: CartItem[];      // ✅ Đổi từ product_id sang cart_items
  total_amount: number;
  created_at: Timestamp;
  received_at: Timestamp;
}

const OrderHistoryPage: FC = () => {
  const [phone, setPhone] = useRecoilState(manualPhoneState);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        setPhone(savedPhone);
      }
    }
  }, [phone, setPhone]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!phone) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userOrders = await getUserOrders(phone);
        console.log("📦 Loaded orders:", userOrders);
        setOrders(userOrders as Order[]);
      } catch (error) {
        console.error("❌ Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [phone]);

  // ✅ Hiển thị options (size, topping)
  const formatOptions = (options: Record<string, any>): string => {
    if (!options || Object.keys(options).length === 0) {
      return "";
    }
    
    const parts: string[] = [];
    for (const key in options) {
      const value = options[key];
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(", ")}`);
      } else {
        parts.push(`${key}: ${value}`);
      }
    }
    return parts.join(" | ");
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getOrderStatus = (order: Order) => {
    const now = new Date();
    const receivedTime = order.received_at.toDate();
    
    if (receivedTime > now) {
      return { text: "Đang xử lý", color: "text-blue-500", bgColor: "bg-blue-50" };
    } else {
      return { text: "Đã hoàn thành", color: "text-green-500", bgColor: "bg-green-50" };
    }
  };

  if (!phone) {
    return (
      <Page className="bg-background">
        <Header title="Lịch sử đơn hàng" />
        <Box className="flex-1 flex items-center justify-center p-4">
          <Box className="text-center space-y-2">
            <Text size="large" className="text-gray">📱</Text>
            <Text size="small" className="text-gray">
              Vui lòng cập nhật số điện thoại
            </Text>
            <Button size="small" onClick={() => window.location.href = '/account-info'}>
              Cập nhật ngay
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page className="bg-background">
        <Header title="Lịch sử đơn hàng" />
        <Box className="flex-1 flex items-center justify-center">
          <Box className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <Text className="text-gray">Đang tải...</Text>
          </Box>
        </Box>
      </Page>
    );
  }

  if (orders.length === 0) {
    return (
      <Page className="bg-background">
        <Header title="Lịch sử đơn hàng" />
        <Box className="flex-1 flex items-center justify-center p-4">
          <Box className="text-center space-y-2">
            <Text size="large" className="text-gray">🛒</Text>
            <Text size="small" className="text-gray">Bạn chưa có đơn hàng nào</Text>
            <Button size="small" onClick={() => window.location.href = '/'}>
              Mua sắm ngay
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="bg-background">
      <Header title="Lịch sử đơn hàng" />
      
      <Box className="p-4 space-y-4">
        <Text size="xSmall" className="text-gray">
          Tìm thấy {orders.length} đơn hàng
        </Text>

        {orders.map((order) => {
          const status = getOrderStatus(order);
          
          return (
            <Box key={order.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              <Box className="p-4 pb-3 border-b">
                <Box flex className="justify-between items-center mb-2">
                  <Text size="small" className="font-medium">
                    #{order.id.slice(-8).toUpperCase()}
                  </Text>
                  <Box className={`px-2 py-1 rounded-full ${status.bgColor}`}>
                    <Text size="xxxSmall" className={`font-medium ${status.color}`}>
                      {status.text}
                    </Text>
                  </Box>
                </Box>
                <Text size="xxxSmall" className="text-gray">
                  Đặt lúc: {formatDate(order.created_at)}
                </Text>
              </Box>

              {/* Cart Items */}
              <Box className="p-4 space-y-3">
                <Text size="xSmall" className="font-medium">
                  Sản phẩm ({order.cart_items?.length || 0})
                </Text>
                
                <Box className="space-y-2">
                  {order.cart_items?.map((item, index) => (
                    <Box 
                      key={index} 
                      className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                    >
                      {/* Image */}
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/64x64?text=' + 
                            encodeURIComponent(item.product_name.charAt(0));
                        }}
                      />
                      
                      {/* Info */}
                      <Box className="flex-1 min-w-0">
                        <Text size="xSmall" className="font-medium line-clamp-2">
                          {item.product_name}
                        </Text>
                        
                        {/* Options */}
                        {formatOptions(item.options) && (
                          <Text size="xxxSmall" className="text-gray mt-1">
                            {formatOptions(item.options)}
                          </Text>
                        )}
                        
                        {/* Price & Quantity */}
                        <Box flex className="justify-between items-center mt-1">
                          <Text size="xxSmall" className="text-primary">
                            <DisplayPrice>{item.final_price}</DisplayPrice>
                          </Text>
                          <Text size="xxSmall" className="text-gray">
                            x{item.quantity}
                          </Text>
                        </Box>
                        
                        {/* Total for this item */}
                        <Text size="xSmall" className="font-medium mt-1">
                          <DisplayPrice>{item.total_price}</DisplayPrice>
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Delivery Info */}
              <Box className="px-4 pb-4 space-y-2">
                <Box className="border-t pt-3 space-y-2">
                  <Box flex className="justify-between items-start">
                    <Text size="xSmall" className="text-gray">📍 Địa chỉ</Text>
                    <Text size="xSmall" className="text-right flex-1 ml-2">
                      {order.address || "Không có"}
                    </Text>
                  </Box>
                  
                  <Box flex className="justify-between">
                    <Text size="xSmall" className="text-gray">🕐 Nhận hàng</Text>
                    <Text size="xSmall">{formatDate(order.received_at)}</Text>
                  </Box>

                  {order.note && (
                    <Box flex className="justify-between items-start">
                      <Text size="xSmall" className="text-gray">📝 Ghi chú</Text>
                      <Text size="xSmall" className="text-right flex-1 ml-2 italic">
                        {order.note}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Total */}
                <Box className="border-t pt-3">
                  <Box flex className="justify-between items-center">
                    <Text size="small" className="font-medium">Tổng cộng</Text>
                    <Text size="large" className="font-bold text-primary">
                      <DisplayPrice>{order.total_amount}</DisplayPrice>
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Page>
  );
};

export default OrderHistoryPage;