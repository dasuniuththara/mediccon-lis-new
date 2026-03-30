export const playVoiceAlert = (message) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Clear queue

    const utterance = new SpeechSynthesisUtterance(message);

    // Configure Jarvis-style voice parameters
    utterance.rate = 1.05;
    utterance.pitch = 0.85;
    utterance.volume = 0.8;

    // Attempt to find a futuristic/professional English voice
    const voices = window.speechSynthesis.getVoices();
    const techVoice = voices.find(v =>
        (v.name.includes('Google US English') || v.name.includes('Microsoft Zira') || v.name.includes('Microsoft Mark')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang === 'en-US');

    if (techVoice) {
        utterance.voice = techVoice;
    }

    window.speechSynthesis.speak(utterance);
};

// Initialize voices early so they are loaded when needed
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
