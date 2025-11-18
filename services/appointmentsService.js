// services/appointmentsService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../src/firebase.js';

/**
 * Tạo lịch hẹn đo may mới
 */
export async function createMeasurementAppointment(appointmentData) {
  try {
    console.log("📅 Creating appointment with data:", appointmentData);
    
    const {
      product,          // Thông tin sản phẩm
      selectedOptions,  // Options đã chọn
      store,           // Cửa hàng được chọn
      date,            // Ngày hẹn (Date object)
      time,            // Giờ hẹn (Date object)
      timestamp,       // Timestamp (milliseconds)
      phoneNumber,     // SĐT khách hàng
      userName,        // Tên khách hàng
      note             // Ghi chú (optional)
    } = appointmentData;

    // Tạo appointment document
    const appointment = {
      // Thông tin khách hàng
      phone_number: phoneNumber,
      user_name: userName,
      
      // Thông tin sản phẩm
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      selected_options: selectedOptions,
      
      // Thông tin cửa hàng
      store_id: store.id,
      store_name: store.name,
      store_address: store.address,
      
      // Thông tin thời gian
      appointment_date: Timestamp.fromDate(date),
      appointment_time: Timestamp.fromMillis(timestamp),
      
      // Trạng thái
      status: "pending", // pending | confirmed | completed | cancelled
      
      // Metadata
      note: note || "",
      created_at: Timestamp.now(),
    };

    console.log("📦 Appointment structure:", appointment);

    // Lưu vào Firestore
    const appointmentsCollection = collection(db, 'appointments');
    const docRef = await addDoc(appointmentsCollection, appointment);
    console.log("✅ Appointment created with ID:", docRef.id);

    // Cập nhật với field 'id'
    const appointmentDocRef = doc(db, 'appointments', docRef.id);
    await setDoc(appointmentDocRef, {
      id: docRef.id
    }, { merge: true });

    console.log("🎉 Appointment saved successfully!");
    return docRef.id;

  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    throw error;
  }
}

/**
 * Lấy tất cả lịch hẹn của user
 */
export async function getUserAppointments(phoneNumber) {
  try {
    console.log("🔍 Getting appointments for:", phoneNumber);
    
    const appointmentsCollection = collection(db, 'appointments');
    
    try {
      const q = query(
        appointmentsCollection,
        where('phone_number', '==', phoneNumber),
        orderBy('appointment_time', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log("📊 Found appointments:", querySnapshot.size);
      
      if (querySnapshot.size > 0) {
        const appointments = [];
        querySnapshot.forEach((doc) => {
          appointments.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return appointments;
      }
    } catch (whereError) {
      console.warn("⚠️ Query with where failed, trying fallback...");
    }
    
    // Fallback: get all then filter
    const allSnapshot = await getDocs(appointmentsCollection);
    const appointments = [];
    
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.phone_number === phoneNumber) {
        appointments.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort by appointment_time descending
    appointments.sort((a, b) => {
      const timeA = a.appointment_time?.toMillis() || 0;
      const timeB = b.appointment_time?.toMillis() || 0;
      return timeB - timeA;
    });
    
    console.log('✅ Filtered appointments:', appointments.length);
    return appointments;
    
  } catch (error) {
    console.error('❌ Error fetching user appointments:', error);
    return [];
  }
}

/**
 * Lấy tất cả lịch hẹn (admin)
 */
export async function getAllAppointments() {
  try {
    console.log("🔍 Getting all appointments");
    const appointmentsCollection = collection(db, 'appointments');
    
    try {
      const q = query(appointmentsCollection, orderBy('appointment_time', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const appointments = [];
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return appointments;
    } catch (error) {
      // Fallback without orderBy
      console.log("⚠️ Trying without orderBy...");
      const querySnapshot = await getDocs(appointmentsCollection);
      
      const appointments = [];
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return appointments;
    }
  } catch (error) {
    console.error('❌ Error fetching all appointments:', error);
    return [];
  }
}

/**
 * Cập nhật trạng thái lịch hẹn
 */
export async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await setDoc(appointmentRef, {
      status: newStatus,
      updated_at: Timestamp.now()
    }, { merge: true });
    
    console.log(`✅ Updated appointment ${appointmentId} to ${newStatus}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating appointment status:', error);
    throw error;
  }
}