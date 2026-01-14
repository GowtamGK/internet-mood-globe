import { motion } from 'framer-motion';
import { getMoodLabel } from '../utils/moodConfig';

export default function CountryTooltip({ countryData, mousePosition }) {
  if (!countryData) return null;

  // Sort moods by percentage descending
  const sortedMoods = Object.entries(countryData.percentages || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4); // Max 4 moods

  // Calculate tooltip position to avoid going off-screen
  const tooltipWidth = 280;
  const tooltipHeight = 200;
  const padding = 10;
  
  let left = mousePosition.x + 15;
  let top = mousePosition.y - 10;
  
  // Adjust if tooltip would go off right edge
  if (left + tooltipWidth > window.innerWidth - padding) {
    left = mousePosition.x - tooltipWidth - 15;
  }
  
  // Adjust if tooltip would go off bottom edge
  if (top + tooltipHeight > window.innerHeight - padding) {
    top = mousePosition.y - tooltipHeight - 10;
  }
  
  // Ensure tooltip doesn't go off left or top edges
  left = Math.max(padding, left);
  top = Math.max(padding, top);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50 bg-black/90 backdrop-blur-sm text-white rounded-lg p-4 shadow-2xl border border-white/20 pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        maxWidth: `${tooltipWidth}px`
      }}
    >
      <div className="font-bold text-lg mb-2">
        {countryData.country}
      </div>
      <div className="space-y-1.5">
        {sortedMoods.map(([mood, percentage]) => (
          <div key={mood} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="text-lg">{mood}</span>
              <span className="text-gray-300">{getMoodLabel(mood)}</span>
            </span>
            <span className="font-semibold">{percentage}%</span>
          </div>
        ))}
      </div>
      {countryData.total && (
        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-gray-400">
          {countryData.total.toLocaleString()} submissions
        </div>
      )}
    </motion.div>
  );
}
