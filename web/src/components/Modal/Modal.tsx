import { XCircle } from 'phosphor-react';
import { ReactNode } from 'react';
import './Modal.scss';

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function Modal({ id = 'modal', children, onClose = () => { } }: ModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOutsideClick = (e: any) => {
    if (e.target.id == id) onClose();
  };

  return (
    <div id={id} className='modal' onClick={handleOutsideClick}>
      <div className="modal__container">
        <button onClick={onClose} className="modal__container__closeButton" >
          <XCircle size={40} />
        </button>
        <div className="modal__container__content">
          {children}
        </div>
      </div>
    </div>
  );
}