import './ChatTalk.scss';
import { DirectData, FriendData, IntraData } from '../../../Interfaces/interfaces';
import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { ArrowBendUpLeft, PaperPlaneRight } from 'phosphor-react';
import { ChatMessage } from './ChatMessage';
import * as uuid from 'uuid';
import { actionsChat, stateChat } from '../../../chat/chatState';
import { useSnapshot } from 'valtio';
import { IntraDataContext } from '../../../contexts/IntraDataContext';
import { ProfileFriendModal } from '../../ProfileFriendsModal/ProfileFriendsModal';
import ReactTooltip from 'react-tooltip';
import { ChatContext } from '../../../contexts/ChatContext';

interface ChatTalkProps {

}

export interface ChatMsg {
  id: string;
  user: IntraData;
  msg: string;
  date: Date;
}

export function ChatTalk({  }: ChatTalkProps) {

  const {activeChat, setActiveChat} = useContext(ChatContext);
  const [friendProfileVisible, setFriendProfileVisible] = useState(false);
  // const { intraData, setIntraData } = useContext(IntraDataContext);
  // const currentStateChat = useSnapshot(stateChat);

  // useEffect(() => {
  //   actionsChat.initializeSocketChat();
  //   actionsChat.startChatMessage([]);
  // }, []);

  const [message, setMessage] = useState('');

  /**
   * The function takes an event as an argument, and then calls the preventDefault() method on the
   * event
   * @param event - React.FormEvent<HTMLFormElement>
   */
  function handleKeyEnter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  /**
   * It sends a message to the server if the message is not empty
   */
  function submitMessage() {
    // if (message.trim()) {
    //   const newMessage: ChatMsg = {
    //     id: uuid.v4(),
    //     user: intraData,
    //     msg: message,
    //     date: new Date(Date.now()),
    //   };
    //   // currentStateChat.socket?.emit('msgToServer', newMessage);
    // }
    setMessage('');
  }

  /**
   * Received message is a function that takes a message of type ChatMsg and
   * updates the chat message.
   * @param {ChatMsg} message - ChatMsg - The message that was received.
   */
  // function receivedMessage(message: ChatMsg) {
  //   actionsChat.updateChatMessage(message);
  // }

  // useEffect(() => {
  //   if (currentStateChat.socket) {
  //     currentStateChat.socket.on('msgToClient', (message: ChatMsg) => {
  //       receivedMessage(message);
  //     });
  //   }
  // }, [currentStateChat.socket]);

  // const refBody: React.RefObject<HTMLDivElement> = useRef(null);
  // useEffect(() => {
  //   if (
  //     refBody.current &&
  //     refBody.current.scrollHeight > refBody.current.offsetHeight
  //   ) {
  //     refBody.current.scrollTop =
  //       refBody.current.scrollHeight - refBody.current.offsetHeight;
  //   }
  // }, [currentStateChat.chatMsg]);




  return (
    <div className='chat__talk'>
      {activeChat != null &&
        <>
          <div className='chat__talk__header'>
            <ArrowBendUpLeft size={32} onClick={() => setActiveChat(null)} />
            <div
              className='chat__talk__header__user'
              onClick={() => setFriendProfileVisible(true)}
              data-html={true}
              data-tip={`${activeChat.login} profile`}
            >
              <div
                className='chat__talk__header__user__icon'
                style={{ backgroundImage: `url(${activeChat.image_url})` }}
              />
              <div className='chat__talk__header__user__name'>
                {activeChat.login}
              </div>
            </div>
          </div>
          <div className='chat__talk__body'
          // ref={refBody}
          >
            {/* {currentStateChat.chatMsg?.map((msg) => (
              <ChatMessage key={msg.id} user={intraData} message={msg} />
            ))} */}
          </div>
          {friendProfileVisible &&
            <ProfileFriendModal
              login={activeChat.login}
              setFriendProfileVisible={setFriendProfileVisible} />
          }
          <form className='chat__talk__footer' onSubmit={handleKeyEnter}>
            <input
              className='chat__talk__footer__input'
              value={message}
              onChange={(msg) => setMessage(msg.target.value)}
            />
            <button className='chat__talk__footer__button' type='submit'>
              <PaperPlaneRight size={30} />
            </button>
          </form>
          <ReactTooltip className='chat__friends__header__icon__tip' delayShow={50} />
        </>
      }
    </div >
  );
}
