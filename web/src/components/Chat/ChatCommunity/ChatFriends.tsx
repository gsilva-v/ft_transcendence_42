import './ChatFriends.scss';
import axios from 'axios';
import { MagnifyingGlass, PaperPlaneRight, UserPlus } from 'phosphor-react';
import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { useSnapshot } from 'valtio';
import { FriendData } from '../../../Interfaces/interfaces';
import { stateStatus } from '../../../status/statusState';
import { Modal } from '../../Modal/Modal';
import { UserCard } from './UserCard';
import { IntraDataContext } from '../../../contexts/IntraDataContext';

interface ChatFriendsProps {
  setActiveFriend: Dispatch<SetStateAction<FriendData | null>>;
}

export function ChatFriends({ setActiveFriend }: ChatFriendsProps) {
  const { intraData } = useContext(IntraDataContext);
  const currentStateStatus = useSnapshot(stateStatus);
  const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
  const [placeHolder, setPlaceHolder] = useState('');
  const [user_target, setUserTarget] = useState('');
  function handleKeyEnter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendFriendRequest();
  }

  async function sendFriendRequest() {
    console.log(user_target);
    const token = window.localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    };
    try {
      await axios.patch(
        `http://${import.meta.env.VITE_API_HOST}:3000/user/sendFriendRequest`,
        { nick: user_target },
        config
      );
      setIsAddFriendModalVisible(false);
      setPlaceHolder('');
      currentStateStatus.socket?.emit('newNotify', user_target);
    } catch (err) {
      setPlaceHolder('Invalid nick!');

    }
    setUserTarget('');
  }

  return (
    < div className='chat__friends' >
      <div className='chat__friends__header'>
        <UserPlus className='chat__friends__header__icon' size={40}
          onClick={() => setIsAddFriendModalVisible(true)} />
        < MagnifyingGlass className='chat__friends__header__icon' size={40} />
      </div>
      <div className='chat__friends__body'>

        {intraData.friends.map((obj) => (
          <UserCard key={obj.login} friend={obj} setActiveFriend={setActiveFriend} />
        ))
        }
      </div>
      {isAddFriendModalVisible &&
        <Modal
          onClose={() => {
            setIsAddFriendModalVisible(false);
            setPlaceHolder('');
            setUserTarget('');
          }}
          id={'modal__chatFriends'}
        >
          <form className='chat__friends__modal' onSubmit={handleKeyEnter}>
            <div className='chat__friends__modal__textdiv'>
              <h3>Insert user nick</h3>
              <input
                className='chat__friends__modal__input'
                value={user_target}
                placeholder={placeHolder}
                style={{ border: placeHolder !== '' ? '3px solid red' : 'none' }}
                onChange={(msg) => {
                  setUserTarget(msg.target.value);
                  setPlaceHolder('');
                }}
              />
            </div>
            <button className='chat__friends__modal__button' type='submit'>
              <PaperPlaneRight size={30} />
            </button>
          </form>
        </Modal>
      }
    </div >);
}