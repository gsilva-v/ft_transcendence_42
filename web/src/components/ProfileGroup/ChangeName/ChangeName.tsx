import './ChangeName.scss';
import { useContext, useState } from 'react';
import { PaperPlaneRight } from 'phosphor-react';
import { IntraDataContext } from '../../../contexts/IntraDataContext';
import { Modal } from '../../Modal/Modal';
import { actionsChat } from '../../../adapters/chat/chatState';


interface ChangeNameProps {
  id: string | undefined;
  setModalChangeName: (arg0: boolean) => void;
}

export function ChangeName({ id, setModalChangeName }: ChangeNameProps) {

  const { api, config } = useContext(IntraDataContext);
  const [name, setName] = useState<string>('');
  const [placeHolder, setPlaceHolder] = useState('');

  function handleKeyEnter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleChangeName();
  }

  async function handleChangeName() {
    try {
      const result = await api.patch('/chat/updateGroup', { id: id, name: name }, config);
      console.log(result);
      if (result.status === 200) {
        setModalChangeName(false);
        setPlaceHolder('');
      }
    } catch (e: any) {
      if (e && e.response) {
        setPlaceHolder('Error');
      }
    }
    setName('');
    actionsChat.updateGroup();
  }

  return (
    <Modal id='changeName__modal' onClose={() => setModalChangeName(false)}>
      <form className='changeName__modal' onSubmit={handleKeyEnter}>
        <h3>Insert the new nick</h3>
        <div className='changeName__modal__text__div'>
          <input
            className='changeName__modal__input'
            value={name}
            placeholder={placeHolder}
            style={{ border: placeHolder !== '' ? '3px solid red' : 'none' }}
            onChange={(msg) => {
              setName(msg.target.value);
              setPlaceHolder('');
            }}
            ref={e => e?.focus()}
          />
          <button className='changeName__modal__button' type='submit'>
            <PaperPlaneRight size={30} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
