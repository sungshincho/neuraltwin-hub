/**
 * NEURALTWIN Chat UI Kit - SuggestionChips Component
 * 후속 질문 추천 칩
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SuggestionChipsProps } from '../types/chat.types';

export function SuggestionChips({
  suggestions,
  onSelect,
  maxItems = 3,
  variant = 'website',
}: SuggestionChipsProps) {
  const displaySuggestions = suggestions.slice(0, maxItems);

  if (displaySuggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {displaySuggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(suggestion)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            'border hover:scale-105 active:scale-95',
            variant === 'website'
              ? 'bg-transparent border-[#00d4aa]/30 text-[#00d4aa] hover:bg-[#00d4aa]/10 hover:border-[#00d4aa]'
              : 'bg-transparent border-primary/30 text-primary hover:bg-primary/10 hover:border-primary'
          )}
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}

export default SuggestionChips;
