// src/pages/order-history.tsx - PHIÊN BẢN SỬ DỤNG TOTAL_AMOUNT TỪ DB
import React, { FC, useEffect, useState } from "react";
import { Box, Header, Page, Text, Button } from "zmp-ui";
import { useRecoilState, useRecoilValue } from "recoil";
import { manualPhoneState, productsState } from "state";
import { getUserOrders } from "../../services/ordersService";
import { Timestamp } from "firebase/firestore";
import { Product } from "types/product";
import { DisplayPrice } from "components/display/price";

interface Order {
  id: string;
  phone_number: string;
  address: string;
  note: string;
  product_id: number[];
  total_amount?: number; // ✅ Thêm field total_amount từ DB
  created_at: Timestamp;
  received_at: Timestamp;
}

const OrderHistoryPage: FC = () => {
  const [phone, setPhone] = useRecoilState(manualPhoneState);
  const products = useRecoilValue(productsState); // ✅ Có thể chưa load xong
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Debug: Kiểm tra products đã load chưa
  useEffect(() => {
    console.log("🔍 Products state changed:", products.length);
    if (products.length > 0) {
      console.log("✅ Products loaded successfully");
      console.log("📦 Sample products:", products.slice(0, 3).map(p => ({ id: p.id, name: p.name, image: p.image })));
    }
  }, [products]);

  // Load số điện thoại từ localStorage nếu chưa có
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
        console.log("📦 Products loaded:", products.length);
        console.log("📦 First product:", products[0]);
        setOrders(userOrders as Order[]);
      } catch (error) {
        console.error("❌ Lỗi tải đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [phone, products]); // ✅ Thêm products vào dependency

  // ✅ Hàm lấy thông tin sản phẩm từ product_id
  const getProductInfo = (productId: number): Product | null => {
    console.log(`🔍 [getProductInfo] Looking for product ID: ${productId} (type: ${typeof productId})`);
    console.log(`📦 [getProductInfo] Total products available: ${products.length}`);
    
    if (products.length === 0) {
      console.error(`❌ [getProductInfo] Products array is EMPTY!`);
      return null;
    }
    
    // ✅ So sánh STRING vs NUMBER
    const product = products.find(p => {
      // Convert cả 2 về string để so sánh
      const pId = String(p.id);
      const searchId = String(productId);
      const isMatch = pId === searchId;
      
      // Log mỗi lần so sánh
      console.log(`  Comparing: "${pId}" (${typeof p.id}) === "${searchId}" ? ${isMatch ? '✅' : '❌'}`);
      
      if (isMatch) {
        console.log(`✅ [getProductInfo] MATCH FOUND: ${p.name}`);
        console.log(`   - Product ID: ${p.id} (${typeof p.id})`);
        console.log(`   - Image: ${p.image}`);
      }
      
      return isMatch;
    });
    
    if (!product) {
      console.error(`❌ [getProductInfo] NO MATCH for ID: ${productId}`);
      console.log(`📋 Available product IDs:`, products.map(p => `${p.id} (${typeof p.id})`));
    }
    
    return product || null;
  };

  // ✅ Hàm lấy URL hình ảnh đầy đủ
  const getProductImageUrl = (product: Product): string => {
    if (!product.image) {
      console.warn(`⚠️ Product ${product.id} has no image`);
      return 'https://via.placeholder.com/64x64/cccccc/666666?text=' + encodeURIComponent(product.name.charAt(0));
    }

    // URL trong DB đã là đường dẫn đầy đủ (https://stc-zmp.zadn.vn/...)
    console.log(`✅ Using image URL: ${product.image}`);
    return product.image;
  };

  // ✅ Tính tổng tiền từ product_id (fallback nếu DB không có total_amount)
  const calculateOrderTotal = (order: Order): number => {
    // Ưu tiên sử dụng total_amount từ DB
    if (order.total_amount !== undefined && order.total_amount !== null) {
      console.log(`💰 Using total_amount from DB: ${order.total_amount}`);
      return order.total_amount;
    }

    // Fallback: tính từ product_id
    console.warn(`⚠️ Order ${order.id} không có total_amount, tính từ product_id`);
    return order.product_id.reduce((total, id) => {
      const product = getProductInfo(id);
      return total + (product?.price || 0);
    }, 0);
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
              Vui lòng cập nhật số điện thoại để xem lịch sử đơn hàng
            </Text>
            <Button 
              size="small"
              onClick={() => window.location.href = '/account-info'}
            >
              Cập nhật ngay
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  if (loading || products.length === 0) {
    return (
      <Page className="bg-background">
        <Header title="Lịch sử đơn hàng" />
        <Box className="flex-1 flex items-center justify-center">
          <Box className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <Text className="text-gray">
              {loading ? "Đang tải đơn hàng..." : "Đang tải danh sách sản phẩm..."}
            </Text>
            <Text size="xxxSmall" className="text-gray">
              Products: {products.length} | Orders: {orders.length}
            </Text>
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
            <Text size="small" className="text-gray">
              Bạn chưa có đơn hàng nào
            </Text>
            <Text size="xSmall" className="text-gray mt-2">
              Số điện thoại: {phone}
            </Text>
            <Button 
              size="small"
              onClick={() => window.location.href = '/'}
            >
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
          const total = calculateOrderTotal(order); // ✅ Ưu tiên lấy từ DB
          
          return (
            <Box
              key={order.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              {/* Header đơn hàng */}
              <Box className="p-4 pb-3 border-b">
                <Box flex className="justify-between items-center mb-2">
                  <Text size="small" className="font-medium">
                    Mã đơn: #{order.id.slice(-8).toUpperCase()}
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

              {/* Danh sách sản phẩm */}
              <Box className="p-4 space-y-3">
                <Text size="xSmall" className="font-medium">
                  Sản phẩm ({order.product_id.length})
                </Text>
                
                <Box className="space-y-2">
                  {order.product_id.map((productId, index) => {
                    const product = getProductInfo(productId);
                    
                    // ✅ Kiểm tra product có tồn tại không
                    if (!product) {
                      console.error(`[Render] Product ${productId} is NULL`);
                      return (
                        <Box key={index} className="flex items-center space-x-3 p-2 bg-red-50 rounded-lg border border-red-200">
                          <Box className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Text size="xSmall" className="text-gray-400">❌</Text>
                          </Box>
                          <Box className="flex-1">
                            <Text size="xSmall" className="text-red-600 font-medium">
                              Sản phẩm không tìm thấy
                            </Text>
                            <Text size="xxxSmall" className="text-red-500">
                              ID: {productId} (type: {typeof productId})
                            </Text>
                            <Text size="xxxSmall" className="text-gray-500">
                              Total products: {products.length}
                            </Text>
                          </Box>
                        </Box>
                      );
                    }

                    // ✅ Product tồn tại, hiển thị bình thường
                    console.log(`[Render] Rendering product: ${product.name}, image: ${product.image}`);
                    const imageUrl = getProductImageUrl(product);
                    
                    return (
                      <Box 
                        key={index} 
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {/* Hình ảnh sản phẩm */}
                        <Box className="relative w-16 h-16 flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={() => {
                              console.log(`✅ [Image] Loaded: ${product.name}`);
                            }}
                            onError={(e) => {
                              console.error(`❌ [Image] Failed: ${product.name}`);
                              console.error(`   URL: ${imageUrl}`);
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = 'https://via.placeholder.com/64x64/cccccc/666666?text=' + encodeURIComponent(product.name.charAt(0));
                            }}
                            style={{ backgroundColor: '#f0f0f0' }}
                          />
                        </Box>
                        
                        {/* Thông tin sản phẩm */}
                        <Box className="flex-1 min-w-0">
                          <Text size="xSmall" className="font-medium line-clamp-2">
                            {product.name}
                          </Text>
                          <Text size="xxSmall" className="text-primary font-medium mt-1">
                            <DisplayPrice>{product.price}</DisplayPrice>
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Thông tin giao hàng */}
              <Box className="px-4 pb-4 space-y-2">
                <Box className="border-t pt-3 space-y-2">
                  <Box flex className="justify-between items-start">
                    <Text size="xSmall" className="text-gray">
                      📍 Địa chỉ
                    </Text>
                    <Text size="xSmall" className="text-right flex-1 ml-2">
                      {order.address || "Không có thông tin"}
                    </Text>
                  </Box>
                  
                  <Box flex className="justify-between">
                    <Text size="xSmall" className="text-gray">
                      🕐 Thời gian nhận
                    </Text>
                    <Text size="xSmall">
                      {formatDate(order.received_at)}
                    </Text>
                  </Box>

                  {order.note && (
                    <Box flex className="justify-between items-start">
                      <Text size="xSmall" className="text-gray">
                        📝 Ghi chú
                      </Text>
                      <Text size="xSmall" className="text-right flex-1 ml-2 italic">
                        {order.note}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Tổng tiền */}
                <Box className="border-t pt-3">
                  <Box flex className="justify-between items-center">
                    <Text size="small" className="font-medium">
                      Tổng cộng
                    </Text>
                    <Box flex className="items-center space-x-1">
                      <Text size="large" className="font-bold text-primary">
                        <DisplayPrice>{total}</DisplayPrice>
                      </Text>
                      {/* Debug badge */}
                      {order.total_amount !== undefined && (
                        <Text size="xxxSmall" className="text-green-600 bg-green-50 px-1 rounded">
                        </Text>
                      )}
                    </Box>
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