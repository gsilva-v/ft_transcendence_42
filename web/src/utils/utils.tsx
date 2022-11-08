import axios from 'axios';
import { Dispatch, SetStateAction, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ValidateTfa } from '../components/ValidateTfa/ValidateTfa';
import { IntraData } from '../Interfaces/interfaces';
import { getInfos } from '../pages/OAuth/OAuth';

export function getAccessToken() {
  return (window.localStorage.getItem('token'));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RequireAuth({ children }: any) {
  const token = window.localStorage.getItem('token');
  const [isTfaValid, setIsTfaValid] = useState(false);

  /**
   * It checks if the user has TFA enabled, if not, it sets the isTfaValid state to true. If the user has
   useEffect(() => {
    getStoredData(setIntraData);
  }, []);
   * TFA enabled, it checks if the user has validated TFA, if not, it sets the isTfaValid state to false.
   * If the user has TFA enabled and has validated TFA, it sets the isTfaValid state to true
   * @returns a boolean value.
   */
  async function validateTFA() {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const api = axios.create({
      baseURL: `http://${import.meta.env.VITE_API_HOST}:3000`,
    });

    const user = await api.get('/user/me', config);
    if (
      user.data.isTFAEnable !== undefined &&
      user.data.isTFAEnable === false
    ) {
      setIsTfaValid(true);
      return;
    }
    if (user.data.isTFAEnable && user.data.tfaValidated !== true) {
      setIsTfaValid(false);
      return;
    }
    setIsTfaValid(true);
  }

  validateTFA();

  if (isTfaValid === false) {
    return (
      <div>
        <ValidateTfa />
      </div>
    );
  }

  return token ? children : <Navigate to="/signin" replace />;
}

export async function getStoredData(
  setIntraData: Dispatch<SetStateAction<IntraData>>
) {
  let localStore = window.localStorage.getItem('userData');
  if (!localStore) {
    await getInfos();
    localStore = window.localStorage.getItem('userData');
    if (!localStore) return;
  }
  const data: IntraData = JSON.parse(localStore);
  setIntraData(data);
}

export const defaultIntra: IntraData = {
  email: 'ft_transcendence@gmail.com',
  first_name: 'ft',
  image_url: 'nop',
  login: 'PingPong',
  usual_full_name: 'ft_transcendence',
  matches: '0',
  wins: '0',
  lose: '0',
  isTFAEnable: false,
  tfaValidated: false,
};
