import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMessageCircle } from 'react-icons/fi';

const Notification = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
              }
            }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-white/85 backdrop-blur-lg shadow-lg rounded-[100px] py-3 px-6 flex items-start space-x-4 min-w-[320px] font-poppins border border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 hover:bg-white/95 transform cursor-default hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-800 tracking-wide text-[17px]">{notification.title}</p>
              <p className="mt-2 text-gray-600 text-[15px] leading-relaxed">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 opacity-50 hover:opacity-100"
            >
              <FiX size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification; 