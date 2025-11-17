import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase.js';

console.log("🔥 ordersService.js loaded!");

/**
 * Lưu hoặc cập nhật thông tin customer
 */
async function saveCustomer(customerData) {
  try {
    const { phone_number, user_name, address } = customerData;
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
 */
export async function createOrder(orderData) {
  try {
    console.log("📦 createOrder() called with data:", orderData);
    
    const {
      userId,           // phone_number
      userName,         // user_name
      cart,            // cart items FULL INFO
      selectedStore,   
      deliveryTime,    // received_at
      deliveryAddress, // address
      note             
    } = orderData;

    // 1. Lưu customer
    console.log("👤 Step 1: Saving customer...");
    await saveCustomer({
      phone_number: userId,
      user_name: userName,
      address: deliveryAddress || ''
    });

    // 2. ✅ Tạo cart_items với ĐẦY ĐỦ THÔNG TIN
    console.log("📋 Step 2: Creating cart_items array...");
    const cart_items = cart.map(item => {
      // Tính giá cuối cùng cho item này (bao gồm options)
      const itemPrice = calcFinalPriceForItem(item);
      
      console.log(`  - ${item.product.name}`);
      console.log(`    * Product ID: ${item.product.id}`);
      console.log(`    * Base price: ${item.product.price}`);
      console.log(`    * Options:`, item.options);
      console.log(`    * Quantity: ${item.quantity}`);
      console.log(`    * Final price per item: ${itemPrice}`);
      console.log(`    * Total: ${itemPrice * item.quantity}`);
      
      return {
        product_id: parseInt(item.product.id),
        product_name: item.product.name,
        product_image: item.product.image,
        base_price: item.product.price,
        options: item.options || {},          // ✅ Lưu options (size, topping)
        quantity: item.quantity,              // ✅ Lưu quantity
        final_price: itemPrice,               // ✅ Giá sau khi tính options
        total_price: itemPrice * item.quantity // ✅ Tổng cho item này
      };
    });

    console.log("📦 Cart items structure:", cart_items);

    // 3. ✅ Tính tổng tiền CHÍNH XÁC
    console.log("💰 Step 3: Calculating total amount...");
    const total_amount = cart_items.reduce((sum, item) => {
      return sum + item.total_price;
    }, 0);
    console.log("Total amount:", total_amount);

    // 4. Tạo order document
    console.log("📄 Step 4: Creating order document...");
    const order = {
      phone_number: userId,
      address: deliveryAddress || '',
      note: note || '',
      cart_items: cart_items,           // ✅ Lưu full cart items
      total_amount: total_amount,       // ✅ Tổng tiền chính xác
      created_at: Timestamp.now(),
      received_at: Timestamp.fromMillis(deliveryTime)
    };

    console.log("📦 Order structure:");
    console.log("  - phone_number:", order.phone_number);
    console.log("  - cart_items:", order.cart_items.length, "items");
    console.log("  - total_amount:", order.total_amount);

    // 5. Lưu vào Firestore
    console.log("💾 Step 5: Adding to Firestore...");
    const ordersCollection = collection(db, 'orders'); 
    const docRef = await addDoc(ordersCollection, order);
    console.log("✅ Document added with ID:", docRef.id);

    // 6. Cập nhật với field 'id'
    console.log("🔄 Step 6: Updating document with id field...");
    const orderDocRef = doc(db, 'orders', docRef.id);
    await setDoc(orderDocRef, {
      id: docRef.id
    }, { merge: true });
    console.log("✅ Document updated with id field");

    console.log("🎉 Order created successfully! ID:", docRef.id);
    return docRef.id;

  } catch (error) {
    console.error("❌❌❌ ERROR IN createOrder() ❌❌❌");
    console.error("Full error:", error);
    throw error;
  }
}

/**
 * ✅ HÀM TÍNH GIÁ CUỐI CÙNG CHO 1 ITEM (bao gồm options)
 */
function calcFinalPriceForItem(cartItem) {
  const { product, options } = cartItem;
  let finalPrice = product.price;

  // Áp dụng sale nếu có
  if (product.sale) {
    if (product.sale.type === "fixed") {
      finalPrice = product.price - product.sale.amount;
    } else {
      finalPrice = product.price * (1 - product.sale.percent);
    }
  }

  // Áp dụng giá thay đổi từ options (size, topping, etc)
  if (options && product.variants) {
    for (const variantKey in options) {
      const variant = product.variants.find((v) => v.id === variantKey);
      if (variant) {
        const currentOption = options[variantKey];
        
        if (typeof currentOption === "string") {
          // Single option (e.g., size)
          const selected = variant.options.find((o) => o.id === currentOption);
          if (selected && selected.priceChange) {
            if (selected.priceChange.type === "fixed") {
              finalPrice += selected.priceChange.amount;
            } else {
              finalPrice += product.price * selected.priceChange.percent;
            }
          }
        } else if (Array.isArray(currentOption)) {
          // Multiple options (e.g., toppings)
          currentOption.forEach(optionId => {
            const selected = variant.options.find((o) => o.id === optionId);
            if (selected && selected.priceChange) {
              if (selected.priceChange.type === "fixed") {
                finalPrice += selected.priceChange.amount;
              } else {
                finalPrice += product.price * selected.priceChange.percent;
              }
            }
          });
        }
      }
    }
  }

  return finalPrice;
}

/**
 * Lấy tất cả đơn hàng của user
 */
export async function getUserOrders(phoneNumber) {
  try {
    console.log("🔍 getUserOrders() - phoneNumber:", phoneNumber);
    
    const ordersCollection = collection(db, 'orders');
    
    // Try query with where
    try {
      const q = query(
        ordersCollection,
        where('phone_number', '==', phoneNumber),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log("📊 Found orders:", querySnapshot.size);
      
      if (querySnapshot.size > 0) {
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return orders;
      }
    } catch (whereError) {
      console.warn("⚠️ Query with where failed, trying fallback...");
    }
    
    // Fallback: get all then filter
    const allSnapshot = await getDocs(ordersCollection);
    const orders = [];
    
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.phone_number === phoneNumber) {
        orders.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log('✅ Filtered orders:', orders.length);
    return orders;
    
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    return [];
  }
}

/**
 * Lấy thông tin customer
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
 * Lấy tất cả đơn hàng (admin)
 */
export async function getAllOrders() {
  try {
    console.log("🔍 getAllOrders()");
    const ordersCollection = collection(db, 'orders');
    
    try {
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
      // Fallback without orderBy
      console.log("⚠️ Trying without orderBy...");
      const querySnapshot = await getDocs(ordersCollection);
      
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return orders;
    }
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    return [];
  }
}