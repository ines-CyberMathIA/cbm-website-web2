import React, { createContext, useContext } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const addNotification = ({ title, message, type = 'info' }) => {
    console.log('Notification ajoutée:', { title, message, type });
    
    const toastConfig = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: '100px',
        color: '#1F2937',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
        padding: '12px 24px',
        fontFamily: "'Poppins', sans-serif",
        transform: 'translateZ(0)',
        WebkitFontSmoothing: 'antialiased',
        margin: '10px',
        minWidth: '300px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
        }
      }
    };

    const content = (
      <div className="flex items-start space-x-4 font-poppins">
        <div className="flex-1">
          <div className="font-medium text-gray-900 tracking-wide text-[16px]">{title}</div>
          <div className="mt-2 text-gray-500 text-[14px] leading-relaxed">{message}</div>
        </div>
      </div>
    );

    switch (type) {
      case 'success':
        toast.success(content, toastConfig);
        break;
      case 'error':
        toast.error(content, toastConfig);
        break;
      case 'warning':
        toast.warning(content, toastConfig);
        break;
      case 'info':
      default:
        toast.info(content, toastConfig);
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 