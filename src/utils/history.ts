export interface HistoryItem {
  language: string;
  description: string;
  timestamp: string;
  path: string;
}

export const addToHistory = (item: Omit<HistoryItem, 'timestamp'>) => {
  const history = getHistory();
  const newItem = {
    ...item,
    timestamp: new Date().toISOString()
  };
  const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10 items
  localStorage.setItem('learningPathHistory', JSON.stringify(updatedHistory));
};

export const getHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];
  const history = localStorage.getItem('learningPathHistory');
  return history ? JSON.parse(history) : [];
};

export const clearHistory = () => {
  localStorage.removeItem('learningPathHistory');
}; 