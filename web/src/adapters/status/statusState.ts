import { Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { proxy, ref } from 'valtio';
import { IntraData } from '../../others/Interfaces/interfaces';
import { getAccessToken, getUserInDb } from '../../others/utils/utils';
import {
  createSocketStatus,
  CreateSocketStatusOptions,
  socketStatusIOUrl,
} from './status.socket-io';

interface Me {
  id: string;
  login: string;
  email: string;
  image_url: string;
}

export interface UserData {
  status: string;
  login: string;
  image_url: string;
}

export interface AppStateStatus {
  socket?: Socket;
  me: Me | undefined;
  accessToken?: string | null;
  setIntraData?: Dispatch<SetStateAction<IntraData>> | null;
}

const stateStatus = proxy<AppStateStatus>({
  get me() {
    const localStore = window.localStorage.getItem('userData');
    if (!localStore) {
      return undefined;
    }
    const data: IntraData = JSON.parse(localStore);
    const myData: Me = {
      id: this.socket ? this.socket.id : '',
      login: data.login,
      email: data.email,
      image_url: data.image_url,
    };
    return myData;
  },
});

const actionsStatus = {

  initializeSocketStatus: (setIntraData: Dispatch<SetStateAction<IntraData>>): void => {
    if (!stateStatus.socket) {
      const createSocketOptions: CreateSocketStatusOptions = {
        accessToken: getAccessToken(),
        socketStatusIOUrl: socketStatusIOUrl,
        actionsStatus: actionsStatus,
        stateStatus: stateStatus,
      };
      stateStatus.socket = ref(createSocketStatus(createSocketOptions));
      stateStatus.setIntraData = ref(setIntraData);
      return;
    }

    if (!stateStatus.socket.connected) {
      stateStatus.socket.connect();
      stateStatus.setIntraData = ref(setIntraData);
      return;
    }
  },

  disconnectSocketStatus() {
    if (stateStatus.socket?.connected) {
      stateStatus.socket?.disconnect();
    }
  },

  whoIsOnline() {
    stateStatus.socket?.emit('whoIsOnline');
  },

  sortFriends() {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prevIntraData) => {
        return {
          ...prevIntraData, friends: prevIntraData.friends.sort((a, b) => {
            if (a.status !== b.status) {
              if (a.status === 'offline')
                return 1;
              if (b.status === 'offline')
                return -1;
            }
            return a.login.toLowerCase() < b.login.toLowerCase() ? -1 : 1;
          })
        };
      });
    }
  },

  onlineUsers(onlineUsers: UserData[]) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prevIntraData) => {
        return {
          ...prevIntraData, friends: prevIntraData.friends.map(friend => {
            if (onlineUsers.map(e => e.login).indexOf(friend.login) >= 0) {
              const updateFriend = onlineUsers.find(e => e.login === friend.login);
              return typeof updateFriend !== 'undefined' ? updateFriend : friend;
            }
            return friend;
          }),
        };
      });
      this.sortFriends();
    }
  },

  updateUser(user: UserData) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prevIntraData) => {
        return {
          ...prevIntraData, friends: prevIntraData.friends.map(friend =>
            user.login === friend.login ? user : friend)
        };
      });
      this.sortFriends();
    }
  },

  updateYourSelf(user: UserData) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prevIntraData) => {
        return { ...prevIntraData, login: user.login, image_url: user.image_url };
      });
    }
  },

  updateUserLogin(oldUser: UserData, newUser: UserData) {
    if (stateStatus.setIntraData) {
      stateStatus.setIntraData((prevIntraData) => {
        return {
          ...prevIntraData,
          friends: prevIntraData.friends.map(friend =>
            oldUser.login === friend.login ? newUser : friend),
          blockeds: prevIntraData.blockeds.map(blocked =>
            oldUser.login === blocked.login ? newUser : blocked),
        };
      });
      this.sortFriends();
    }
  },

  async updateNotify() {
    if (stateStatus.setIntraData) {
      const user = await getUserInDb();
      stateStatus.setIntraData((prevIntraData) => {
        return { ...prevIntraData, notify: user.notify };
      });
    }
  },

  async updateFriend() {
    if (stateStatus.setIntraData) {
      const user = await getUserInDb();
      stateStatus.setIntraData((prevIntraData) => {
        return {
          ...prevIntraData,
          friends: user.friends.map((obj) => {
            if (prevIntraData.friends.map(e => e.login).indexOf(obj.login) >= 0) {
              const updateFriend = prevIntraData.friends.find(e => e.login === obj.login);
              return typeof updateFriend !== 'undefined' ? updateFriend : obj;
            }
            return obj;
          })
        };
      });
      this.whoIsOnline();
    }
  },

  async updateBlocked() {
    if (stateStatus.setIntraData) {
      const user = await getUserInDb();
      stateStatus.setIntraData((prevIntraData) => {
        return {...prevIntraData, blockeds: user.blockeds};
      });
    }
  },

  async updateRemove() {
    if (stateStatus.setIntraData) {
      const user = await getUserInDb();
      stateStatus.setIntraData((prevIntraData) => {
        return { ...prevIntraData, friends: user.friends.map((obj) => {
          if (prevIntraData.friends.map(e => e.login).indexOf(obj.login) >= 0) {
            const updateFriend = prevIntraData.friends.find(e => e.login === obj.login);
            return typeof updateFriend !== 'undefined' ? updateFriend : obj;
          }
          return obj;
        }),
        blockeds: user.blockeds };
      });
      this.sortFriends();
    }
  },

};

export type AppActionsStatus = typeof actionsStatus;

export { stateStatus, actionsStatus };
