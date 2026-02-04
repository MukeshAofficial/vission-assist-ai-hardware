# Vision Assist AI 👁️🎙️

Vision Assist AI is an accessibility-first web application designed to empower visually impaired individuals through advanced navigation, real-time visual analysis, and interactive voice assistance. By leveraging AI and speech technologies, the platform provides a bridge between the physical world and digital perception.

---

## 🌟 Key Features

- **Video Analyzer**: Real-time scene description using Google Gemini 1.5 Flash. Users can use their device camera or connect an external hardware stream URL to get detailed descriptions of their surroundings, obstacles, and people.  

- **Voice Assistant (GPT)**: A voice-to-voice AI assistant powered by Gemini for conversational support, answering questions, and providing information on-the-go.  

- **Smart Navigation**: Hands-free navigation through the application using voice commands (e.g., "Open video analyzer", "Go back home").  

- **Accessibility Suite**:
  - **Voice Feedback**: Text-to-speech for all interactions.
  - **High Contrast Mode**: Optimized for low-vision users.
  - **Dynamic Font Sizing**: Adjustable UI text for better readability.
  - **Haptic Feedback**: Vibration cues for interaction confirmation.
  - **Multilingual Support**: Supports both English and Tamil for visual analysis and voice interactions.
  - **Emergency Contact**: A dedicated emergency button to quickly signal for assistance.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)  
- **AI Engine**: Google Gemini AI (@google/generative-ai)  
- **Styling**: Tailwind CSS & Lucide React icons  
- **Animations**: Framer Motion  
- **UI Components**: Radix UI primitives  
- **Speech Services**: Web Speech API (Recognition and Synthesis)  

---

## 📋 Prerequisites

Before running the project, ensure you have:

- Node.js installed  
- A Google Gemini API Key (obtainable from [Google AI Studio](https://ai.google/studio))

---

## 🚀 Getting Started

1. **Clone the repository**:

```bash
git clone <repository-url>
cd vission-assist-ai-hardware
