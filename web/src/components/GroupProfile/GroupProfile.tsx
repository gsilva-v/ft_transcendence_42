import './GroupProfile.scss';
import { NotePencil } from 'phosphor-react';
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { actionsChat } from '../../adapters/chat/chatState';
import { ChatContext } from '../../contexts/ChatContext';
import { IntraDataContext } from '../../contexts/IntraDataContext';
import { CardAdmin } from './CardAdmin/CardAdmin';
import { CardMember } from './CardMember/CardMember';
import { CardOwner } from './CardOwner/CardOwner';
import { ChangeName } from './ChangeName/ChangeName';
import { Dropzone } from '../Profile/UserImage/Dropzone';
import { AddMember } from './AddMember/AddMember';
import { ChangeSecurity } from './ChangeSecurity/ChangeSecurity';
import { CardBanned } from './CardBanned/CardBanned';
import { getUrlImage } from '../../others/utils/utils';
import { Modal } from '../Modal/Modal';
import { ConfirmActionModal } from '../ConfirmActionModal/ConfirmActionModal';
import ReactTooltip from 'react-tooltip';


interface GroupProfileProps {
  id: string | undefined;
  setProfileGroupVisible: Dispatch<SetStateAction<boolean>>;
}

export function GroupProfile({ id, setProfileGroupVisible }: GroupProfileProps) {

  const { api, config, intraData } = useContext(IntraDataContext);
  const { setActiveChat, updateGroup } = useContext(ChatContext);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [modalChangeName, setModalChangeName] = useState(false);
  const [modalChangeSecurity, setModalChangeSecurity] = useState(false);
  const [modalAddMember, setModalAddMember] = useState(false);
  const [bannedVisible, setBannedVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [confirmActionVisible, setConfirmActionVisible] = useState('');

  const { data, status } = useQuery(
    ['getGroupInfos', updateGroup],
    async () => {
      const response = await api.patch('/chat/getProfileGroupById', { id: id }, config);
      return response.data;
    },
    {
      retry: false,
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (selectedFile)
      handleSubmit();
  }, [selectedFile]);

  async function handleSubmit() {
    const file = new FormData();
    file.append('name', data.name);
    if (selectedFile) {
      file.append('file', selectedFile);
      await api.post('/chat/updateGroupImage', file, config);
      await api.patch('/chat/updateGroup', { id: data.id, image: selectedFile.name }, config);
    }
    actionsChat.updateGroup();
  }

  function getPermission(level: string) {
    if (level === 'maxLevel')
      return data.role === 'owner';
    if (level === 'middleLevel')
      return data.role === 'owner' || data.role === 'admin';
    if (level === 'lowLevel')
      return data.role !== 'outside';
    return false;
  }


  function handleLeaveGroup() {
    actionsChat.leaveGroup(data.id, intraData.email);
    setProfileGroupVisible(false);
    setActiveChat(null);
  }

  if (status === 'loading')
    return <div className='group__profile' />;

  return (
    <div className='group__profile'>
      <div className='group__profile__infos'>
        <button
          className='group__profile__infos__securityButton'
          onClick={() => setBannedVisible(prev => !prev)}
        >UnBan
        </button>
        <div className='group__profile__infos__image'>
          <img src={getUrlImage(data.image)} alt="Group Image" />
          {getPermission('middleLevel') &&
            <div className='group__profile__infos__image__text'>
              <Dropzone onFileUploaded={setSelectedFile} />
            </div>
          }
        </div>
        <div className='group__profile__infos__name'>
          <strong>{data.name}</strong>
          {getPermission('middleLevel') &&
            <div className='group__profile__infos__name__button'>
              <NotePencil size={30} onClick={() => setModalChangeName(true)} />
              {modalChangeName &&
                <ChangeName id={id} setModalChangeName={setModalChangeName} />
              }
            </div>
          }
        </div>

        {getPermission('maxLevel') &&
          <>
            <button className='group__profile__infos__securityButton'
              onClick={() => { setModalChangeSecurity(true); }}
            >
              Change Security
            </button>
            {modalChangeSecurity &&
              <ChangeSecurity id={id} setModalChangeSecurity={setModalChangeSecurity} />
            }
          </>
        }
      </div >

      <div className='group__profile__members'>
        <div className='group__profile__members__action'>
          {getPermission(data.type === 'public' ? 'lowLevel' : 'middleLevel') &&
            <>
              <button onClick={() => { setModalAddMember(true); }}>
                Add Member
              </button>

            </>
          }
        </div>
        {modalAddMember &&
          <AddMember id={id} setModalAddMember={setModalAddMember} />
        }
        < div className='group__profile__members__body'>
          <>
            {(data.members && !bannedVisible) &&
              data.members.map((obj: any) => {
                if (obj.role === 'owner')
                  return <CardOwner key={Math.random()} member={obj} />;
                if (obj.role === 'admin')
                  return <CardAdmin key={Math.random()} id={data.id}
                    member={obj} getPermission={getPermission} />;
                else
                  return <CardMember key={Math.random()} id={data.id}
                    member={obj} getPermission={getPermission} />;
              })
            }
          </>
          {(data.banned && bannedVisible) &&
            data.banned.map((obj: any) => {
              return <CardBanned setProfileGroupVisible={setProfileGroupVisible} key={Math.random()} id={data.id} banned={obj} />;
            })
          }
        </div>
        <div className='group__profile__members__action'>
          {getPermission('lowLevel') &&
            <button onClick={() => setConfirmActionVisible('leave')}>
              Leave
            </button>
          }
        </div>
        {(() => {
          if (confirmActionVisible === 'leave') {
            return <ConfirmActionModal
              title={'Leave group?'}
              onClose={() => setConfirmActionVisible('')}
              confirmationFunction={handleLeaveGroup}
            />;
          }
        })()}
      </div>
      <ReactTooltip delayShow={50} />
    </div >
  );
}