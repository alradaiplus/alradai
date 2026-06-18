import { useState, useCallback, useRef } from 'react';

interface UseCaptureOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceCapture(options: UseCaptureOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const err = 'Speech Recognition API not supported';
      setError(err);
      options.onError?.(err);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.language = options.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let currentTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          currentTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(currentTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      const err = `Speech recognition error: ${event.error}`;
      setError(err);
      options.onError?.(err);
    };

    recognition.onend = () => {
      setIsListening(false);
      options.onTranscript?.(currentTranscript);
    };

    recognition.start();
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
