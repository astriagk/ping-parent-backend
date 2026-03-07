import { DeviceType } from "@shared/constants/enums";

export interface DeviceToken {
  _id?: any;
  user_id: string;
  role: string;
  fcm_token: string;
  device_type: DeviceType;
  device_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
