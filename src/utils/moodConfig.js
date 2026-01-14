export const MOODS = [
  { emoji: "😊", label: "Happy", color: "#22c55e" },
  { emoji: "😐", label: "Neutral", color: "#eab308" },
  { emoji: "😞", label: "Sad", color: "#3b82f6" },
  { emoji: "😡", label: "Angry", color: "#ef4444" },
  { emoji: "😴", label: "Tired", color: "#8b5cf6" },
  { emoji: "🤯", label: "Overwhelmed", color: "#ec4899" }
];

export function getMoodLabel(emoji) {
  const mood = MOODS.find(m => m.emoji === emoji);
  return mood ? mood.label : "Unknown";
}

export function getMoodColor(emoji) {
  const mood = MOODS.find(m => m.emoji === emoji);
  return mood ? mood.color : "#666";
}
