/**
 * Audio Recorder Utility
 *
 * Handles microphone capture with Voice Activity Detection (VAD)
 * for automatic speech detection and recording.
 */

export interface AudioRecorderOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;

  // VAD settings
  silenceThreshold?: number;     // Audio level below which is considered silence (0-1)
  silenceDuration?: number;      // Milliseconds of silence before speech is considered ended
  minSpeechDuration?: number;    // Minimum milliseconds of speech to record
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  private isRecording = false;
  private isSpeaking = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private levelCheckInterval: NodeJS.Timeout | null = null;
  private speechStartTime: number | null = null;

  private readonly options: Required<AudioRecorderOptions>;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      onSpeechStart: options.onSpeechStart || (() => {}),
      onSpeechEnd: options.onSpeechEnd || (() => {}),
      onAudioLevel: options.onAudioLevel || (() => {}),
      onError: options.onError || (() => {}),
      silenceThreshold: options.silenceThreshold ?? 0.02,
      silenceDuration: options.silenceDuration ?? 1500,  // 1.5 seconds of silence
      minSpeechDuration: options.minSpeechDuration ?? 500,  // 500ms minimum speech
    };
  }

  /**
   * Check if browser supports audio recording
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof window.MediaRecorder !== "undefined"
    );
  }

  /**
   * Start listening to the microphone
   */
  async start(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    if (!AudioRecorder.isSupported()) {
      this.options.onError(new Error("Audio recording not supported in this browser"));
      return;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analysis for VAD
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Set up MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.isRecording = true;

      // Start level monitoring for VAD
      this.startLevelMonitoring();

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.options.onError(new Error("Microphone permission denied"));
      } else if (err.name === "NotFoundError") {
        this.options.onError(new Error("No microphone found"));
      } else {
        this.options.onError(err);
      }
    }
  }

  /**
   * Stop listening and clean up
   */
  stop(): void {
    this.isRecording = false;
    this.isSpeaking = false;

    // Clear timers
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.levelCheckInterval) {
      clearInterval(this.levelCheckInterval);
      this.levelCheckInterval = null;
    }

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Get the current recording state
   */
  getState(): { isRecording: boolean; isSpeaking: boolean } {
    return {
      isRecording: this.isRecording,
      isSpeaking: this.isSpeaking,
    };
  }

  /**
   * Start monitoring audio levels for VAD
   */
  private startLevelMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.levelCheckInterval = setInterval(() => {
      if (!this.analyser || !this.isRecording) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average level (0-1 range)
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length / 255;

      this.options.onAudioLevel(average);

      // Voice Activity Detection
      if (average > this.options.silenceThreshold) {
        this.handleSpeechDetected();
      } else {
        this.handleSilenceDetected();
      }
    }, 50); // Check every 50ms
  }

  /**
   * Handle speech detected
   */
  private handleSpeechDetected(): void {
    // Clear any pending silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Start recording if not already
    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this.speechStartTime = Date.now();
      this.audioChunks = [];

      if (this.mediaRecorder && this.mediaRecorder.state === "inactive") {
        this.mediaRecorder.start(100); // Collect data every 100ms
      }

      this.options.onSpeechStart();
    }
  }

  /**
   * Handle silence detected
   */
  private handleSilenceDetected(): void {
    if (!this.isSpeaking) return;

    // Start or reset silence timer
    if (!this.silenceTimer) {
      this.silenceTimer = setTimeout(() => {
        // End speech if minimum duration met
        const duration = this.speechStartTime
          ? Date.now() - this.speechStartTime
          : 0;

        if (duration >= this.options.minSpeechDuration) {
          this.endSpeech();
        } else {
          // Speech was too short, discard
          this.isSpeaking = false;
          this.audioChunks = [];
          if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
          }
        }

        this.silenceTimer = null;
      }, this.options.silenceDuration);
    }
  }

  /**
   * End speech and process recording
   */
  private endSpeech(): void {
    this.isSpeaking = false;

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Handle recording stop
   */
  private handleRecordingStop(): void {
    if (this.audioChunks.length > 0) {
      const mimeType = this.getSupportedMimeType();
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      // Only send if blob has data
      if (audioBlob.size > 0) {
        this.options.onSpeechEnd(audioBlob);
      }
    }

    this.audioChunks = [];
    this.speechStartTime = null;
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/wav",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback
    return "audio/webm";
  }
}
