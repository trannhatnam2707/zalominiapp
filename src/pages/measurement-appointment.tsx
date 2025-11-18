import React, { FC, useState, useMemo } from "react";
import { Box, Header, Page, Button, Text, Picker, useNavigate, useSnackbar } from "zmp-ui";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";
import { storesState, manualPhoneState, userState } from "state";
import { useLocation } from "react-router";
import { createMeasurementAppointment } from "../../services/appointmentsService";

const OPENING_HOUR = 8;
const CLOSING_HOUR = 20;

const MeasurementAppointmentPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const snackbar = useSnackbar();
  const stores = useRecoilValue(storesState);
  const user = useRecoilValueLoadable(userState);
  const manualPhone = useRecoilValue(manualPhoneState);
  
  const { product, selectedOptions } = location.state || {};
  
  const [selectedStoreId, setSelectedStoreId] = useState<number>(stores[0]?.id);
  const [appointmentDate, setAppointmentDate] = useState(+new Date());
  const [appointmentTime, setAppointmentTime] = useState(+new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDates = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = today.getHours() >= CLOSING_HOUR ? 1 : 0; i < 7; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, []);

  const availableTimes = useMemo(() => {
    const times: Date[] = [];
    const now = new Date();
    let time = new Date();
    
    if (now.getDate() === new Date(appointmentDate).getDate()) {
      const minutes = Math.ceil(now.getMinutes() / 60) * 60;
      time.setHours(now.getHours());
      time.setMinutes(minutes);
    } else {
      time.setHours(OPENING_HOUR);
      time.setMinutes(0);
    }
    
    time.setSeconds(0);
    time.setMilliseconds(0);
    
    const endTime = new Date();
    endTime.setHours(CLOSING_HOUR);
    endTime.setMinutes(0);
    
    while (time < endTime) {
      times.push(new Date(time));
      time.setHours(time.getHours() + 1);
    }
    
    return times;
  }, [appointmentDate]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // ✅ LẤY SỐ ĐIỆN THOẠI VÀ TÊN NGƯỜI DÙNG
  const getPhoneNumber = () => {
    if (manualPhone) return manualPhone;
    const savedPhone = localStorage.getItem('userPhone');
    return savedPhone || "";
  };

  const getUserName = () => {
    if (user.state === "hasValue") {
      return user.contents.name;
    }
    return "Khách hàng";
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      // ✅ VALIDATE CỬA HÀNG
      if (!selectedStore) {
        snackbar.openSnackbar({
          type: "error",
          text: "Vui lòng chọn cửa hàng!",
        });
        return;
      }

      // ✅ VALIDATE SỐ ĐIỆN THOẠI
      const phoneNumber = getPhoneNumber();
      if (!phoneNumber || phoneNumber.length < 10) {
        snackbar.openSnackbar({
          type: "error",
          text: "Vui lòng cập nhật số điện thoại hợp lệ!",
        });
        return;
      }

      // ✅ VALIDATE SẢN PHẨM
      if (!product) {
        snackbar.openSnackbar({
          type: "error",
          text: "Không tìm thấy sản phẩm!",
        });
        return;
      }

      const userName = getUserName();
      const appointmentDate_obj = new Date(appointmentDate);
      const appointmentTime_obj = new Date(appointmentTime);

      console.log("=== CHUẨN BỊ LƯU LỊCH HẸN ===");
      console.log("Phone:", phoneNumber);
      console.log("Name:", userName);
      console.log("Product:", product.name);
      console.log("Store:", selectedStore.name);
      console.log("Date:", appointmentDate_obj);
      console.log("Time:", appointmentTime_obj);
      console.log("Timestamp:", appointmentTime);

      // ✅ CHUẨN BỊ DỮ LIỆU
      const appointmentData = {
        product,
        selectedOptions,
        store: selectedStore,
        date: appointmentDate_obj,
        time: appointmentTime_obj,
        timestamp: appointmentTime,
        phoneNumber: phoneNumber,
        userName: userName,
        note: "",
      };

      console.log("📅 Appointment Data:", appointmentData);

      // ✅ LƯU VÀO FIREBASE
      console.log("🚀 Đang lưu lịch hẹn...");
      const appointmentId = await createMeasurementAppointment(appointmentData);
      
      console.log("✅ Lịch hẹn đã lưu! ID:", appointmentId);

      snackbar.openSnackbar({
        type: "success",
        text: "Đặt lịch hẹn thành công!",
        duration: 2000,
      });

      // ✅ CHUYỂN ĐẾN TRANG LỊCH HẸN SAU 1.5 GIÂY
      setTimeout(() => {
        navigate("/appointment-history", { replace: true });
      }, 1500);

    } catch (error) {
      console.error("❌ Lỗi lưu lịch hẹn:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra!";
      
      snackbar.openSnackbar({
        type: "error",
        text: errorMessage,
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[date.getDay()];
  };

  return (
    <Page className="bg-background">
      <Header title="Đặt Lịch Hẹn Đo May" />
      
      <Box className="p-4 space-y-4">
        {/* THÔNG TIN SẢN PHẨM */}
        {product && (
          <Box className="bg-white rounded-xl p-4 space-y-2">
            <Text.Title size="small">Sản phẩm</Text.Title>
            <Box flex className="space-x-3">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <Box className="flex-1">
                <Text size="small" className="font-medium">{product.name}</Text>
                <Text size="xSmall" className="text-gray mt-1">May theo số đo</Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* CHỌN CỬA HÀNG */}
        <Box className="bg-white rounded-xl p-4 space-y-3">
          <Text.Title size="small">Chọn cửa hàng</Text.Title>
          
          <Box className="space-y-2">
            {stores.map((store) => (
              <Box
                key={store.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedStoreId === store.id
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <Box flex className="justify-between items-start">
                  <Box className="flex-1">
                    <Text size="small" className="font-medium">
                      {store.name}
                    </Text>
                    <Text size="xSmall" className="text-gray mt-1">
                      {store.address}
                    </Text>
                  </Box>
                  {selectedStoreId === store.id && (
                    <Box className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* CHỌN NGÀY */}
        <Box className="bg-white rounded-xl p-4 space-y-3">
          <Text.Title size="small">Chọn ngày</Text.Title>
          
          <Picker
            mask
            maskClosable
            placeholder="Chọn ngày"
            title="Chọn ngày hẹn"
            value={{ date: appointmentDate }}
            formatPickedValueDisplay={({ date }) => {
              const dateValue = typeof date === 'object' && date !== null && 'value' in date 
                ? date.value 
                : date;
              const d = new Date(dateValue);
              return `${getDayOfWeek(d)}, ${formatDate(d)}`;
            }}
            onChange={({ date }) => {
              if (date) {
                const dateValue = typeof date === 'object' && 'value' in date ? date.value : date;
                setAppointmentDate(+dateValue);
              }
            }}
            data={[
              {
                options: availableDates.map((date) => ({
                  displayName: `${getDayOfWeek(date)} - ${formatDate(date)}`,
                  value: +date,
                })),
                name: "date",
              },
            ]}
          />
        </Box>

        {/* CHỌN GIỜ */}
        <Box className="bg-white rounded-xl p-4 space-y-3">
          <Text.Title size="small">Chọn giờ</Text.Title>
          
          <Picker
            mask
            maskClosable
            placeholder="Chọn giờ"
            title="Chọn giờ hẹn"
            value={{ time: appointmentTime }}
            formatPickedValueDisplay={({ time }) => {
              const timeValue = typeof time === 'object' && time !== null && 'value' in time 
                ? time.value 
                : time;
              return formatTime(new Date(timeValue));
            }}
            onChange={({ time }) => {
              if (time) {
                const timeValue = typeof time === 'object' && 'value' in time ? time.value : time;
                setAppointmentTime(+timeValue);
              }
            }}
            data={[
              {
                options: availableTimes.map((time) => ({
                  displayName: formatTime(time),
                  value: +time,
                })),
                name: "time",
              },
            ]}
          />
        </Box>

        {/* THÔNG TIN TÓM TẮT */}
        <Box className="bg-blue-50 rounded-xl p-4 space-y-2">
          <Text size="xSmall" className="font-medium text-primary">
            📅 Thông tin lịch hẹn
          </Text>
          <Text size="xSmall" className="text-gray">
            • Cửa hàng: {selectedStore?.name || "Chưa chọn"}
          </Text>
          <Text size="xSmall" className="text-gray">
            • Thời gian: {formatTime(new Date(appointmentTime))}, {getDayOfWeek(new Date(appointmentDate))} {formatDate(new Date(appointmentDate))}
          </Text>
          <Text size="xSmall" className="text-gray">
            • Liên hệ: {getPhoneNumber() || "Chưa cập nhật"}
          </Text>
          <Text size="xxSmall" className="text-gray mt-2">
            💡 Vui lòng đến đúng giờ để được phục vụ tốt nhất
          </Text>
        </Box>

        {/* NÚT HÀNH ĐỘNG */}
        <Box className="sticky bottom-0 bg-background pt-4 pb-safe space-y-2">
          <Button
            fullWidth
            variant="primary"
            type="highlight"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedStore}
            loading={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            type="neutral"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Quay lại
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default MeasurementAppointmentPage;