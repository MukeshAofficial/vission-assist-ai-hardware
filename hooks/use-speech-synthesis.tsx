// hooks/use-speech-synthesis.tsx
"use client"

import { useState, useCallback, useEffect } from "react"

interface SpeechSynthesisHook {
  speak: (text: string, lang?: string) => void
  stop: () => void
  isSpeaking: boolean
  isPaused: boolean
  pause: () => void
  resume: () => void
  stopSpeaking: () => void
  getAvailableVoices: (langFilter?: string) => SpeechSynthesisVoice[] // Added for debugging
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices and handle changes
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        console.log("Available TTS Voices:", availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default })));
      }
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Initial load
      loadVoices();

      // Subscribe to voices changed event
      window.speechSynthesis.onvoiceschanged = loadVoices;

      // Cleanup
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      };
    }
    return () => {}; // Return empty cleanup if no window.speechSynthesis
  }, []);

  const getAvailableVoices = useCallback((langFilter?: string): SpeechSynthesisVoice[] => {
    if (!langFilter) return voices;
    return voices.filter(voice => voice.lang.toLowerCase().startsWith(langFilter.toLowerCase()));
  }, [voices]);

  const speak = useCallback((text: string, lang: string = "en-US") => {
    if (typeof window !== "undefined" && window.speechSynthesis && voices) {
      window.speechSynthesis.cancel(); 

      const newUtterance = new SpeechSynthesisUtterance(text);
      newUtterance.lang = lang; 

      let selectedVoice = null;
      console.log(`Attempting to speak in lang: ${lang}. Available voices:`, voices.length);

      if (voices.length > 0) {
        if (lang.toLowerCase().startsWith("ta")) { // Tamil
          selectedVoice = voices.find(voice => voice.lang.toLowerCase().startsWith("ta") && voice.default) || // Prefer default Tamil voice
                          voices.find(voice => voice.lang.toLowerCase().startsWith("ta")) ||
                          voices.find(voice => voice.name.toLowerCase().includes("tamil"));
          if (selectedVoice) console.log("Selected Tamil Voice:", {name: selectedVoice.name, lang: selectedVoice.lang});
          else console.warn("No specific Tamil voice found. Will try browser default for 'ta'.");
        } else if (lang.toLowerCase().startsWith("en")) { // English
           selectedVoice = voices.find(voice => voice.lang.toLowerCase().startsWith("en") && voice.default) || // Prefer default English
                           voices.find(voice => voice.lang.toLowerCase().startsWith("en"));
           if (selectedVoice) console.log("Selected English Voice:", {name: selectedVoice.name, lang: selectedVoice.lang});
           else console.warn("No specific English voice found. Will try browser default for 'en'.");
        } else { // Other languages
            selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()) && v.default) ||
                            voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
            if (selectedVoice) console.log(`Selected Voice for ${lang}:`, {name: selectedVoice.name, lang: selectedVoice.lang});
            else console.warn(`No specific voice found for ${lang}. Will try browser default for this language.`);
        }

        if (selectedVoice) {
          newUtterance.voice = selectedVoice;
        } else {
          console.warn(`Could not find a matching voice for lang "${lang}". The browser will attempt to use a default voice if available for this language, or its overall default voice.`);
        }
      } else {
        console.warn("No voices loaded from browser yet. Speech will use browser default settings.");
      }

      newUtterance.rate = 1.0;
      newUtterance.pitch = 1.0;
      newUtterance.volume = 1.0;

      newUtterance.onstart = () => setIsSpeaking(true);
      newUtterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      newUtterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance.onerror:", event.error, newUtterance);
        setIsSpeaking(false);
        setIsPaused(false);
        // You could add a toast notification here for the user
        // toast({ title: "Speech Error", description: `Could not play audio for language: ${lang}. Error: ${event.error}`, variant: "destructive" });
      };
      
      window.speechSynthesis.speak(newUtterance);
    } else {
      console.warn("Speech synthesis not available or voices not loaded.");
    }
  }, [voices]); // Depends on loaded voices

  const stop = useCallback(() => { /* ... unchanged ... */ }, []);
  const pause = useCallback(() => { /* ... unchanged ... */ }, [isSpeaking]);
  const resume = useCallback(() => { /* ... unchanged ... */ }, [isPaused]);
  const stopSpeaking = stop;

  return {
    speak,
    stop,
    isSpeaking,
    isPaused,
    pause,
    resume,
    stopSpeaking,
    getAvailableVoices,
  };
}