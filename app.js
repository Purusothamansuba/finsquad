// app-mobile.js - FinLit Simulator Mobile-Optimized
console.log("FinLit Simulator Mobile starting...");

// Constants
const SLIDE_DURATION = 6000; // Slightly longer for mobile
const SPEECH_RATE = 0.9; // Slower for better comprehension
const SPEECH_PITCH = 1.0;
const DEFAULT_LANGUAGE = 'ta-IN';
const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker failed', err));
  });
}

// Global state
const state = {
  persona: null,
  money: 5000,
  savings: 0,
  currentScenario: null,
  scenarioIndex: 0,
  scenarios: [],
  language: 'ta',
  voicesLoaded: false,
  touchStartX: 0,
  touchEndX: 0
};

// DOM elements (cached)
const elements = {
  personaScreen: document.getElementById('persona-screen'),
  gameScreen: document.getElementById('game-screen'),
  personaTitle: document.getElementById('persona-title'),
  prompt: document.getElementById('prompt'),
  choices: document.getElementById('choices'),
  money: document.getElementById('money'),
  savings: document.getElementById('savings'),
  slidesWrapper: document.getElementById('slides-wrapper'),
  dots: document.getElementById('dots')
};

// Speech synthesis utilities
const speech = {
  voicesLoaded: false,
  currentUtterance: null,
  
  init() {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        this.voicesLoaded = true;
        const voices = speechSynthesis.getVoices();
        console.log("Voices loaded:", voices.filter(v => v.lang.includes('ta')).length + " Tamil voices");
      };
      speechSynthesis.getVoices();
    }
  },
  
  speak(text, lang = DEFAULT_LANGUAGE) {
    if (!('speechSynthesis' in window)) {
      console.warn("SpeechSynthesis not supported");
      return;
    }
    
    // Cancel any ongoing speech
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;
    
    // Try to find Tamil voice
    const voices = speechSynthesis.getVoices();
    let preferredVoice;
    
    if (lang.includes('ta')) {
      preferredVoice = voices.find(v => v.lang.includes('ta') || v.name.includes('Tamil'));
    } else {
      preferredVoice = voices.find(v => v.lang === lang);
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };
    
    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  },
  
  stop() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }
};

