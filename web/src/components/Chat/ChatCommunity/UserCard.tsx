import './UserCard.scss';
import { FriendData } from '../../../Interfaces/interfaces';
import { Dispatch, SetStateAction, useEffect } from 'react';

interface UserCardProps {
  friend: FriendData;
  setActiveFriend: Dispatch<SetStateAction<FriendData | null>>;
}

export function UserCard({ friend, setActiveFriend }: UserCardProps) {
  // useEffect(() => {

  // }, []);

  return (
    <div className='user__card' onClick={() => setActiveFriend(friend)}>
      <div
        className='user__card__icon'
        style={{ backgroundImage: `url(${friend.image_url})` }}
      >
        <div className='user__card__status'
          style={{ backgroundColor: friend.status === 'online' ? 'green' : 'rgb(70, 70, 70)' }}>
        </div>
      </div>
      <div className='user__card__name'>{friend.login}</div>
    </div>
  );
}
