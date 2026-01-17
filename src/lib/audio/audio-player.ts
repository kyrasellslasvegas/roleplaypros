/**
 * Audio Player Utility
 *
 * Handles audio playback with interrupt support
 * for TTS audio responses.
 */

export interface AudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private isPlaying = false;

  private readonly options: Required<AudioPlayerOptions>;

  constructor(options: AudioPlayerOptions = {}) {
    this.options = {
      onStart: options.onStart || (() => {}),
      onEnd: options.onEnd || (() => {}),
      onError: options.onError || (() => {}),
      onTimeUpdate: options.onTimeUpdate || (() => {}),
    };
  }

  /**
   * Play audio from a Blob
   */
  async playBlob(blob: Blob): Promise<void> {
    // Clean up previous playback
    this.stop();

    // Create URL from blob
    this.currentUrl = URL.createObjectURL(blob);
    await this.playUrl(this.currentUrl);
  }

  /**
   * Play audio from a URL
   */
  async playUrl(url: string): Promise<void> {
    // Clean up previous playback
    this.stop();

    return new Promise((resolve, reject) => {
      try {
        this.audio = new Audio(url);
        this.currentUrl = url;

        // Set up event listeners
        this.audio.onplay = () => {
          this.isPlaying = true;
          this.options.onStart();
        };

        this.audio.onended = () => {
          this.isPlaying = false;
          this.options.onEnd();
          this.cleanup();
          resolve();
        };

        this.audio.onerror = (event) => {
          this.isPlaying = false;
          const error = new Error(`Audio playback failed: ${this.audio?.error?.message || "Unknown error"}`);
          this.options.onError(error);
          this.cleanup();
          reject(error);
        };

        this.audio.ontimeupdate = () => {
          if (this.audio) {
            this.options.onTimeUpdate(
              this.audio.currentTime,
              this.audio.duration || 0
            );
          }
        };

        // Start playback
        this.audio.play().catch((error) => {
          this.isPlaying = false;
          const playError = new Error(`Failed to start audio playback: ${error.message}`);
          this.options.onError(playError);
          this.cleanup();
          reject(playError);
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.options.onError(err);
        reject(err);
      }
    });
  }

  /**
   * Play audio from fetch response (streaming)
   */
  async playFromResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    const blob = await response.blob();
    await this.playBlob(blob);
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
    this.cleanup();
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume paused playback
   */
  async resume(): Promise<void> {
    if (this.audio && !this.isPlaying) {
      await this.audio.play();
      this.isPlaying = true;
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current playback state
   */
  getState(): {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  } {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
    };
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.audio) {
      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.ontimeupdate = null;
      this.audio = null;
    }

    // Revoke blob URL if we created one
    if (this.currentUrl && this.currentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.currentUrl);
    }
    this.currentUrl = null;
  }

  /**
   * Destroy the player
   */
  destroy(): void {
    this.stop();
    this.cleanup();
  }
}

/**
 * Utility function to fetch and play TTS audio
 */
export async function fetchAndPlayTTS(
  text: string,
  voice: string = "nova",
  speed: number = 1.0,
  options: AudioPlayerOptions = {}
): Promise<void> {
  const response = await fetch("/api/ai/tts/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "TTS request failed" }));
    throw new Error(error.error || "TTS request failed");
  }

  const player = new AudioPlayer(options);
  await player.playFromResponse(response);
}
