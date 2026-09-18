export interface BhojpuriTrack {
  id: string;
  title: string;
  artist: string;
  category: 'Pawan Singh' | 'Khesari Lal' | 'Shilpi Raj' | 'Folk & Dholak' | 'Trending';
  duration: string;
  tags: string[];
  notes: number[]; // Frequencies for instant synthetic Web Audio preview
  tempo: number;
}

export const BHOJPURI_MUSIC_LIBRARY: BhojpuriTrack[] = [
  // Pawan Singh Superhits
  {
    id: 'ps-1',
    title: 'Lollypop Lagelu',
    artist: 'Pawan Singh (Evergreen Bhojpuri Superhit)',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['pawansingh', 'lollypop', 'superhit', 'dance'],
    notes: [392, 440, 523, 587, 523, 440, 392, 330, 392, 440, 523, 659, 587],
    tempo: 128,
  },
  {
    id: 'ps-2',
    title: 'Pudina Ae Hasina',
    artist: 'Pawan Singh & Anupama Yadav',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['pudina', 'pawansingh', 'comedy', 'trending'],
    notes: [330, 330, 392, 440, 440, 392, 330, 293, 330, 392, 440, 523],
    tempo: 132,
  },
  {
    id: 'ps-3',
    title: 'Kamariya Bole Lollypop Lagelu (Remix)',
    artist: 'Pawan Singh • DJ Bass Mix',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['pawansingh', 'remix', 'djbeat', 'dance'],
    notes: [523, 587, 659, 587, 523, 440, 392, 440, 523, 659, 784],
    tempo: 136,
  },
  {
    id: 'ps-4',
    title: 'Raja Ji',
    artist: 'Pawan Singh & Shivani Singh',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['rajaji', 'pawansingh', 'romance', 'bhojpuri'],
    notes: [440, 493, 523, 587, 523, 493, 440, 392, 440, 523],
    tempo: 120,
  },
  {
    id: 'ps-5',
    title: 'Hamar Jaan Hau Ho',
    artist: 'Pawan Singh Romantic Melody',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['pawansingh', 'love', 'melody', 'purabiya'],
    notes: [330, 392, 440, 493, 523, 493, 440, 392, 330, 293, 330],
    tempo: 110,
  },
  {
    id: 'ps-6',
    title: 'Dhibari Me Rahue Na Tel',
    artist: 'Pawan Singh & Shilpi Raj',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['dhibari', 'pawansingh', 'shilpiraj', 'viral', 'bhojpuridance'],
    notes: [440, 440, 523, 587, 659, 587, 523, 440, 392, 440],
    tempo: 134,
  },
  {
    id: 'ps-7',
    title: 'Le Le Aayi Coca Cola',
    artist: 'Pawan Singh & Shilpi Raj',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['cocacola', 'pawansingh', 'shilpiraj', 'superhit', 'trending'],
    notes: [523, 587, 659, 784, 659, 587, 523, 440, 493, 523],
    tempo: 136,
  },
  {
    id: 'ps-8',
    title: 'Chhalakata Hamro Jawaniya',
    artist: 'Pawan Singh & Priyanka Singh',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['chhalakata', 'pawansingh', 'priyankasingh', 'evergreen', 'dance'],
    notes: [392, 440, 523, 587, 659, 587, 523, 440, 392, 440],
    tempo: 130,
  },
  {
    id: 'ps-9',
    title: 'Hari Hari Odhani',
    artist: 'Pawan Singh & Anupama Yadav',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['odhani', 'pawansingh', 'anupama', 'reels', 'dance'],
    notes: [440, 493, 523, 587, 523, 493, 440, 392, 330, 392, 440],
    tempo: 132,
  },
  {
    id: 'ps-10',
    title: 'Zindagi 2 Mulakat',
    artist: 'Pawan Singh (Soulful Ghazal)',
    category: 'Pawan Singh',
    duration: '0:30',
    tags: ['zindagi', 'pawansingh', 'sad', 'melody', 'soulful'],
    notes: [330, 370, 392, 440, 493, 440, 392, 370, 330],
    tempo: 98,
  },

  // Khesari Lal Yadav Superhits
  {
    id: 'kl-1',
    title: 'Nathuniya',
    artist: 'Khesari Lal Yadav & Priyanka Singh',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'nathuniya', 'stagehit', 'dholak'],
    notes: [440, 523, 587, 659, 587, 523, 440, 392, 440, 523, 587],
    tempo: 130,
  },
  {
    id: 'kl-2',
    title: 'Pagal Banaibe Ka Re Patarki',
    artist: 'Khesari Lal Yadav Superhit',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['patarki', 'khesarilal', 'viral', 'bhojpuribeats'],
    notes: [523, 523, 587, 659, 659, 587, 523, 440, 392, 440, 523],
    tempo: 134,
  },
  {
    id: 'kl-3',
    title: 'Saiya Ke Roti',
    artist: 'Khesari Lal Yadav & Shilpi Raj',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesari', 'shilpiraj', 'comedy', 'dance'],
    notes: [392, 440, 523, 523, 440, 392, 330, 392, 440, 523],
    tempo: 126,
  },
  {
    id: 'kl-4',
    title: 'Dhamaka Hoi Aara Mein',
    artist: 'Khesari Lal Yadav • Arah Beats',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['arah', 'khesarilal', 'dhamaka', 'dj'],
    notes: [440, 440, 523, 587, 659, 587, 523, 440, 392, 440],
    tempo: 138,
  },
  {
    id: 'kl-5',
    title: 'Bhatar Majhi',
    artist: 'Khesari Lal Yadav Live Stage',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'desidance', 'stage'],
    notes: [330, 392, 440, 523, 440, 392, 330, 293, 330, 392],
    tempo: 128,
  },
  {
    id: 'kl-6',
    title: 'Choliya Ke Huk Raja Ji',
    artist: 'Khesari Lal Yadav • Cult Bhojpuri Dance',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'choliya', 'dance', 'superhit'],
    notes: [440, 523, 587, 659, 587, 523, 440, 392, 440, 523],
    tempo: 136,
  },
  {
    id: 'kl-7',
    title: 'Marad Abhi Bachha Ba',
    artist: 'Khesari Lal Yadav & Amrapali Dubey',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'amrapali', 'comedy', 'dance'],
    notes: [392, 440, 523, 587, 523, 440, 392, 330, 392, 440, 523],
    tempo: 130,
  },
  {
    id: 'kl-8',
    title: 'Bas Kar Pagli',
    artist: 'Khesari Lal Yadav & Shilpi Raj',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'shilpiraj', 'baskarpagli', 'viral', 'reels'],
    notes: [523, 587, 659, 659, 587, 523, 440, 392, 440, 523],
    tempo: 132,
  },
  {
    id: 'kl-9',
    title: 'Kajarwa',
    artist: 'Khesari Lal Yadav • DJ Bhojpuri Dance',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['kajarwa', 'khesarilal', 'djmix', 'dholak'],
    notes: [440, 493, 523, 587, 659, 587, 523, 440, 392, 440],
    tempo: 134,
  },
  {
    id: 'kl-10',
    title: 'Sutela Balamua Godi Me',
    artist: 'Khesari Lal Yadav Stage Hit',
    category: 'Khesari Lal',
    duration: '0:30',
    tags: ['khesarilal', 'balamua', 'desi', 'stage'],
    notes: [330, 392, 440, 493, 523, 440, 392, 330, 392, 440],
    tempo: 126,
  },

  // Shilpi Raj Superhits
  {
    id: 'sr-1',
    title: 'Raja Ji Ke Dilwa',
    artist: 'Shilpi Raj Superhit Melody',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['shilpiraj', 'rajaji', 'viralreel', 'melodious'],
    notes: [523, 587, 659, 698, 659, 587, 523, 440, 493, 523],
    tempo: 122,
  },
  {
    id: 'sr-2',
    title: 'Kamar Kamra Ba',
    artist: 'Shilpi Raj & Samar Singh',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['shilpiraj', 'samarsingh', 'dholak', 'dance'],
    notes: [440, 493, 523, 587, 523, 493, 440, 392, 440, 523, 587],
    tempo: 130,
  },
  {
    id: 'sr-3',
    title: 'Relia Re',
    artist: 'Shilpi Raj Soulful Folk',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['reliare', 'shilpiraj', 'purabiya', 'folk'],
    notes: [392, 440, 523, 587, 523, 440, 392, 330, 392, 440],
    tempo: 116,
  },
  {
    id: 'sr-4',
    title: 'Jharelia',
    artist: 'Shilpi Raj & Ankush Raja',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['jharelia', 'ankushraja', 'shilpiraj', 'superhit'],
    notes: [440, 523, 587, 659, 587, 523, 440, 493, 523],
    tempo: 128,
  },
  {
    id: 'sr-5',
    title: 'Godi Me Leke',
    artist: 'Shilpi Raj & Pramod Premi Yadav',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['shilpiraj', 'pramodpremi', 'bhojpuribeat'],
    notes: [523, 523, 587, 659, 587, 523, 440, 392, 440, 523],
    tempo: 132,
  },
  {
    id: 'sr-6',
    title: 'Kala Sari Rajaji',
    artist: 'Shilpi Raj (DJ Remix Superhit)',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['kalasari', 'shilpiraj', 'remix', 'dance', 'reels'],
    notes: [440, 523, 587, 659, 784, 659, 587, 523, 440, 493],
    tempo: 135,
  },
  {
    id: 'sr-7',
    title: 'Balamua Ke Gaon Mein',
    artist: 'Shilpi Raj & Samar Singh',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['balamua', 'shilpiraj', 'samarsingh', 'folk', 'purabiya'],
    notes: [392, 440, 523, 523, 440, 392, 330, 293, 330, 392],
    tempo: 120,
  },
  {
    id: 'sr-8',
    title: 'Diyawa Baar Ke',
    artist: 'Shilpi Raj (Viral Reels Audio)',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['diyawabaarke', 'shilpiraj', 'viral', 'trending'],
    notes: [523, 587, 659, 587, 523, 440, 392, 440, 523],
    tempo: 128,
  },
  {
    id: 'sr-9',
    title: 'Nehiya Ke Phulwa',
    artist: 'Shilpi Raj Emotional Geet',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['nehiya', 'shilpiraj', 'geet', 'purabiya'],
    notes: [330, 392, 440, 493, 523, 493, 440, 392, 330],
    tempo: 104,
  },
  {
    id: 'sr-10',
    title: 'Bhatar Ohi Me Katlas Daat',
    artist: 'Shilpi Raj & Pramod Premi',
    category: 'Shilpi Raj',
    duration: '0:30',
    tags: ['shilpiraj', 'pramodpremi', 'comedy', 'dance'],
    notes: [440, 440, 523, 587, 659, 587, 523, 440, 392],
    tempo: 132,
  },

  // Folk & Dholak Beats
  {
    id: 'fk-1',
    title: 'Ara Jila Ghar Ba',
    artist: 'Bhojpuri Bass Dholak Mix',
    category: 'Folk & Dholak',
    duration: '0:30',
    tags: ['arah', 'dholak', 'bhojpuribass', 'desi'],
    notes: [330, 392, 440, 523, 587, 523, 440, 392, 330, 261, 330],
    tempo: 136,
  },
  {
    id: 'fk-2',
    title: 'Chait Ke Mahina',
    artist: 'Bhojpuri Traditional Chaiti & Kajari',
    category: 'Folk & Dholak',
    duration: '0:30',
    tags: ['chaiti', 'kajari', 'folktradition', 'purvanchal'],
    notes: [392, 440, 493, 523, 587, 659, 587, 523, 493, 440, 392],
    tempo: 112,
  },
  {
    id: 'fk-3',
    title: 'Kashi Vishwanath Aarti & Flute',
    artist: 'Banaras Ganga Ghat Flute & Shankh',
    category: 'Folk & Dholak',
    duration: '0:30',
    tags: ['kashi', 'banaras', 'flute', 'spiritual', 'gangaghat'],
    notes: [330, 392, 440, 523, 659, 587, 523, 440, 392, 330],
    tempo: 96,
  },
  {
    id: 'fk-4',
    title: 'Litti Chokha Purabiya Vibe',
    artist: 'Desi Shehnai & Dholak Rhythm',
    category: 'Folk & Dholak',
    duration: '0:30',
    tags: ['shehnai', 'dholak', 'purabiya', 'bihar'],
    notes: [440, 523, 587, 659, 784, 659, 587, 523, 440, 392],
    tempo: 124,
  },

  // Trending & Modern Hits
  {
    id: 'tr-1',
    title: 'Kesariya • Acoustic Soul',
    artist: 'Pritam & Arijit Singh',
    category: 'Trending',
    duration: '0:30',
    tags: ['kesariya', 'acoustic', 'bollywood', 'love'],
    notes: [392, 440, 493, 523, 587, 493, 440, 392, 440, 523],
    tempo: 108,
  },
  {
    id: 'tr-2',
    title: 'Chaleya Beats',
    artist: 'Anirudh Ravichander',
    category: 'Trending',
    duration: '0:30',
    tags: ['chaleya', 'dancebeat', 'energy'],
    notes: [523, 587, 659, 784, 659, 587, 523, 440, 523],
    tempo: 128,
  },
  {
    id: 'tr-3',
    title: 'Brown Munde',
    artist: 'AP Dhillon & Gurinder Gill',
    category: 'Trending',
    duration: '0:30',
    tags: ['brownmunde', 'punjabi', 'hiphop'],
    notes: [330, 330, 392, 440, 392, 330, 293, 330, 440],
    tempo: 120,
  },
];

