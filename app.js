// --- Data ---
let masterWordList = [];

const congratsPhrases = [
  "Great job!",
  "Awesome!",
  "You did it!",
  "Super spelling!",
  "Fantastic!"
];

const levelMeta = [
  { label: "Level 1", desc: "3-letter words",  stars: "⭐",          color: "bg-green-300",  text: "text-green-700"  },
  { label: "Level 2", desc: "4-letter words",  stars: "⭐⭐",        color: "bg-yellow-300", text: "text-yellow-700" },
  { label: "Level 3", desc: "5-letter words",  stars: "⭐⭐⭐",      color: "bg-orange-300", text: "text-orange-700" },
  { label: "Level 4", desc: "6–7 letter words",stars: "⭐⭐⭐⭐",    color: "bg-pink-300",   text: "text-pink-700"   },
  { label: "Level 5", desc: "8+ letter words", stars: "⭐⭐⭐⭐⭐",  color: "bg-purple-300", text: "text-purple-700" },
];

// --- State ---
let wordPool = [];
let currentWordObj = null;
let typedIndex = 0;
let score = 0;
let selectedLevel = 1;

// --- DOM Elements ---
const startScreen   = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const emojiDisplay  = document.getElementById('emoji-display');
const wordDisplay   = document.getElementById('word-display');
const hintDots      = document.getElementById('hint-dots');
const scoreDisplay  = document.getElementById('score');
const hiddenInput   = document.getElementById('hidden-input');
const congratsText  = document.getElementById('congrats-text');
const levelBadge    = document.getElementById('level-badge');

// --- Boot ---
fetch('words.json')
  .then(r => r.json())
  .then(data => { masterWordList = data; init(); })
  .catch(err => console.error('Failed to load words.json:', err));

function init() {

// --- Speech Engine ---
// Cache voices as soon as they are available (Chrome loads them async).
let cachedVoices = [];
const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

// Resume synthesis when tab regains focus (Chrome pauses it on tab switch).
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) window.speechSynthesis.resume();
});

function speak(text) {
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'en-US';
    u.rate  = 0.85;
    u.volume = 1;
    // Prefer Google US English in Chrome; fall back gracefully.
    const voice = cachedVoices.find(v => v.name === 'Google US English')
               || cachedVoices.find(v => v.lang === 'en-US')
               || cachedVoices.find(v => v.lang.startsWith('en'));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }, 150);
}

// --- Level Selection ---
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedLevel = parseInt(btn.dataset.level, 10);
    wordPool = [];
    score = 0;
    scoreDisplay.textContent = 0;
    levelBadge.textContent = levelMeta[selectedLevel - 1].label;

    startScreen.classList.add('opacity-0');
    setTimeout(() => {
      startScreen.style.display = 'none';
      gameContainer.classList.remove('opacity-0', 'pointer-events-none');
      hiddenInput.focus();
      loadNextWord();
    }, 500);
  });
});

// --- Word Management ---
function getNextWord() {
  if (wordPool.length === 0) {
    wordPool = masterWordList
      .filter(w => w.level === selectedLevel)
      .sort(() => Math.random() - 0.5);
  }
  return wordPool.pop();
}

function loadNextWord() {
  currentWordObj = getNextWord();
  typedIndex = 0;

  emojiDisplay.textContent = currentWordObj.emoji;
  emojiDisplay.classList.remove('jiggle');
  congratsText.classList.remove('congrats-pop');
  congratsText.classList.add('opacity-0');

  wordDisplay.innerHTML = '';
  hintDots.innerHTML = '';

  for (let i = 0; i < currentWordObj.word.length; i++) {
    const span = document.createElement('span');
    span.textContent = currentWordObj.word[i];
    span.className = 'letter';
    if (i === 0) span.classList.add('current');
    wordDisplay.appendChild(span);

    const dot = document.createElement('div');
    dot.className = 'hint-dot';
    if (i === 0) dot.classList.add('active');
    hintDots.appendChild(dot);
  }

  speak(currentWordObj.word);
}

// Tap emoji to replay pronunciation
emojiDisplay.style.cursor = 'pointer';
emojiDisplay.addEventListener('click', () => {
  if (currentWordObj) speak(currentWordObj.word);
});

// --- Input Handling ---
function handleInput(char) {
  if (!currentWordObj || typedIndex >= currentWordObj.word.length) return;

  const targetChar = currentWordObj.word[typedIndex].toLowerCase();

  if (char.toLowerCase() === targetChar) {
    speak(targetChar);

    const letters = wordDisplay.querySelectorAll('.letter');
    const dots    = hintDots.querySelectorAll('.hint-dot');

    letters[typedIndex].classList.remove('current');
    letters[typedIndex].classList.add('typed');
    dots[typedIndex].classList.remove('active');

    typedIndex++;

    if (typedIndex < currentWordObj.word.length) {
      letters[typedIndex].classList.add('current');
      dots[typedIndex].classList.add('active');
    } else {
      finishWord();
    }
  }
}

function finishWord() {
  score++;
  scoreDisplay.textContent = score;

  // Letters rainbow
  const letters = wordDisplay.querySelectorAll('.letter');
  letters.forEach(l => l.classList.add('rainbow-text', 'jiggle'));

  // Emoji celebrate
  emojiDisplay.classList.remove('emoji-celebrate');
  void emojiDisplay.offsetWidth; // reflow to restart animation
  emojiDisplay.classList.add('emoji-celebrate');

  // Congrats text pop
  const phrase = congratsPhrases[Math.floor(Math.random() * congratsPhrases.length)];
  congratsText.textContent = phrase;
  congratsText.classList.remove('opacity-0', 'scale-50', 'congrats-pop');
  void congratsText.offsetWidth; // reflow to restart animation
  congratsText.classList.add('congrats-pop');

  // Wait for last character to finish (~500 ms) then add 200 ms gap before congrats phrase.
  setTimeout(() => speak(phrase), 700);

  // Staggered confetti bursts
  const colors = ['#a1c4fd', '#ff9a9e', '#fef9e7', '#fcd34d', '#86efac'];
  confetti({ particleCount: 120, spread: 70, origin: { x: 0.5, y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.2, y: 0.5 }, colors }), 300);
  setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.8, y: 0.5 }, colors }), 500);

  setTimeout(() => loadNextWord(), 3500);
}

// --- Input Listeners ---
hiddenInput.addEventListener('input', (e) => {
  const val = e.target.value;
  if (val.length > 0) {
    handleInput(val[val.length - 1]);
    e.target.value = '';
  }
});

gameContainer.addEventListener('touchstart', () => hiddenInput.focus());
gameContainer.addEventListener('click',      () => hiddenInput.focus());

// Keep hidden input focused on keydown so the input event always fires.
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
    hiddenInput.focus();
  }
});

// --- Mobile Responsiveness ---
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.8;
    document.body.classList.toggle('keyboard-active', isKeyboardOpen);
    document.body.style.height = `${window.visualViewport.height}px`;
  });
  document.body.style.height = `${window.visualViewport.height}px`;
}

} // end init
