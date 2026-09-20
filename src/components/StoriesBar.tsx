import React from 'react';
import { StoryGroup, User } from '../types';

interface StoriesBarProps {
  stories?: StoryGroup[];
  currentUser?: User;
  onOpenStory?: (index: number) => void;
  onAddStory?: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = () => {
  // Completely removed stories component from the UI as requested to force remove fake/dummy stories
  return null;
};

