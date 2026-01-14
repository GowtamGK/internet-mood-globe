import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function LocationPermissionModal({ onGrant, onDeny, isOpen }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await onGrant();
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Share Your Location
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              To show your mood on the globe, we need to know which country you're in. 
              Your exact location is never stored—only your country.
            </p>
            
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRequest}
                disabled={isRequesting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Requesting...' : 'Allow Location Access'}
              </motion.button>
              
              <button
                onClick={onDeny}
                disabled={isRequesting}
                className="text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              Your privacy is important. We only use your country, not your exact location.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
