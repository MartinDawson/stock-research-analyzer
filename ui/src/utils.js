import { sentenceCase } from "change-case";

export function customSentenceCase(str) {
  const parts = str.split(/([^a-zA-Z0-9]+)/);
  return parts.map((part, index) => {
    if (/[a-zA-Z0-9]/.test(part)) {
      return index === 0 ? sentenceCase(part) : part.toLowerCase();
    }
    return part;
  }).join('');
}

export const formatPercentage = (value) => `${(value * 100).toFixed(2)}%`;
