export interface NotificationData {
  id: string;
  viewed: boolean;
  type: string;
  target_nick: string;
  source_nick: string;
}

export interface NotifyData {
  id: string;
  type: string;
  user_source: string;
  addtions_info: string;
  date: Date;
}

export interface FriendData {
  status: string;
  login: string;
  image_url: string;
}

export interface BlockedData {
  login: string;
  image_url: string;
}





export interface DirectUserData {
  login: string;
  image_url: string;
}

export interface DirectData {
  id: string;
  type: string;
  name?: string;
  image?: string;
  users: DirectUserData[];
}

export interface UserMsg {
  login: string;
  image: string;
}

export interface MsgToServer {
  chat: string;
  user: string;
  msg: string;
}

export interface MsgToClient {
  id: string;
  chat: string;
  user: UserMsg;
  date: Date;
  msg: string;
}

export interface DirectChatData {
  id: string;
  type: string;
  name: string;
  image: string;
  messages?: MsgToClient[];
}

export interface IntraData {
  first_name: string;
  email: string;
  usual_full_name: string;
  image_url: string;
  login: string;
  matches: string;
  wins: string;
  lose: string;
  isTFAEnable: boolean;
  tfaValidated: boolean;
  notify: NotifyData[];
  friends: FriendData[];
  blockeds: BlockedData[];
  directs: DirectData[]
}

export interface ErrResponse {
  statusCode: number;
  message: string;
  error: string;
}
