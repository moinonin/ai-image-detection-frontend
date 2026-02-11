import React from 'react';
import { useToast } from '../contexts/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, remove } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`} onClick={() => remove(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
