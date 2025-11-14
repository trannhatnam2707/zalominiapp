import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase.js';

// Debug: Check if db is imported correctly
console.log("🔥 ordersService.js loaded!");
console.log("🔥 db imported:", db);
console.log("🔥 db type:", typeof db);

/**
 * Lưu hoặc cập nhật thông tin customer
 * @param {Object} customerData - Thông tin khách hàng
 */
async function saveCustomer(customerData) {
  try {
    const { phone_number, user_name, address } = customerData;
    
    console.log("💾 Saving customer:", { phone_number, user_name, address });
    
    // Dùng phone_number làm document ID
    const customerRef = doc(db, 'customers', phone_number);
    
    await setDoc(customerRef, {
      phone_number,
      user_name,
      address: address || ''
    }, { merge: true });
    
    console.log("✅ Customer saved successfully:", phone_number);
  } catch (error) {
    console.error("❌ Error saving customer:", error);
    throw error;
  }
}

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @returns {Promise<string>} - ID của đơn hàng vừa tạo
 */
export async function createOrder(orderData) {
  try {
    console.log("📦 createOrder() called with data:", orderData);
    
    const {
      userId,           // phone_number
      userName,         // user_name
      cart,            // cart items
      selectedStore,   // store info (chỉ để hiển thị, không lưu vào order)
      deliveryTime,    // received_at
      deliveryAddress, // address người nhận
      note             // note
    } = orderData;

    console.log("🔍 Validating data...");
    console.log("- phone_number:", userId);
    console.log("- user_name:", userName);
    console.log("- address:", deliveryAddress);
    console.log("- cart items:", cart.length);
    console.log("- deliveryTime:", deliveryTime);
    console.log("- note:", note);

    // 1. Lưu thông tin customer
    console.log("👤 Step 1: Saving customer...");
    await saveCustomer({
      phone_number: userId,
      user_name: userName,
      address: deliveryAddress || '' // Lưu địa chỉ người nhận
    });

    // 2. Tạo product_id array từ cart - CHỈ LẤY ID
    console.log("📋 Step 2: Creating product_id array...");
    const product_id = cart.map(item => {
      const id = parseInt(item.product.id);
      console.log(`  - Product1: ${item.product.name} (ID: ${id})`);
      return id;
    });
    console.log("Product IDs:", product_id);

    // 3. Tạo order document - ĐÚNG CẤU TRÚC FIRESTORE
    console.log("📄 Step 3: Creating order document...");
    const order = {
      phone_number: userId,           // Số điện thoại khách hàng
      address: deliveryAddress || '', // Địa chỉ người nhận
      note: note || '',               // Ghi chú
      product_id: product_id,         // Array ID sản phẩm [1, 2, 3]
      created_at: Timestamp.now(),    // Thời gian tạo
      received_at: Timestamp.fromMillis(deliveryTime) // Thời gian nhận
    };

    console.log("📦 Order structure:");
    console.log("  - phone_number:", order.phone_number);
    console.log("  - address:", order.address);
    console.log("  - note:", order.note);
    console.log("  - product_id:", order.product_id);
    console.log("  - created_at:", order.created_at);
    console.log("  - received_at:", order.received_at);

    // 4. Thêm vào Firestore collection orders
    console.log("💾 Step 4: Adding to Firestore...");
    const ordersCollection = collection(db, 'orders'); 
    const docRef = await addDoc(ordersCollection, order);
    console.log("✅ Document added with ID:", docRef.id);

    // 5. Cập nhật document với field 'id'
    console.log("🔄 Step 5: Updating document with id field...");
    const orderDocRef = doc(db, 'orders', docRef.id);
    await setDoc(orderDocRef, {
      id: docRef.id
    }, { merge: true });
    console.log("✅ Document updated with id field");

    console.log("🎉 Order created successfully! ID:", docRef.id);
    return docRef.id;

  } catch (error) {
    console.error("❌❌❌ ERROR IN createOrder() ❌❌❌");
    console.error("Error type:", typeof error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

/**
 * Lấy tất cả đơn hàng của user theo phone number
 * @param {string} phoneNumber - Số điện thoại
 * @returns {Promise<Array>} - Danh sách đơn hàng
 */
export async function getUserOrders(phoneNumber) {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('phone_number', '==', phoneNumber),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('Fetched user orders:', orders);
    return orders;
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

/**
 * Lấy thông tin customer theo phone number
 * @param {string} phoneNumber - Số điện thoại
 * @returns {Promise<Object|null>} - Thông tin customer
 */
export async function getCustomer(phoneNumber) {
  try {
    const customerRef = doc(db, 'customers', phoneNumber);
    const customerDoc = await getDoc(customerRef);
    
    if (customerDoc.exists()) {
      return customerDoc.data();
    }
    return null;
    
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

/**
 * Lấy tất cả đơn hàng (cho admin)
 * @returns {Promise<Array>} - Danh sách tất cả đơn hàng
 */
export async function getAllOrders() {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, orderBy('created_at', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
    
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}