// Slideshow controller with touch support
const slideshow = {
  currentSlide: 0,
  autoInterval: null,
  totalSlides: 0,
  isAutoPlaying: true,
  
  build(scenario) {
    elements.slidesWrapper.innerHTML = '';
    elements.dots.innerHTML = '';
    
    const slides = scenario.slides || this.createDemoSlides(scenario);
    this.totalSlides = slides.length;
    
    slides.forEach((slide, i) => {
      // Create slide element
      const slideDiv = document.createElement('div');
      slideDiv.className = 'slide';
      slideDiv.innerHTML = `
        <img src="${slide.img}" alt="${slide.alt || `Story slide ${i+1}`}" loading="lazy">
        <div class="slide-text">${state.language === 'ta' ? slide.text_ta : slide.text_en}</div>
      `;
      elements.slidesWrapper.appendChild(slideDiv);
      
      // Create dot
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.onclick = () => {
        this.stop();
        this.show(i);
        this.isAutoPlaying = false;
      };
      elements.dots.appendChild(dot);
    });
    
    // Add touch event listeners
    this.addTouchListeners();
    
    this.show(0);
    this.startAuto();
    
    // Show choices after slideshow completes
    setTimeout(() => {
      this.stop();
      this.showChoices();
    }, this.totalSlides * SLIDE_DURATION);
  },
  
  createDemoSlides(scenario) {
    return [
      { 
        img: 'https://via.placeholder.com/480x320/0066cc/fff?text=Scene+1',
        text_ta: scenario.prompt_ta || 'கதை தொடங்குகிறது...',
        text_en: scenario.prompt_en || 'Story begins...',
        alt: 'Scene 1'
      },
      { 
        img: 'https://via.placeholder.com/480x320/ff9900/000?text=Scene+2',
        text_ta: 'சூழ்நிலை உருவாகிறது...',
        text_en: 'Situation develops...',
        alt: 'Scene 2'
      },
      { 
        img: 'https://via.placeholder.com/480x320/cc0000/fff?text=Scene+3',
        text_ta: 'முடிவு செய்ய வேண்டிய நேரம்!',
        text_en: 'Time to decide!',
        alt: 'Scene 3'
      }
    ];
  },
  
  addTouchListeners() {
    const container = document.querySelector('.slideshow-container');
    
    container.addEventListener('touchstart', (e) => {
      state.touchStartX = e.changedTouches[0].screenX;
      this.stop(); // Pause auto-play on touch
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
      state.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  },
  
  handleSwipe() {
    const diff = state.touchStartX - state.touchEndX;
    
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swipe left - next slide
        this.change(1);
      } else {
        // Swipe right - previous slide
        this.change(-1);
      }
      this.isAutoPlaying = false;
    }
  },
  
  show(n) {
    this.currentSlide = n;
    
    // Use transform for better mobile performance
    elements.slidesWrapper.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    
    // Update dots
    const dots = elements.dots.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentSlide);
      dot.setAttribute('aria-selected', i === this.currentSlide);
    });
    
    // Speak current slide text
    const slideText = elements.slidesWrapper.querySelectorAll('.slide-text')[this.currentSlide];
    if (slideText) {
      speech.speak(slideText.textContent);
    }
  },
  
  change(n) {
    let newSlide = this.currentSlide + n;
    if (newSlide >= this.totalSlides) newSlide = 0;
    if (newSlide < 0) newSlide = this.totalSlides - 1;
    this.show(newSlide);
  },
  
  startAuto() {
    if (!this.isAutoPlaying) return;
    this.stop();
    this.autoInterval = setInterval(() => {
      if (this.isAutoPlaying) {
        this.change(1);
      }
    }, SLIDE_DURATION);
  },
  
  stop() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
  },
  
  showChoices() {
    elements.choices.classList.remove('hidden');
    const promptText = state.language === 'ta' 
      ? state.currentScenario.prompt_ta 
      : state.currentScenario.prompt_en;
    elements.prompt.textContent = promptText;
    speech.speak(promptText);
    
    this.renderChoices();
  },
  
  renderChoices() {
    elements.choices.innerHTML = '';
    
    state.currentScenario.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = state.language === 'ta' ? choice.text_ta : choice.text_en;
      btn.setAttribute('aria-label', `Choice ${index + 1}`);
      
      // Add haptic feedback on supported devices
      btn.addEventListener('click', () => {
        if (navigator.vibrate) {
          navigator.vibrate(50); // Light vibration feedback
        }
        game.handleChoice(choice);
      });
      
      elements.choices.appendChild(btn);
    });
  }
};

