import React from 'react';
import { CameraModal, CameraModalProps } from './CameraModal';

export interface ReelsCameraProps {
  onCaptureVideo: (
    videoBlob: Blob,
    videoUrl: string,
    thumbnail?: string,
    audioTitle?: string
  ) => void;
  onClose: () => void;
  currentUser?: any;
}

export const ReelsCamera: React.FC<ReelsCameraProps> = (props) => {
  return (
    <CameraModal
      initialMode="REEL"
      onCaptureVideo={props.onCaptureVideo}
      onClose={props.onClose}
      currentUser={props.currentUser}
    />
  );
};

export default ReelsCamera;
