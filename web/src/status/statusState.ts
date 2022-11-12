import { Socket } from 'socket.io-client';
import { proxy, ref } from 'valtio';
import { IntraData } from '../Interfaces/interfaces';
import { getInfos } from '../pages/OAuth/OAuth';
import { getAccessToken } from '../utils/utils';
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

async function getUserData(): Promise<IntraData | null> {
  let localStore = window.localStorage.getItem('userData');
  if (!localStore) {
    await getInfos();
    localStore = window.localStorage.getItem('userData');
    if (!localStore)
      return null;
  }
  return JSON.parse(localStore);
}

const actionsStatus = {
  initializeSocketStatus: (): void => {
    if (!stateStatus.socket) {

      const createSocketOptions: CreateSocketStatusOptions = {
        accessToken: getAccessToken(),
        socketStatusIOUrl: socketStatusIOUrl,
        actionsStatus: actionsStatus,
        stateStatus: stateStatus,
      };
      stateStatus.socket = ref(createSocketStatus(createSocketOptions));
      return;
    }

    if (!stateStatus.socket.connected) {
      stateStatus.socket.connect();
      stateStatus.socket.emit('iAmOnline', {
        login: stateStatus.me?.login,
        image_url: stateStatus.me?.image_url
      });
      return;
    }
  },

  disconnectSocketStatus() {
    if (stateStatus.socket?.connected) {
      stateStatus.socket?.disconnect();
    }
  },

  async updateFriends(loggedUsers: UserData[]) {
    const data: IntraData | null = await getUserData();
    if (!data)
      return;

    data.friends = data.friends.map(friend => {
      if (loggedUsers.map(e => e.login).indexOf(friend.login) >= 0) {
        const updateFriend = loggedUsers.find(e => e.login === friend.login);
        return typeof updateFriend !== 'undefined' ? updateFriend : friend;
      }
      return friend;
    });

    window.localStorage.setItem('userData', JSON.stringify(data));
  },

  async updateUser(user: UserData) {
    const data: IntraData | null = await getUserData();
    if (!data)
      return;

    data.friends = data.friends.map(friend => {
      if (user.login === friend.login)
        return user;
      return friend;
    });

    window.localStorage.setItem('userData', JSON.stringify(data));
  },

  async updateYourSelf(user: UserData) {
    const data: IntraData | null = await getUserData();
    if (!data)
      return;

    data.login = user.login;
    data.image_url = user.image_url;

    window.localStorage.setItem('userData', JSON.stringify(data));
  },

  async updateUserLogin(oldUser: UserData, newUser: UserData) {
    const data: IntraData | null = await getUserData();
    if (!data)
      return;

    data.friends = data.friends.map(friend => {
      if (oldUser.login === friend.login)
        return newUser;
      return friend;
    });

    window.localStorage.setItem('userData', JSON.stringify(data));
  },

};

export type AppActionsStatus = typeof actionsStatus;

export { stateStatus, actionsStatus };
