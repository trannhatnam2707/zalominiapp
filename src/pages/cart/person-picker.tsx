import { ListItem } from "components/list-item";
import React, { FC, useState } from "react";
import {
  useRecoilValue,
  useRecoilValueLoadable,
  useSetRecoilState,
  useRecoilState,
} from "recoil";
import { requestPhoneTriesState, userState, manualPhoneState } from "state";
import { Box, Icon, Input, Text } from "zmp-ui";
import { phoneState } from './../../state';

export const PersonPicker: FC = () => {
  const user = useRecoilValueLoadable(userState);
  const phone = useRecoilValue(phoneState);

  return (
    <ListItem
      title={
        user.state === "hasValue" ? `${user.contents.name} - ${phone}` : phone
      }
      subtitle="Người nhận"
    />
  );
};

export const RequestPersonPickerPhone: FC = () => {
  const user = useRecoilValueLoadable(userState);
  const [manualPhone, setManualPhone] = useRecoilState(manualPhoneState);
  const [isEditing, setIsEditing] = useState(false);

  const userName = user.state === "hasValue" ? user.contents.name : "Khách hàng";

  const handlePhoneChange = (value: string) => {
    // Chỉ cho phép nhập số và giới hạn độ dài
    const phoneNumber = value.replace(/\D/g, '').slice(0, 10);
    setManualPhone(phoneNumber);
  };

  return (
    <Box flex className="flex-1">
      <Box className="flex-1 space-y-[2px]">
        <Box flex alignItems="center" className="space-x-2">
          <Icon icon="zi-user" className="text-gray" />
          <Text size="small" className="font-medium text-primary">
            {userName}
          </Text>
        </Box>
        
        <Box flex alignItems="center" className="space-x-2 mt-1">
          <Icon icon="zi-call" className="text-gray" />
          {isEditing ? (
            <Input
              type="text"
              placeholder="Nhập số điện thoại (10 số)"
              value={manualPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="border-none px-0 text-sm text-gray"
              autoFocus
            />
          ) : (
            <Box 
              flex 
              alignItems="center" 
              className="flex-1 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              <Text size="xSmall" className="text-gray flex-1">
                {manualPhone || "Nhấn để nhập số điện thoại"}
              </Text>
              <Icon icon="zi-edit" className="text-primary" />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};