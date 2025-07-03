"use client"

import { useState, useEffect, useRef, useCallback } from "react" // Added useCallback
import { motion } from "framer-motion"
import { Camera, Mic, MicOff, ArrowLeft, Volume2, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { useAccessibility } from "@/components/accessibility-provider"
import { useRouter } from "next/navigation"
import EmergencyButton from "@/components/emergency-button"
import Logo from "@/components/logo"
import GlowEffect from "@/components/glow-effect"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock responses
const MOCK_RESPONSES_EN = [
  "I can see what appears to be an indoor space. There are no obvious obstacles in the immediate vicinity.",
  "This looks like an outdoor area. The path ahead seems clear, but proceed with caution.",
  "I can see what might be furniture or objects in the frame. Please be careful when moving forward.",
];
const MOCK_RESPONSES_TA = [
  "இது ஒரு உட்புற இடம் போல் தெரிகிறது. உடனடி அருகே தெளிவான தடைகள் எதுவும் இல்லை.",
  "இது ஒரு வெளிப்புறப் பகுதி போல் தெரிகிறது. பாதை தெளிவாக உள்ளது, ஆனால் எச்சரிக்கையுடன் தொடரவும்.",
  "சட்டகத்தில் தளபாடங்கள் அல்லது பொருள்கள் இருக்கலாம். முன்னோக்கி நகரும்போது கவனமாக இருங்கள்.",
];

export default function ScanPage() {
  const [showHardwareInput, setShowHardwareInput] = useState(false);
  const [hardwareUrl, setHardwareUrl] = useState<string>("");
  const [hardwareUrlInput, setHardwareUrlInput] = useState<string>("");
  const [hardwareActive, setHardwareActive] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [userQuestion, setUserQuestion] = useState<string>("");
  const { fontSize, highContrast, voiceFeedback } = useAccessibility();
  const { transcript, isListening, startListening, stopListening, resetTranscript, currentLang } = useSpeechRecognition();
  const { speak, isSpeaking, stopSpeaking } = useSpeechSynthesis();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");


  const stopLocalCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []); // No external dependencies for this part of logic

  const stopHardwareStream = useCallback(() => {
    setHardwareActive(false);
    setHardwareUrl("");
  }, []);


  const startLocalCamera = useCallback(async () => {
    try {
      if (!videoRef.current) return;
      if (hardwareActive) {
        stopHardwareStream(); // Stop hardware if it's active
         const msg = selectedLanguage === 'ta' ? "ஹார்டுவேர் கேமரா நிறுத்தப்பட்டது. உள்ளூர் கேமராவைத் தொடங்குகிறது." : "Hardware camera stopped. Starting local camera.";
         if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
      const msg = selectedLanguage === 'ta' ? "கேமரா செயல்படுத்தப்பட்டது. படம் எடுக்க 'படம் எடு' என்று கூறவும் அல்லது கேமரா பொத்தானை அழுத்தவும்." : "Camera activated. Say 'take picture' or click the camera button to analyze";
      toast({ title: selectedLanguage === 'ta' ? "கேமரா" : "Camera", description: msg });
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      const errMsg = selectedLanguage === 'ta' ? "கேமராவை அணுக முடியவில்லை. அனுமதிகளைச் சரிபார்க்கவும்." : "Could not access camera. Please check permissions.";
      toast({ title: selectedLanguage === 'ta' ? "கேமரா பிழை" : "Camera Error", description: errMsg, variant: "destructive" });
      if (voiceFeedback) speak(errMsg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
    }
  }, [hardwareActive, stopHardwareStream, selectedLanguage, voiceFeedback, speak, toast]);

  const startHardwareStream = useCallback(() => {
    if (!hardwareUrlInput.trim()) {
      const msg = selectedLanguage === 'ta' ? "URL வழங்கப்படவில்லை. சரியான ஸ்ட்ரீம் URL ஐ உள்ளிடவும்." : "No URL Provided. Please enter a valid stream URL.";
      toast({ title: selectedLanguage === 'ta' ? "பிழை" : "Error", description: msg, variant: "destructive" });
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
      return;
    }
    if (cameraActive) {
      stopLocalCamera(); // Stop local camera if active
      const msg = selectedLanguage === 'ta' ? "உள்ளூர் கேமரா நிறுத்தப்பட்டது. ஹார்டுவேர் கேமராவைத் தொடங்குகிறது." : "Local camera stopped. Starting hardware camera.";
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
    }
    setHardwareUrl(hardwareUrlInput.trim());
    setHardwareActive(true);
    const msg = selectedLanguage === 'ta' ? "ஹார்டுவேர் கேமரா செயல்படுத்தப்பட்டது. வழங்கப்பட்ட URL இலிருந்து ஸ்ட்ரீமிங்." : "Hardware Camera Activated. Streaming from provided URL.";
    toast({ title: selectedLanguage === 'ta' ? "ஹார்டுவேர் கேமரா" : "Hardware Camera", description: msg });
    if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
    setShowHardwareInput(false);
  }, [hardwareUrlInput, cameraActive, stopLocalCamera, selectedLanguage, voiceFeedback, speak, toast]);


  const compressImage = (canvas: HTMLCanvasElement, quality = 0.7): string => {
    return canvas.toDataURL("image/jpeg", quality);
  };
  
  const getMockResponse = useCallback((question?: string): string => {
    const currentMockResponses = selectedLanguage === 'ta' ? MOCK_RESPONSES_TA : MOCK_RESPONSES_EN;
    const randomIndex = Math.floor(Math.random() * currentMockResponses.length);
    let response = currentMockResponses[randomIndex];
    if (question) {
      const questionPrompt = selectedLanguage === 'ta' ? `உங்கள் கேள்வியைப் பற்றி: "${question}", ` : `Regarding your question: "${question}", `;
      response = questionPrompt + response;
    }
    return response;
  }, [selectedLanguage]);

  const processImageAPI = useCallback(async (imageBase64: string, question?: string) => {
    setIsProcessing(true);
    setAnalysisResult(selectedLanguage === 'ta' ? "பகுப்பாய்வு செய்கிறது..." : "Analyzing...");
    const langCode = selectedLanguage === 'ta' ? 'ta-IN' : 'en-US';

    try {
      const base64Data = imageBase64.split(",")[1];
      if (!base64Data) throw new Error("Invalid image data");

      let promptText = selectedLanguage === 'ta' 
        ? "இந்தக் காட்சியை பார்வை சவால் உள்ளவருக்கு விரிவாக விவரிக்கவும். தடைகள், மக்கள் அல்லது முக்கியமான கூறுகள் மீது கவனம் செலுத்துங்கள். பதில் தமிழில் இருக்க வேண்டும்."
        : "Describe this scene in detail for a visually impaired person. Focus on any obstacles, people, or important elements.";
      
      if (question) {
        const userQPrefix = selectedLanguage === 'ta' ? `பயனர் கேள்வி: "${question}". ` : `User question: "${question}". `;
        promptText = `${userQPrefix}${promptText}`;
      }
      
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, prompt: promptText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Failed to analyze image");

      const analysis = data.analysis;
      setAnalysisResult(analysis);
      if (voiceFeedback) speak(analysis, langCode);
      toast({ title: selectedLanguage === 'ta' ? "பகுப்பாய்வு முடிந்தது" : "Analysis complete" });

    } catch (error: any) {
      console.error("Error analyzing image:", error);
      const mockResponse = getMockResponse(question);
      setAnalysisResult(mockResponse);
      if (voiceFeedback) speak(mockResponse, langCode);
      const errTitle = selectedLanguage === 'ta' ? "பிழை" : "Error";
      const errMsg = selectedLanguage === 'ta' ? "பகுப்பாய்வு செய்ய முடியவில்லை. ஆஃப்லைன் பதில் காட்டப்படுகிறது." : "Failed to analyze. Showing offline response.";
      toast({ title: errTitle, description: errMsg, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setUserQuestion("");
    }
  }, [selectedLanguage, voiceFeedback, speak, getMockResponse, toast]);


  const captureHardwareImageAndProcess = useCallback(async (question?: string) => {
    if (!canvasRef.current || !hardwareActive) {
      const msg = selectedLanguage === 'ta' ? "ஹார்டுவேர் கேமரா செயலில் இல்லை. முதலில் ஹார்டுவேர் கேமராவைத் தொடங்கவும்." : "Hardware camera not active. Please start the hardware camera first.";
      toast({ title: selectedLanguage === 'ta' ? "ஹார்டுவேர் கேமரா" : "Hardware Camera", description: msg, variant: "destructive" });
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const imgEl = document.getElementById('hardware-mjpeg-img') as HTMLImageElement | null;

    if (imgEl && imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      context?.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      const compressedImage = compressImage(canvas, 0.7);
      await processImageAPI(compressedImage, question);
    } else {
      const msg = selectedLanguage === 'ta' ? "சட்டத்தை பிடிக்க முடியவில்லை. ஹார்டுவேர் ஸ்ட்ரீம் தயாராக இல்லை அல்லது ஆதரிக்கப்படாத வடிவம்." : "Unable to capture frame. Hardware stream not ready or unsupported format.";
      toast({ title: selectedLanguage === 'ta' ? "பிழை" : "Error", description: msg, variant: "destructive" });
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
    }
  }, [hardwareActive, selectedLanguage, voiceFeedback, speak, processImageAPI, toast]);
  
  const captureLocalImageAndProcess = useCallback(async (question?: string) => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      const msg = selectedLanguage === 'ta' ? "கேமரா செயலில் இல்லை. முதலில் கேமராவைத் தொடங்கவும்." : "Camera not active. Please start the camera first.";
      toast({ title: selectedLanguage === 'ta' ? "கேமரா" : "Camera", description: msg, variant: "destructive" });
      if (voiceFeedback) speak(msg, selectedLanguage === 'ta' ? 'ta-IN' : 'en-US');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const scaleFactor = 0.7;
    canvas.width = video.videoWidth * scaleFactor;
    canvas.height = video.videoHeight * scaleFactor;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const compressedImage = compressImage(canvas, 0.7);
    await processImageAPI(compressedImage, question ? String(question) : undefined);
  }, [cameraActive, selectedLanguage, voiceFeedback, speak, processImageAPI, toast]);


  const processVoiceCommand = useCallback((text: string) => {
    if (!text.trim()) return;
    const command = text.toLowerCase();
    const langCode = selectedLanguage === 'ta' ? 'ta-IN' : 'en-US';

    // Define commands in both languages
    const commands = {
      goBack: { en: "go back", ta: "பின்னால் செல்" },
      goHome: { en: "go home", ta: "முகப்புக்கு செல்" },
      goToGpt: { en: "go to gpt", ta: "உதவியாளருக்குச் செல்" },
      goToAssistant: { en: "go to assistant", ta: "உதவியாளரிடம் செல்" },
      startCamera: { en: "start camera", ta: "கேமராவைத் தொடங்கு" },
      openCamera: { en: "open camera", ta: "கேமராவைத் திற" },
      stopCameraCmd: { en: "stop camera", ta: "கேமராவை நிறுத்து" }, // Renamed to avoid conflict
      closeCamera: { en: "close camera", ta: "கேமராவை மூடு" },
      takePicture: { en: "take picture", ta: "படம் எடு" },
      snapPhoto: { en: "snap photo", ta: "படம் பிடி" },
      analyze: { en: "analyze", ta: "பகுப்பாய்வு செய்" },
      emergency: { en: "emergency", ta: "அவசரம்" },
    };

    const currentCmd = (key: keyof typeof commands) => commands[key][selectedLanguage as 'en' | 'ta'];

    if (command.includes(currentCmd('goBack')) || command.includes(currentCmd('goHome'))) {
      if (voiceFeedback) speak(selectedLanguage === 'ta' ? "முகப்புக்குச் செல்கிறது" : "Going to home", langCode);
      router.push("/");
      return;
    }
    if (command.includes(currentCmd('goToGpt')) || command.includes(currentCmd('goToAssistant'))) {
      if (voiceFeedback) speak(selectedLanguage === 'ta' ? "உதவியாளருக்குச் செல்கிறது" : "Going to assistant", langCode);
      router.push("/gpt");
      return;
    }
    if (command.includes(currentCmd('startCamera')) || command.includes(currentCmd('openCamera'))) {
      if (!cameraActive && !hardwareActive) startLocalCamera();
      return;
    }
    if (command.includes(currentCmd('stopCameraCmd')) || command.includes(currentCmd('closeCamera'))) {
      if (cameraActive) stopLocalCamera();
      else if (hardwareActive) stopHardwareStream();
      return;
    }
    if (command.includes(currentCmd('takePicture')) || command.includes(currentCmd('snapPhoto')) || command.includes(currentCmd('analyze'))) {
      if (hardwareActive) captureHardwareImageAndProcess();
      else if (cameraActive) captureLocalImageAndProcess();
      else if (voiceFeedback) speak(selectedLanguage === 'ta' ? "படம் எடுக்க கேமரா செயலில் இல்லை." : "Camera is not active to take a picture.", langCode);
      return;
    }
    if (command.includes(currentCmd('emergency'))) {
      toast({
        title: selectedLanguage === 'ta' ? "அவசரத் தொடர்பு" : "Emergency Contact",
        description: selectedLanguage === 'ta' ? "உங்கள் அவசரத் தொடர்பைத் தொடர்புகொள்கிறது..." : "Contacting your emergency contact...",
        variant: "destructive",
      });
      // EmergencyButton logic will handle the actual action and its own speech
      return;
    }
    
    // If camera is active and it's not a specific command, assume it's a question about the image
    if (cameraActive || hardwareActive) {
      setUserQuestion(text);
      if (hardwareActive) captureHardwareImageAndProcess(text);
      else captureLocalImageAndProcess(text);
    } else {
        if (voiceFeedback) speak(selectedLanguage === 'ta' ? "மன்னிக்கவும், கட்டளை புரியவில்லை." : "Sorry, I didn't understand that command.", langCode);
    }
  }, [
    router, cameraActive, hardwareActive, selectedLanguage, voiceFeedback, speak, 
    captureHardwareImageAndProcess, captureLocalImageAndProcess, startLocalCamera, stopLocalCamera, stopHardwareStream, setUserQuestion, toast
  ]);

  useEffect(() => {
    if (!isListening && transcript && transcriptReady) {
      processVoiceCommand(transcript);
      setTranscriptReady(false);
      resetTranscript(); // Reset transcript after processing
    }
  }, [isListening, transcript, transcriptReady, processVoiceCommand, resetTranscript]);


  const toggleListening = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
    } else if (!isProcessing) {
      const recognitionLang = selectedLanguage === 'ta' ? 'ta-IN' : 'en-US';
      startListening({ duration: 7000, lang: recognitionLang }); // Increased duration slightly
      setTranscriptReady(true);
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setAnalysisResult(""); // Clear previous analysis
    const langName = value === 'ta' ? "தமிழ்" : "English";
    const feedbackMsg = value === 'ta' ? `மொழி தமிழுக்கு மாற்றப்பட்டது.` : `Language changed to English.`;
    toast({ title: `Language set to ${langName}` });
    if (voiceFeedback) speak(feedbackMsg, value === 'ta' ? 'ta-IN' : 'en-US');
  };

  const handleMainCameraAction = () => {
    if (hardwareActive) {
        captureHardwareImageAndProcess();
    } else if (cameraActive) {
        captureLocalImageAndProcess();
    } else {
        startLocalCamera(); // This will start the local camera
    }
  };

  // Effect to clean up camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraActive) stopLocalCamera();
      if (hardwareActive) stopHardwareStream();
    };
  }, [cameraActive, hardwareActive, stopLocalCamera, stopHardwareStream]);


  return (
    <div className="flex flex-col min-h-screen bg-[#121629]">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (cameraActive) stopLocalCamera();
              if (hardwareActive) stopHardwareStream();
              router.push("/");
            }}
            aria-label="Go back to home"
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/30 mr-4"
          >
            <ArrowLeft size={24} />
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger 
                    className="w-[150px] bg-purple-900/30 border-purple-700/50 text-purple-300 hover:text-purple-100 focus:ring-purple-500"
                    aria-label={selectedLanguage === 'ta' ? 'மொழியைத் தேர்ந்தெடுக்கவும்' : 'Select language'}
                >
                    <Languages className="mr-2 h-4 w-4 inline-block"/>
                    <SelectValue placeholder={selectedLanguage === 'ta' ? 'மொழி' : 'Language'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f38] border-purple-900/50 text-white">
                    <SelectItem value="en" className="focus:bg-purple-700 data-[highlighted]:bg-purple-700">English</SelectItem>
                    <SelectItem value="ta" className="focus:bg-purple-700 data-[highlighted]:bg-purple-700">தமிழ் (Tamil)</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col relative">
        <GlowEffect />
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
          {selectedLanguage === 'ta' ? "காட்சி பகுப்பாய்வி" : "Video Analyzer"}
        </h1>

        <motion.div
          className="w-full max-w-3xl mx-auto aspect-video relative rounded-lg overflow-hidden border-2 border-purple-700/50 mb-6 bg-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {hardwareActive && hardwareUrl ? (
            <img
              id="hardware-mjpeg-img"
              src={hardwareUrl}
              alt="Hardware camera feed"
              crossOrigin="anonymous" // <-- Add this line
              className="w-full h-full object-contain"
              onError={() => toast({ title: "Stream Error", description: "Could not load hardware stream.", variant: "destructive"})}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Keep muted to avoid echo if mic is on
              className="w-full h-full object-cover"
              aria-label="Camera feed"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          {!cameraActive && !hardwareActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p className="text-white text-xl text-center p-4">
                {selectedLanguage === 'ta' 
                  ? "கேமரா செயலில் இல்லை. தொடங்க, கேமரா பொத்தானை அழுத்தவும் அல்லது 'கேமராவைத் தொடங்கு' என்று கூறவும்." 
                  : "Camera inactive. Click the camera button or say 'Start camera'"}
              </p>
            </div>
          )}
           {hardwareActive && (
            <div className="absolute top-2 left-2 bg-purple-900/80 px-3 py-1 rounded text-white text-xs">Hardware Camera Mode</div>
          )}
        </motion.div>

        {showHardwareInput && !hardwareActive && (
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center mb-6">
              <Input
                type="text"
                placeholder={selectedLanguage === 'ta' ? "ஹார்டுவேர் ஸ்ட்ரீம் URL" : "Hardware stream URL"}
                value={hardwareUrlInput}
                onChange={e => setHardwareUrlInput(e.target.value)}
                className="w-full sm:w-64 bg-gray-800 border-purple-700 text-white placeholder-gray-400"
              />
              <Button size="sm" onClick={startHardwareStream} className="bg-blue-600 hover:bg-blue-700 text-white">
                {selectedLanguage === 'ta' ? "தொடங்கு" : "Start"}
              </Button>
            </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={hardwareActive ? "default" : "outline"}
              size="lg"
              className={hardwareActive ? "bg-blue-700 hover:bg-blue-600 text-white" : "border-blue-500 text-blue-300 hover:text-blue-100 hover:bg-blue-900/30"}
              onClick={() => {
                if (hardwareActive) {
                  stopHardwareStream();
                } else {
                  setShowHardwareInput((v) => !v); 
                  if (cameraActive) stopLocalCamera(); 
                }
              }}
            >
              {hardwareActive ? (selectedLanguage === 'ta' ? "ஹார்டுவேரை நிறுத்து" : "Stop Hardware") 
                              : (selectedLanguage === 'ta' ? "ஹார்டுவேர்" : "Hardware")}
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleMainCameraAction}
              size="lg"
              className={`
                ${hardwareActive ? "bg-blue-700 hover:bg-blue-600" : "bg-purple-700 hover:bg-purple-600"} 
                text-white`}
              disabled={isProcessing || (showHardwareInput && !hardwareUrlInput && !hardwareActive)}
            >
              <Camera size={24} className="mr-2" />
              <span>
                {hardwareActive ? (selectedLanguage === 'ta' ? "படம் எடு" : "Take Picture") 
                : cameraActive ? (selectedLanguage === 'ta' ? "படம் எடு" : "Take Picture") 
                : (selectedLanguage === 'ta' ? "கேமரா தொடங்கு" : "Start Camera")}
              </span>
            </Button>
          </motion.div>

          {cameraActive && !hardwareActive && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={stopLocalCamera} variant="outline" size="lg" className="border-purple-500 text-purple-300 hover:text-purple-100 hover:bg-purple-900/30">
                {selectedLanguage === 'ta' ? "கேமரா நிறுத்து" : "Stop Camera"}
              </Button>
            </motion.div>
          )}
        </div>

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl mx-auto p-4 rounded-lg mb-6 bg-[#1a1f38]/80 backdrop-blur-sm border border-purple-900/50"
          >
            <h2
              className="text-xl font-semibold mb-2 text-purple-300"
              style={{ fontSize: `${Number.parseInt(fontSize) * 1.1}px` }}
            >
              {selectedLanguage === 'ta' ? "பகுப்பாய்வு:" : "Analysis Result:"}
            </h2>
            <p className="text-lg text-gray-200" style={{ fontSize: `${Number.parseInt(fontSize)}px` }} lang={selectedLanguage}>
              {analysisResult}
            </p>
            {userQuestion && (
              <div className="mt-4 pt-4 border-t border-purple-900/50">
                <p className="text-sm text-purple-300">{selectedLanguage === 'ta' ? "உங்கள் கேள்வி:" : "Your question:"}</p>
                <p className="text-md text-gray-300 italic">"{userQuestion}"</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="flex flex-col items-center mt-auto">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mb-4">
            <Button
              onClick={toggleListening}
              size="lg"
              className={`rounded-full p-6 ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} 
                ${isListening ? "bg-purple-600" : "bg-purple-700"} 
                hover:bg-purple-600 text-white`}
              disabled={isProcessing}
              aria-label={isListening ? (selectedLanguage === 'ta' ? 'கேட்பதை நிறுத்து' : 'Stop listening') : (selectedLanguage === 'ta' ? 'கேட்கத் தொடங்கு' : 'Start listening')}
            >
              <motion.div
                animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={isListening ? { repeat: Number.POSITIVE_INFINITY, duration: 1.5 } : {}}
              >
                {isListening ? <MicOff size={24} /> : isSpeaking ? <Volume2 size={24}/> : <Mic size={24} />}
              </motion.div>
            </Button>
          </motion.div>
          <motion.p
            className="text-lg md:text-xl mb-4 text-gray-300 text-center"
            style={{ fontSize: `${Number.parseInt(fontSize)}px` }}
            animate={isListening ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={isListening ? { repeat: Number.POSITIVE_INFINITY, duration: 2 } : {}}
          >
            {isProcessing
              ? (selectedLanguage === 'ta' ? "செயலாக்கத்தில்..." : "Processing...")
              : isListening
                ? (selectedLanguage === 'ta' ? "கேட்கிறது..." : "Listening...")
                : isSpeaking
                  ? (selectedLanguage === 'ta' ? "பேசுகிறது..." : "Speaking...")
                  : (cameraActive || hardwareActive)
                    ? (selectedLanguage === 'ta' ? "காட்சியைப் பற்றி கேட்க மைக்கை அழுத்தவும் அல்லது கட்டளையிடவும்." : "Click mic to ask about what you see or give a command.")
                    : (selectedLanguage === 'ta' ? "கட்டளையிட மைக்கை அழுத்தவும் அல்லது கேமராவைத் தொடங்கவும்." : "Click mic to give a command or start the camera.")}
          </motion.p>
          <EmergencyButton fontSize={fontSize} highContrast={highContrast} />
        </div>
      </main>
    </div>
  );
}