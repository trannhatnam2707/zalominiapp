import React, { FC, useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { selectedDeliveryTimeState } from "state";
import { displayDate, displayHalfAnHourTimeRange } from "utils/date";
import { matchStatusBarColor } from "utils/device";
import { Picker } from "zmp-ui";

// Opening hours: 7:00 - 21:00
const OPENING_HOUR = 7;
const CLOSING_HOUR = 21;

export const TimePicker: FC = () => {
  const [date, setDate] = useState(+new Date());
  const [time, setTime] = useRecoilState(selectedDeliveryTimeState);

  const availableDates = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = today.getHours() >= CLOSING_HOUR ? 1 : 0; i < 5; i++) {
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
    if (now.getDate() === new Date(date).getDate()) {
      // Starting time is the current time rounded up to the nearest 30 minutes
      const minutes = Math.ceil(now.getMinutes() / 30) * 30;
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
    endTime.setSeconds(0);
    endTime.setMilliseconds(0);
    while (time <= endTime) {
      times.push(new Date(time));
      time.setMinutes(time.getMinutes() + 30);
    }
    return times;
  }, [date]);

  return (
    <Picker
      mask
      maskClosable
      onVisibilityChange={(visbile) => matchStatusBarColor(visbile)}
      inputClass="border-none bg-transparent text-sm text-primary font-medium text-md m-0 p-0 h-auto"
      placeholder="Chọn thời gian nhận hàng"
      title="Thời gian nhận hàng"
      value={{
        date,
        time: availableTimes.find((t) => +t === time)
          ? time
          : +availableTimes[0],
      }}
      formatPickedValueDisplay={({ date, time }) => {
        // Kiểm tra xem date và time có tồn tại không
        if (!date || !time) {
          return `Chọn thời gian`;
        }
        
        // Xử lý trường hợp date và time có thể là object hoặc giá trị trực tiếp
        const dateValue = typeof date === 'object' && date !== null && 'value' in date 
          ? date.value 
          : date;
        const timeValue = typeof time === 'object' && time !== null && 'value' in time 
          ? time.value 
          : time;
        
        return `${displayHalfAnHourTimeRange(new Date(timeValue))}, ${displayDate(
          new Date(dateValue)
        )}`;
      }}
      onChange={({ date, time }) => {
        if (date) {
          const dateValue = typeof date === 'object' && 'value' in date ? date.value : date;
          setDate(+dateValue);
        }
        if (time) {
          const timeValue = typeof time === 'object' && 'value' in time ? time.value : time;
          setTime(+timeValue);
        }
      }}
      data={[
        {
          options: availableTimes.map((time, i) => ({
            displayName: displayHalfAnHourTimeRange(time),
            value: +time,
          })),
          name: "time",
        },
        {
          options: availableDates.map((date, i) => ({
            displayName: displayDate(date, true),
            value: +date,
          })),
          name: "date",
        },
      ]}
    />
  );
};