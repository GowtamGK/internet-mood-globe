import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOODS } from '../utils/moodConfig';

export default function MoodSelector({ onMoodSelect, submitting, submitStatus }) {
  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    if (submitStatus?.type === 'success') {
      // Reset selection after successful submission
      setTimeout(() => {
        setSelectedMood(null);
      }, 2000);
    }
  }, [submitStatus]);

  const handleMoodClick = (mood) => {
    if (submitting) return;
    
    setSelectedMood(mood);
    if (onMoodSelect) {
      onMoodSelect(mood);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-black/80 backdrop-blur-md rounded-full px-6 py-4 border border-white/20 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium mr-2">How are you feeling?</span>
            {MOODS.map((mood) => (
              <motion.button
                key={mood.emoji}
                whileHover={submitting ? {} : { scale: 1.2 }}
                whileTap={submitting ? {} : { scale: 0.9 }}
                onClick={() => handleMoodClick(mood.emoji)}
                disabled={submitting}
                className={`text-3xl transition-all duration-200 ${
                  selectedMood === mood.emoji
                    ? 'scale-125 filter drop-shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={mood.label}
              >
                {mood.emoji}
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence>
            {submitStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`text-xs font-medium ${
                  submitStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {submitStatus.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
