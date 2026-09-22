/**
 * Media Coordinator
 * Prevents background audio leaks by stopping all HTML media elements (video & audio)
 * when navigating away, opening the camera, viewing profiles, or launching modals.
 */

export const pauseAllMedia = (excludeElement?: HTMLMediaElement | null) => {
  try {
    // 1. Immediately pause and mute all video elements in the DOM
    const videos = document.querySelectorAll('video');
    videos.forEach((vid) => {
      if (excludeElement && vid === excludeElement) return;
      try {
        vid.pause();
      } catch (e) {
        console.warn('Failed to pause video element:', e);
      }
    });

    // 2. Immediately pause all standalone audio elements in the DOM
    const audios = document.querySelectorAll('audio');
    audios.forEach((aud) => {
      if (excludeElement && aud === excludeElement) return;
      try {
        aud.pause();
      } catch (e) {
        console.warn('Failed to pause audio element:', e);
      }
    });
  } catch (err) {
    console.warn('Error in pauseAllMedia:', err);
  }

  // 3. Dispatch global app event so active React video players sync their state
  try {
    window.dispatchEvent(new CustomEvent('app:pause-all-media'));
  } catch {}
};
