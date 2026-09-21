import React from 'react';

interface DailyLimitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  userId?: string;
  type?: 'photo' | 'reel';
  onOpenDashboard?: () => void;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = () => {
  return null;
};
