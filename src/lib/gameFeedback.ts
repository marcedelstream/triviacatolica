import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type SoundCue = 'tap' | 'correct' | 'wrong' | 'celebrate';

const NATIVE_SOURCES: Record<SoundCue, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  celebrate: require('../../assets/sounds/celebrate.wav'),
};

const nativePlayers: Partial<Record<SoundCue, AudioPlayer>> = {};

let webAudioCtx: AudioContext | null = null;

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!webAudioCtx) {
      webAudioCtx = new AudioCtx();
    }
    if (webAudioCtx.state === 'suspended') {
      void webAudioCtx.resume();
    }
    return webAudioCtx;
  } catch {
    return null;
  }
}

function playWebSynth(cue: SoundCue): void {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const scheduleTone = (
    freq: number,
    startOffset: number,
    duration: number,
    gainPeak: number
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startOffset);

    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  if (cue === 'tap') {
    scheduleTone(680, 0, 0.045, 0.08);
  } else if (cue === 'correct') {
    scheduleTone(523.25, 0, 0.16, 0.14);
    scheduleTone(659.25, 0.07, 0.2, 0.16);
    scheduleTone(783.99, 0.14, 0.26, 0.17);
  } else if (cue === 'wrong') {
    scheduleTone(329.63, 0, 0.15, 0.12);
    scheduleTone(261.63, 0.11, 0.22, 0.12);
  } else if (cue === 'celebrate') {
    scheduleTone(523.25, 0, 0.28, 0.13);
    scheduleTone(659.25, 0.085, 0.3, 0.14);
    scheduleTone(783.99, 0.17, 0.34, 0.15);
    scheduleTone(1046.5, 0.26, 0.44, 0.16);
  }
}

async function playNativeSound(cue: SoundCue): Promise<void> {
  try {
    let player = nativePlayers[cue];
    if (!player) {
      player = createAudioPlayer(NATIVE_SOURCES[cue]);
      nativePlayers[cue] = player;
    }
    await player.seekTo(0);
    player.play();
  } catch {
    // Nunca romper el juego por un error de audio
  }
}

async function triggerHaptic(cue: SoundCue): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (cue === 'tap') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (cue === 'correct') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (cue === 'wrong') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (cue === 'celebrate') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    // Silencioso en simuladores sin motor háptico
  }
}

export function playGameCue(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return;

  void triggerHaptic(cue);

  if (Platform.OS === 'web') {
    playWebSynth(cue);
  } else {
    void playNativeSound(cue);
  }
}
