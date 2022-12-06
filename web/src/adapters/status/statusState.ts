import { Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { proxy, ref } from 'valtio';
import { GlobalData, IntraData, MsgToClient } from '../../others/Interfaces/interfaces';
import { getGlobalDirects, getGlobalGroups, getGlobalInDb, getGlobalUsers } from '../../others/utils/utils';
import { actionsChat } from '../chat/chatState';

import {
  createSocketStatus,
  CreateSocketStatusOptions,
  socketStatusIOUrl,
} from './status.socket-io';

export interface AppStateStatus {
  socket?: Socket;
  setIntraData?: Dispatch<SetStateAction<IntraData>> | null;
  setUpdateUser?: Dispatch<SetStateAction<number>> | null;
  setGlobalData?: Dispatch<SetStateAction<GlobalData>> | null;
}

const stateStatus = proxy<AppStateStatus>({});

const actionsStatus = {

  initializeSocketStatus: (
    setIntraData: Dispatch<SetStateAction<IntraData>>,
    setGlobalData: Dispatch<SetStateAction<GlobalData>>
  ): void => {
    if (!stateStatus.socket) {
      const createSocketOptions: CreateSocketStatusOptions = {
        socketStatusIOUrl: socketStatusIOUrl,
        actionsStatus: actionsStatus,
        stateStatus: stateStatus,
      };
      stateStatus.socket = ref(createSocketStatus(createSocketOptions));
      stateStatus.setIntraData = ref(setIntraData);
      stateStatus.setGlobalData = ref(setGlobalData);
      return;
    }

    if (!stateStatus.socket.connected) {
      stateStatus.socket.connect();
      stateStatus.setIntraData = ref(setIntraData);
      stateStatus.setGlobalData = ref(setGlobalData);
      return;
    }
  },

  disconnectSocketStatus() {
    if (stateStatus.socket?.connected) {
      stateStatus.socket?.disconnect();
    }
  },

  async iAmOnline() {
    const user = await getGlobalInDb();
    stateStatus.socket?.emit('iAmOnline', user.login);
  },

  async iAmInGame() {
    const user = await getGlobalInDb();
    stateStatus.socket?.emit('iAmInGame', user.login);
  },

  async updateUserStatus(login: string, status: string) {
    if (stateStatus.setGlobalData) {
      const globalUsers = await getGlobalUsers();
      stateStatus.setGlobalData(prev => {
        return {
          ...prev,
          friends: prev.friends.map(friend =>
            login === friend.login ? { ...friend, status: status } : friend)
            .sort((a, b) => {
              if (a.status !== b.status) {
                if (a.status === 'offline')
                  return 1;
                if (b.status === 'offline')
                  return -1;
              }
              return a.login.toLowerCase() < b.login.toLowerCase() ? -1 : 1;
            }),
          blocked: prev.blocked.map(blocked =>
            login === blocked.login ? { ...blocked, status: status } : blocked),
          globalUsers: globalUsers,
        }
      });
    }
  },

  changeLogin(login: string) {
    stateStatus.socket?.emit('changeLogin', login);
  },

  updateYourSelfLogin(login: string) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prev) => {
        return { ...prev, login: login };
      });
    }
  },

  async updateUserLogin(oldLogin: string, newLogin: string) {
    if (stateStatus.setGlobalData) {
      const globalUsers = await getGlobalUsers();
      stateStatus.setGlobalData(prev => {
        return {
          ...prev,
          friends: prev.friends.map(friend =>
            oldLogin === friend.login ? { ...friend, login: newLogin } : friend)
            .sort((a, b) => {
              if (a.status !== b.status) {
                if (a.status === 'offline')
                  return 1;
                if (b.status === 'offline')
                  return -1;
              }
              return a.login.toLowerCase() < b.login.toLowerCase() ? -1 : 1;
            }),
          blocked: prev.blocked.map(blocked =>
            oldLogin === blocked.login ? { ...blocked, login: newLogin } : blocked),
          globalUsers: globalUsers,
          directs: prev.directs.map(direct =>
            oldLogin === direct.name ? { ...direct, name: newLogin } : direct),
        }
      });
    }
  },

  changeImage(image_url: string | undefined) {
    stateStatus.socket?.emit('changeImage', image_url as String);
  },

  updateYourSelfImage(image: string) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prev) => {
        return { ...prev, image_url: image };
      });
    }
  },

  async updateUserImage(login: string, image: string) {
    if (stateStatus.setGlobalData) {
      const globalUsers = await getGlobalUsers();
      stateStatus.setGlobalData(prev => {
        return {
          ...prev,
          friends: prev.friends.map(friend =>
            login === friend.login ? { ...friend, image_url: image } : friend),
          blocked: prev.blocked.map(blocked =>
            login === blocked.login ? { ...blocked, image_url: image } : blocked),
          globalUsers: globalUsers,
          directs: prev.directs.map(direct =>
            login === direct.name ? { ...direct, image: image } : direct),
        }
      });
    }
  },

  newNotify(userTarget: string) {
    stateStatus.socket?.emit('newNotify', userTarget);
  },

  removeNotify() {
    stateStatus.socket?.emit('removeNotify');
  },

  async updateNotify() {
    if (stateStatus.setGlobalData) {
      const global = await getGlobalInDb();
      stateStatus.setGlobalData((prev) => {
        return { ...prev, notify: global.notify };
      });
    }
  },

  newFriend(userSource: string) {
    stateStatus.socket?.emit('newFriend', userSource);
  },

  removeFriend(friend: string) {
    stateStatus.socket?.emit('removeFriend', friend);
  },

  async updateFriend() {
    if (stateStatus.setGlobalData) {
      const global = await getGlobalInDb();
      stateStatus.setGlobalData((prev) => {
        if (prev.friends.length < global.friends.length)
          return {
            ...prev,
            friends: global.friends,
          };
        return {
          ...prev,
          friends: global.friends.sort((a, b) => {
            if (a.status !== b.status) {
              if (a.status === 'offline')
                return 1;
              if (b.status === 'offline')
                return -1;
            }
            return a.login.toLowerCase() < b.login.toLowerCase() ? -1 : 1;
          }),
        };
      });
    }
  },

  newBlocked(blocked: string) {
    stateStatus.socket?.emit('newBlocked', blocked);
  },

  removeBlocked(blocked: string) {
    stateStatus.socket?.emit('removeBlocked', blocked);
  },

  async updateBlocked() {
    if (stateStatus.setGlobalData) {
      const global = await getGlobalInDb();
      const directs = await getGlobalDirects();
      stateStatus.setGlobalData((prev) => {
        return {
          ...prev,
          friends: global.friends,
          blocked: global.blocked,
          directs: directs,
        };
      })
    }
  },

  async newDirect(name: string, chat: string) {
    stateStatus.socket?.emit('newDirect', { login: name, chat: chat });
    if (stateStatus.setGlobalData) {
      const directs = await getGlobalDirects();
      stateStatus.setGlobalData((prev) => {
        return { ...prev, directs: directs };
      });
    }
  },

  async updateDirects(chat: string) {
    actionsChat.joinChat(chat);
    if (stateStatus.setGlobalData) {
      const directs = await getGlobalDirects();
      stateStatus.setGlobalData((prev) => {
        return { ...prev, directs: directs };
      });
    }
  },

  async updateDirectInfos(message: MsgToClient) {
    if (stateStatus.setGlobalData) {
      stateStatus.setGlobalData((prev) => {
        return {
          ...prev,
          directs: prev.directs.map((key) => {
            if (key.id === message.chat) {
              return {
                ...key,
                date: message.date,
                newMessages: key.newMessages + 1
              };
            }
            return key;
          }).sort((a, b) => a.date < b.date ? 1 : -1),
        };
      });
    }
  },

  async updateGroups() {
    if (stateStatus.setGlobalData) {
      const groups = await getGlobalGroups();
      stateStatus.setGlobalData((prev) => {
        return { ...prev, groups: groups };
      });
    }
  },

  async updateGroupInfos(message: MsgToClient) {
    if (stateStatus.setGlobalData) {
      stateStatus.setGlobalData((prev) => {
        return {
          ...prev,
          groups: prev.groups.map((key) => {
            if (key.id === message.chat) {
              return {
                ...key,
                date: message.date,
                newMessages: key.newMessages + 1
              };
            }
            return key;
          }).sort((a, b) => a.date < b.date ? 1 : -1),
        };
      });
    }
  },
};

export type AppActionsStatus = typeof actionsStatus;

export { stateStatus, actionsStatus };
