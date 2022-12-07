import './Button.scss';
import { User, UserList } from 'phosphor-react';
import { useContext, useEffect, useState } from 'react';
import { ProfileGroupModal } from '../ProfileGroup/ProfileGroupModal/ProfileGroupModal';
import { ProfileUserModal } from '../ProfileUser/ProfileUserModal/ProfileUserModal';
import { GlobalContext } from '../../contexts/GlobalContext';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface ButtonNotifyProfileProps {
  id: string;
  type: string;
}

export function ButtonNotifyProfile({ id, type }: ButtonNotifyProfileProps) {

  const { updateUserProfile } = useContext(GlobalContext);
  const [profileGroupVisible, setProfileGroupVisible] = useState('');
  const [profileUserVisible, setProfileUserVisible] = useState('');

  useEffect(() => {
    if (updateUserProfile.newLogin && updateUserProfile.login === profileUserVisible) {
      setProfileUserVisible(updateUserProfile.newLogin);
    }
  }, [updateUserProfile]);

  function handleShowProfile() {
    if (type === 'User')
      setProfileUserVisible(id);
    else
      setProfileGroupVisible(id);
  }

  return (
    <>
      <button
        id='notifyProfile_button'
        className='button__icon'
        onClick={handleShowProfile}
        data-tooltip-content={`${type} Profile`}
      >
        {type === 'User' ?
          <User size={32} /> :
          <UserList size={32} />
        }
        <Tooltip anchorId='notifyProfile_button' delayShow={50} />
      </button>
      {
        profileGroupVisible !== '' &&
        <ProfileGroupModal id={id}
          setProfileGroupVisible={setProfileGroupVisible} />
      }
      {
        profileUserVisible !== '' &&
        <ProfileUserModal login={id}
          setProfileUserVisible={setProfileUserVisible} />
      }
    </>
  );
}