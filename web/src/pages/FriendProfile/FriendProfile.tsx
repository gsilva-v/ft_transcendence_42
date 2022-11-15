import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FriendProfileGeneral } from '../../components/FriendProfile/FriendProfileGeneral/FriendProfileGeneral';
import { FriendProfileHistoric } from '../../components/FriendProfile/FriendProfileHistoric/FriendProfileHistoric';
import './FriendProfile.scss';

export default function FriendProfile() {
  const [tableSelected, setTableSelected] = useState('General');
  const {login} = useParams();
 
  const defaultFriend ={
    image_url: 'default',
    wins: '0',
    name:'default',
    login: 'default',
    lose: '0',
    matches:'0',
  };
  const [friend, setFriend] = useState(defaultFriend);

  async function getFriend() {
    
    const token = window.localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      }, 
    };
    const api = axios.create({
      baseURL: `http://${import.meta.env.VITE_API_HOST}:3000`,
    });
    const response = await api.patch('/user/friend', {nick:login} ,config);
    // console.log(response);
    if (!response.data.image_url.includes('https://cdn.intra.42.fr/'))
      response.data.image_url = `/public/${response.data.image_url}`;
    setFriend(response.data);
  }
    
  useEffect(() => {
    // console.log(notify);
    getFriend();
    console.log(friend);
  },[login]);





  return (
    <div className='body'>
      <nav className='friendProfile__header'>
        <ul className='friendProfile__header__list'>
          <li className={`friendProfile__header__list__item
          ${tableSelected === 'General' ?
      'friendProfile__header__list__item__selected' : ''}`}>
            <button onClick={() => setTableSelected('General')}>
              General
            </button>
          </li>
          <li className={`friendProfile__header__list__item
          ${tableSelected === 'Historic' ?
      'friendProfile__header__list__item__selected' : ''}`}>
            <button onClick={() => setTableSelected('Historic')}>
              Historic
            </button>
          </li>
        </ul>
      </nav>
      <div className='friendProfile__body'>
        {(() => {
          if (tableSelected === 'General')
            return <FriendProfileGeneral friendData={friend}/>;
          if (tableSelected === 'Historic')
            return <FriendProfileHistoric friendData={friend}/>;
  
        })()}
      </div>
    </div >
  );
}