/**
 * Play a track preview synthetically using Web Audio API so it plays instantly and safely
 * on any device without network failure or CORS blocking.
 */
export function playSyntheticTrackPreview(
  track: BhojpuriTrack,
  onEnded?: () => void
): { stop: () => void } {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return { stop: () => {} };
    }

    const ctx = new AudioContextClass();
    const notes = track.notes || [440, 523, 659];
    const bpm = track.tempo || 124;
    const noteDuration = (60 / bpm) * 0.45;
    const now = ctx.currentTime + 0.05;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.connect(ctx.destination);

    const activeOscs: OscillatorNode[] = [];

    // Loop notes twice for a pleasant 10-15s preview
    const fullSequence = [...notes, ...notes];

    fullSequence.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

      // Envelope: smooth attack and decay
      const startTime = now + idx * noteDuration;
      const endTime = startTime + noteDuration;

      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.8, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(endTime);
      activeOscs.push(osc);
    });

    const totalDuration = fullSequence.length * noteDuration + 0.1;
    const timer = setTimeout(() => {
      try {
        ctx.close().catch(() => {});
      } catch {}
      if (onEnded) onEnded();
    }, totalDuration * 1000);

    return {
      stop: () => {
        clearTimeout(timer);
        try {
          activeOscs.forEach((o) => {
            try {
              o.stop();
            } catch {}
          });
          ctx.close().catch(() => {});
        } catch {}
        if (onEnded) onEnded();
      },
    };
  } catch (e) {
    console.warn('Audio preview fallback:', e);
    return { stop: () => {} };
  }
}

export const BHOJPURI_AUDIO_CATEGORIES = [
  'All',
  'Pawan Singh',
  'Khesari Lal',
  'Shilpi Raj',
  'Folk & Dholak',
  'Trending',
] as const;

export type BhojpuriAudioCategory = (typeof BHOJPURI_AUDIO_CATEGORIES)[number];

/**
 * High-performance instant search across title, artist, category, and tags
 */
export function searchBhojpuriTracks(
  query: string,
  category: BhojpuriAudioCategory | string = 'All'
): BhojpuriTrack[] {
  const normalizedQuery = query.trim().toLowerCase().replace(/^#/, '');

  return BHOJPURI_MUSIC_LIBRARY.filter((track) => {
    const matchesCategory =
      !category || category === 'All' || track.category.toLowerCase() === category.toLowerCase();

    if (!matchesCategory) return false;

    if (!normalizedQuery) return true;

    return (
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.toLowerCase().includes(normalizedQuery) ||
      track.category.toLowerCase().includes(normalizedQuery) ||
      track.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  });
}