// Game logic
const game = {
  async loadScenario(persona) {
    try {
      // Show loading state
      elements.prompt.textContent = state.language === 'ta' 
        ? 'சேமிக்கிறது...' 
        : 'Loading...';
      elements.prompt.innerHTML = '<div class="loading"></div>';
      
      const res = await fetch(`/scenarios/${persona}.json`);
      if (!res.ok) throw new Error('Failed to load scenario');
      
      const data = await res.json();
      state.scenarios = data.scenarios;
      state.scenarioIndex = 0;
      state.currentScenario = state.scenarios[0];
      
      this.startScenario();
    } catch (err) {
      this.showError(state.language === 'ta' 
        ? "கோப்பு ஏற்ற முடியவில்லை" 
        : "Scenario load failed");
      console.error(err);
    }
  },
  
  startScenario() {
    if (!state.currentScenario) return;
    
    // Hide choices initially
    elements.choices.classList.add('hidden');
    
    // Reset slideshow auto-play
    slideshow.isAutoPlaying = true;
    
    // Build and show slideshow
    slideshow.build(state.currentScenario);
    
    // Initial prompt
    const introText = state.language === 'ta' 
      ? "கதையை பாருங்கள்... பின்னர் தேர்வு செய்யுங்கள்."
      : "Watch the story... then make your choice.";
    elements.prompt.textContent = introText;
    speech.speak(introText);
  },
  
  handleChoice(choice) {
    // Stop any ongoing speech
    speech.stop();
    
    // Haptic feedback for choice confirmation
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
    
    // Apply effects
    if (choice.effect) {
      if (choice.effect.savings !== undefined) {
        state.savings += choice.effect.savings;
      }
      if (choice.effect.money !== undefined) {
        state.money += choice.effect.money;
      }
    }
    
    // Update UI with animation
    this.updateStatus(true);
    
    // Show feedback
    const feedback = state.language === 'ta' ? choice.feedback_ta : choice.feedback_en;
    elements.prompt.textContent = feedback;
    speech.speak(feedback);
    
    // Clear choices temporarily
    elements.choices.innerHTML = '';
    
    // Move to next scenario after delay
    setTimeout(() => {
      this.nextScenario();
    }, 5000); // Longer delay on mobile for reading
  },
  
  nextScenario() {
    state.scenarioIndex++;
    
    if (state.scenarioIndex < state.scenarios.length) {
      state.currentScenario = state.scenarios[state.scenarioIndex];
      this.startScenario();
    } else {
      this.showCompletion();
    }
  },
  
  showCompletion() {
    // Celebratory haptic pattern
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    const completionText = state.language === 'ta'
      ? `🎉 வாழ்த்துக்கள்! நீங்கள் முடித்துவிட்டீர்கள்.\n\nஇறுதி பணம்: ₹${state.money}\nசேமிப்பு: ₹${state.savings}`
      : `🎉 Congratulations! You completed the scenarios.\n\nFinal money: ₹${state.money}\nSavings: ₹${state.savings}`;
    
    elements.prompt.textContent = completionText;
    elements.prompt.style.fontSize = '1.2rem';
    elements.prompt.style.textAlign = 'center';
    speech.speak(completionText);
    
    elements.choices.classList.remove('hidden');
    elements.choices.innerHTML = `
      <button class="choice-btn" onclick="location.reload()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; text-align: center;">
        🔄 புதிதாக ஆரம்பிக்க / Start Over
      </button>
    `;
  },
  
  updateStatus(animate = false) {
    if (animate) {
      elements.money.style.transform = 'scale(1.3)';
      elements.savings.style.transform = 'scale(1.3)';
      
      setTimeout(() => {
        elements.money.style.transform = 'scale(1)';
        elements.savings.style.transform = 'scale(1)';
      }, 300);
    }
    
    elements.money.textContent = state.money;
    elements.savings.textContent = state.savings;
    
    // Add transition
    elements.money.style.transition = 'transform 0.3s ease';
    elements.savings.style.transition = 'transform 0.3s ease';
  },
  
  showError(message) {
    elements.prompt.textContent = message;
    elements.prompt.style.color = '#cc0000';
    speech.speak(message);
    
    setTimeout(() => {
      elements.prompt.style.color = '';
    }, 3000);
  }
};

// Persona selection handlers
document.querySelectorAll('#persona-screen button').forEach(btn => {
  btn.addEventListener('click', () => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    state.persona = btn.dataset.persona;
    const personaName = btn.textContent;
    
    elements.personaTitle.textContent = `வணக்கம், ${personaName}!`;
    
    elements.personaScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    game.loadScenario(state.persona);
  });
});

// Global function for HTML onclick handlers
function changeSlide(n) {
  slideshow.stop();
  slideshow.change(n);
  slideshow.isAutoPlaying = false;
  
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

// Prevent double-tap zoom on buttons
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Optimize for mobile performance
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Wake lock to prevent screen sleep during game (if supported)
let wakeLock = null;
const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock active');
    } catch (err) {
      console.log('Wake Lock error:', err);
    }
  }
};

// Request wake lock when game starts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !elements.personaScreen.classList.contains('hidden')) {
    requestWakeLock();
  }
});

// Initialize speech on page load
speech.init();

// Announce app ready
console.log("FinLit Simulator Mobile ready!");

// Preload first scenario for faster loading
if (navigator.connection && navigator.connection.effectiveType === '4g') {
  fetch('/scenarios/farmer.json').catch(() => {});
}