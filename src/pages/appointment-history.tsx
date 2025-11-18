import React, { FC, useEffect, useState } from "react";
import { Box, Header, Page, Text, Button, useSnackbar } from "zmp-ui";
import { useRecoilState } from "recoil";
import { manualPhoneState } from "state";
import { getUserAppointments, updateAppointmentStatus } from "../../services/appointmentsService";
import { Timestamp } from "firebase/firestore";

interface Appointment {
  id: string;
  phone_number: string;
  user_name: string;
  product_id: number;
  product_name: string;
  product_image: string;
  selected_options: Record<string, any>;
  store_id: number;
  store_name: string;
  store_address: string;
  appointment_date: Timestamp;
  appointment_time: Timestamp;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  note: string;
  created_at: Timestamp;
}

const AppointmentHistoryPage: FC = () => {
  const [phone, setPhone] = useRecoilState(manualPhoneState);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const snackbar = useSnackbar();

  useEffect(() => {
    if (!phone) {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        setPhone(savedPhone);
      }
    }
  }, [phone, setPhone]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!phone) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userAppointments = await getUserAppointments(phone);
        console.log("📅 Loaded appointments:", userAppointments);
        setAppointments(userAppointments as Appointment[]);
      } catch (error) {
        console.error("❌ Lỗi tải lịch hẹn:", error);
        snackbar.openSnackbar({
          type: "error",
          text: "Không thể tải lịch hẹn",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [phone]);

  const formatDateTime = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDayOfWeek = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return "";
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[timestamp.toDate().getDay()];
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Chờ xác nhận", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: "⏳" };
      case "confirmed":
        return { text: "Đã xác nhận", color: "text-blue-600", bgColor: "bg-blue-50", icon: "✓" };
      case "completed":
        return { text: "Hoàn thành", color: "text-green-600", bgColor: "bg-green-50", icon: "✓" };
      case "cancelled":
        return { text: "Đã huỷ", color: "text-red-600", bgColor: "bg-red-50", icon: "✕" };
      default:
        return { text: status, color: "text-gray-600", bgColor: "bg-gray-50", icon: "•" };
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, "cancelled");
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: "cancelled" as const }
            : apt
        )
      );

      snackbar.openSnackbar({
        type: "success",
        text: "Đã huỷ lịch hẹn",
      });
    } catch (error) {
      console.error("❌ Lỗi huỷ lịch hẹn:", error);
      snackbar.openSnackbar({
        type: "error",
        text: "Không thể huỷ lịch hẹn",
      });
    }
  };

  const formatOptions = (options: Record<string, any>): string => {
    if (!options || Object.keys(options).length === 0) {
      return "";
    }
    
    const parts: string[] = [];
    for (const key in options) {
      const value = options[key];
      if (Array.isArray(value)) {
        parts.push(`${value.join(", ")}`);
      } else {
        parts.push(`${value}`);
      }
    }
    return parts.join(" • ");
  };

  if (!phone) {
    return (
      <Page className="bg-background">
        <Header title="Lịch hẹn của tôi" />
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
        <Header title="Lịch hẹn của tôi" />
        <Box className="flex-1 flex items-center justify-center">
          <Box className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <Text className="text-gray">Đang tải...</Text>
          </Box>
        </Box>
      </Page>
    );
  }

  if (appointments.length === 0) {
    return (
      <Page className="bg-background">
        <Header title="Lịch hẹn của tôi" />
        <Box className="flex-1 flex items-center justify-center p-4">
          <Box className="text-center space-y-2">
            <Text size="large" className="text-gray">📅</Text>
            <Text size="small" className="text-gray">
              Bạn chưa có lịch hẹn nào
            </Text>
            <Button size="small" onClick={() => window.location.href = '/'}>
              Đặt lịch ngay
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page className="bg-background">
      <Header title="Lịch hẹn của tôi" />
      
      <Box className="p-4 space-y-4">
        <Text size="xSmall" className="text-gray">
          Tìm thấy {appointments.length} lịch hẹn
        </Text>

        {appointments.map((appointment) => {
          const statusInfo = getStatusInfo(appointment.status);
          const isPending = appointment.status === "pending";
          const isUpcoming = appointment.appointment_time.toDate() > new Date();
          
          return (
            <Box key={appointment.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              <Box className="p-4 pb-3 border-b">
                <Box flex className="justify-between items-center mb-2">
                  <Text size="small" className="font-medium">
                    #{appointment.id.slice(-8).toUpperCase()}
                  </Text>
                  <Box className={`px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                    <Text size="xxxSmall" className={`font-medium ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.text}
                    </Text>
                  </Box>
                </Box>
                <Text size="xxxSmall" className="text-gray">
                  Đặt lúc: {formatDateTime(appointment.created_at)}
                </Text>
              </Box>

              {/* Product Info */}
              <Box className="p-4 space-y-3">
                <Text size="xSmall" className="font-medium">Sản phẩm</Text>
                
                <Box className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                  <img
                    src={appointment.product_image}
                    alt={appointment.product_name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/64x64?text=' + 
                        encodeURIComponent(appointment.product_name.charAt(0));
                    }}
                  />
                  
                  <Box className="flex-1 min-w-0">
                    <Text size="xSmall" className="font-medium line-clamp-2">
                      {appointment.product_name}
                    </Text>
                    
                    {formatOptions(appointment.selected_options) && (
                      <Text size="xxxSmall" className="text-gray mt-1">
                        {formatOptions(appointment.selected_options)}
                      </Text>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Appointment Details */}
              <Box className="px-4 pb-4 space-y-3">
                <Box className="border-t pt-3 space-y-2">
                  <Box flex className="items-start space-x-2">
                    <Text size="xSmall" className="text-gray">📍</Text>
                    <Box className="flex-1">
                      <Text size="xSmall" className="font-medium">
                        {appointment.store_name}
                      </Text>
                      <Text size="xxxSmall" className="text-gray">
                        {appointment.store_address}
                      </Text>
                    </Box>
                  </Box>
                  
                  <Box flex className="items-center space-x-2">
                    <Text size="xSmall" className="text-gray">🕐</Text>
                    <Text size="xSmall">
                      {appointment.appointment_time.toDate().getHours()}:00, {getDayOfWeek(appointment.appointment_time)} {formatDate(appointment.appointment_time)}
                    </Text>
                  </Box>

                  {appointment.note && (
                    <Box flex className="items-start space-x-2">
                      <Text size="xSmall" className="text-gray">📝</Text>
                      <Text size="xSmall" className="flex-1 italic text-gray">
                        {appointment.note}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Action buttons */}
                {isPending && isUpcoming && (
                  <Box className="pt-3 border-t">
                    <Button
                      fullWidth
                      variant="secondary"
                      type="danger"
                      size="small"
                      onClick={() => {
                        if (confirm("Bạn có chắc muốn huỷ lịch hẹn này?")) {
                          handleCancelAppointment(appointment.id);
                        }
                      }}
                    >
                      Huỷ lịch hẹn
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Page>
  );
};

export default AppointmentHistoryPage;