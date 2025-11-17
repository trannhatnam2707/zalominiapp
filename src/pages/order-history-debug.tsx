// src/pages/order-history-debug.tsx - COMPONENT DEBUG
import React, { FC, useEffect, useState } from "react";
import { Box, Header, Page, Text, Button } from "zmp-ui";
import { useRecoilState } from "recoil";
import { manualPhoneState } from "state";
import { getUserOrders, getAllOrders } from "../../services/ordersService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const OrderHistoryDebugPage: FC = () => {
  const [phone, setPhone] = useRecoilState(manualPhoneState);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // Kiểm tra localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    addLog(`📱 LocalStorage userPhone: ${savedPhone || "NULL"}`);
    addLog(`📱 Recoil phone state: ${phone || "NULL"}`);
    
    if (savedPhone && !phone) {
      setPhone(savedPhone);
      addLog(`✅ Đã set phone từ localStorage: ${savedPhone}`);
    }
  }, []);

  // Test 1: Lấy TẤT CẢ đơn hàng (không filter)
  const testGetAllOrders = async () => {
    try {
      setLoading(true);
      addLog("🔍 TEST 1: Lấy TẤT CẢ đơn hàng...");
      
      const orders = await getAllOrders();
      setAllOrders(orders);
      
      addLog(`✅ Tìm thấy ${orders.length} đơn hàng tổng cộng`);
      addLog(`📦 Danh sách phone_number: ${orders.map(o => o.phone_number).join(", ")}`);
    } catch (error) {
      addLog(`❌ Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Lấy đơn hàng theo số điện thoại
  const testGetUserOrders = async () => {
    try {
      setLoading(true);
      addLog(`🔍 TEST 2: Lấy đơn hàng cho SĐT: ${phone}`);
      
      const orders = await getUserOrders(phone);
      setUserOrders(orders);
      
      addLog(`✅ Tìm thấy ${orders.length} đơn hàng cho ${phone}`);
      if (orders.length > 0) {
        addLog(`📦 Đơn hàng đầu tiên: ${JSON.stringify(orders[0])}`);
      }
    } catch (error) {
      addLog(`❌ Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Query trực tiếp Firebase
  const testDirectFirebaseQuery = async () => {
    try {
      setLoading(true);
      addLog(`🔍 TEST 3: Query trực tiếp Firebase với phone: "${phone}"`);
      
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      addLog(`📊 Tổng số documents trong collection: ${snapshot.size}`);
      
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]; // ✅ Thêm type assertion
      
      addLog(`📋 Tất cả phone_number:`);
      docs.forEach((doc: any) => { // ✅ Thêm type annotation
        addLog(`  - ID: ${doc.id}, phone: "${doc.phone_number}", type: ${typeof doc.phone_number}`);
      });
      
      // Tìm đơn hàng khớp với phone
      const matched = docs.filter((doc: any) => doc.phone_number === phone); // ✅ Thêm type annotation
      addLog(`✅ Số đơn khớp với "${phone}": ${matched.length}`);
      
      // So sánh chi tiết
      addLog(`🔬 So sánh chi tiết:`);
      addLog(`  - Phone trong state: "${phone}" (type: ${typeof phone})`);
      docs.forEach((doc: any) => { // ✅ Thêm type annotation
        const isMatch = doc.phone_number === phone;
        addLog(`  - "${doc.phone_number}" === "${phone}" ? ${isMatch}`);
      });
      
    } catch (error) {
      addLog(`❌ Lỗi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className="bg-background">
      <Header title="🐛 Debug Lịch Sử Đơn Hàng" />
      
      <Box className="p-4 space-y-4">
        {/* Thông tin hiện tại */}
        <Box className="bg-white rounded-xl p-4 space-y-2">
          <Text.Title size="small">📊 Thông Tin Hiện Tại</Text.Title>
          <Text size="xSmall">Phone từ Recoil: <b>{phone || "NULL"}</b></Text>
          <Text size="xSmall">Phone từ LocalStorage: <b>{localStorage.getItem('userPhone') || "NULL"}</b></Text>
          <Text size="xSmall">Type: <b>{typeof phone}</b></Text>
        </Box>

        {/* Nút test */}
        <Box className="space-y-2">
          <Button 
            fullWidth 
            onClick={testGetAllOrders}
            disabled={loading}
          >
            Test 1: Lấy TẤT CẢ đơn hàng
          </Button>
          
          <Button 
            fullWidth 
            onClick={testGetUserOrders}
            disabled={loading || !phone}
          >
            Test 2: Lấy đơn theo SĐT ({phone || "chưa có"})
          </Button>
          
          <Button 
            fullWidth 
            onClick={testDirectFirebaseQuery}
            disabled={loading}
          >
            Test 3: Query trực tiếp Firebase
          </Button>
        </Box>

        {/* Kết quả */}
        {allOrders.length > 0 && (
          <Box className="bg-white rounded-xl p-4 space-y-2">
            <Text.Title size="small">📦 Tất cả đơn hàng ({allOrders.length})</Text.Title>
            {allOrders.map(order => (
              <Box key={order.id} className="border-b pb-2">
                <Text size="xSmall">ID: {order.id}</Text>
                <Text size="xSmall">Phone: <b>{order.phone_number}</b></Text>
                <Text size="xSmall">Address: {order.address}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Logs */}
        <Box className="bg-gray-100 rounded-xl p-4">
          <Text.Title size="small">📝 Console Logs</Text.Title>
          <Box className="space-y-1 mt-2 max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <Text key={i} size="xxxSmall" className="font-mono">
                {log}
              </Text>
            ))}
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default OrderHistoryDebugPage;