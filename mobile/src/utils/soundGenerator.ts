import { Audio } from 'expo-av';

// Generate simple tones for different actions
export const generateTone = async (frequency: number, duration: number = 200, type: 'sine' | 'square' | 'sawtooth' = 'sine') => {
  try {
    // Create a simple tone using Web Audio API concepts
    // For now, we'll use a simple approach with expo-av
    const { sound } = await Audio.Sound.createAsync({
      uri: `data:audio/wav;base64,${generateWavBase64(frequency, duration, type)}`
    });
    
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Error generating tone:', error);
  }
};

// Generate WAV file as base64 (simplified version)
function generateWavBase64(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth'): string {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration / 1000);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);
  
  // Generate audio data
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
        break;
    }
    
    // Apply envelope to avoid clicks
    const envelope = Math.min(1, Math.min(t * 1000, (duration - t * 1000) * 2));
    sample *= envelope * 0.3; // Reduce volume
    
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  
  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Predefined sound effects
export const soundEffects = {
  // Match sound - pleasant ascending chime
  match: async () => {
    await generateTone(523.25, 150, 'sine'); // C5
    setTimeout(() => generateTone(659.25, 150, 'sine'), 100); // E5
    setTimeout(() => generateTone(783.99, 200, 'sine'), 200); // G5
  },
  
  // Swipe sound - subtle whoosh
  swipe: async () => {
    await generateTone(200, 100, 'sawtooth');
  },
  
  // Button press sound
  button: async () => {
    await generateTone(800, 50, 'square');
  },
  
  // Success sound
  success: async () => {
    await generateTone(523.25, 100, 'sine'); // C5
    setTimeout(() => generateTone(659.25, 100, 'sine'), 50); // E5
  },
  
  // Error sound
  error: async () => {
    await generateTone(200, 300, 'square');
  },
  
  // Notification sound
  notification: async () => {
    await generateTone(440, 100, 'sine'); // A4
    setTimeout(() => generateTone(440, 100, 'sine'), 200);
  },
};
