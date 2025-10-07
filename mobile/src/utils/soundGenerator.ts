import { Audio } from 'expo-av';

// Generate musical tones with better envelope and harmonics
export const generateTone = async (frequency: number, duration: number = 200, type: 'sine' | 'square' | 'sawtooth' = 'sine', volume: number = 0.3) => {
  try {
    // Create a more musical tone with better envelope
    const { sound } = await Audio.Sound.createAsync({
      uri: `data:audio/wav;base64,${generateWavBase64(frequency, duration, type, volume)}`
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

// Generate WAV file as base64 with better musical envelope
function generateWavBase64(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth', volume: number = 0.3): string {
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
  
  // Generate audio data with musical envelope
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    // Generate base waveform
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
    
    // Add magical harmonics for ethereal sound
    if (type === 'sine') {
      // Add gentle harmonics for bell-like quality
      sample += 0.2 * Math.sin(2 * Math.PI * frequency * 2 * t); // Octave (softer)
      sample += 0.08 * Math.sin(2 * Math.PI * frequency * 3 * t); // Fifth (softer)
      sample += 0.04 * Math.sin(2 * Math.PI * frequency * 4 * t); // Double octave
      sample += 0.02 * Math.sin(2 * Math.PI * frequency * 5 * t); // Third harmonic
      
      // Add subtle inharmonic content for bell-like shimmer
      sample += 0.01 * Math.sin(2 * Math.PI * frequency * 2.76 * t); // Bell-like inharmonic
      sample += 0.005 * Math.sin(2 * Math.PI * frequency * 5.40 * t); // More shimmer
    }
    
    // Apply crisp bell envelope (ADSR-like) - Tinder-inspired
    const attackTime = 0.01; // 10ms quick attack for crisp bell
    const decayTime = 0.08;  // 80ms quick decay for bell character
    const sustainLevel = 0.6; // Moderate sustain for bell tone
    const releaseTime = 0.15; // 150ms quick release for crispness
    
    let envelope = 1;
    if (t < attackTime) {
      // Quick attack phase - linear for crisp bell
      const progress = t / attackTime;
      envelope = progress; // Linear for crisp attack
    } else if (t < attackTime + decayTime) {
      // Quick decay phase - bell-like character
      const progress = (t - attackTime) / decayTime;
      envelope = 1 - progress * (1 - sustainLevel); // Linear decay
    } else if (t < duration / 1000 - releaseTime) {
      // Sustain phase - clean bell tone
      envelope = sustainLevel;
    } else {
      // Quick release phase - crisp ending
      const releaseStart = duration / 1000 - releaseTime;
      const progress = (t - releaseStart) / releaseTime;
      envelope = sustainLevel * (1 - progress); // Linear release
    }
    
    // Apply envelope and volume
    sample *= envelope * volume;
    
    // Crisp soft clipping for bell-like sound
    sample = Math.tanh(sample * 2) / 2; // Crisp but not harsh
    
    // Add subtle bell-like character
    sample = sample + 0.05 * Math.tanh(sample * 4) / 4;
    
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
  // Tinder-inspired match sound - rising tone with two-syllable bell theme
  match: async () => {
    // Create a crisp, celebratory match sound inspired by Tinder
    // Two-syllable bell sound with rising tone for maximum dopamine hit
    
    // First syllable: Lower bell tone (like "ding")
    await generateTone(523.25, 200, 'sine', 0.4); // C5 - clear bell tone
    setTimeout(() => generateTone(659.25, 200, 'sine', 0.3), 50); // E5 - harmony
    
    // Brief pause between syllables
    setTimeout(async () => {
      // Second syllable: Higher bell tone (like "dong") - rising
      await generateTone(783.99, 250, 'sine', 0.45); // G5 - higher, brighter
      setTimeout(() => generateTone(1046.50, 250, 'sine', 0.35), 60); // C6 - octave
      setTimeout(() => generateTone(1318.51, 250, 'sine', 0.25), 120); // E6 - sparkle
    }, 300);
    
    // Final rising flourish - the dopamine peak
    setTimeout(async () => {
      await generateTone(1567.98, 150, 'sine', 0.3); // G6 - high bell
      setTimeout(() => generateTone(1760.00, 200, 'sine', 0.2), 80); // A6 - peak
    }, 650);
  },
};
