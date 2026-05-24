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
  { label: "Level 1", desc: "3-letter words",   stars: "⭐",         color: "bg-green-300",  text: "text-green-700"  },
  { label: "Level 2", desc: "4-letter words",   stars: "⭐⭐",       color: "bg-yellow-300", text: "text-yellow-700" },
  { label: "Level 3", desc: "5-letter words",   stars: "⭐⭐⭐",     color: "bg-orange-300", text: "text-orange-700" },
  { label: "Level 4", desc: "6–7 letter words", stars: "⭐⭐⭐⭐",   color: "bg-pink-300",   text: "text-pink-700"   },
  { label: "Level 5", desc: "8+ letter words",  stars: "⭐⭐⭐⭐⭐", color: "bg-purple-300", text: "text-purple-700" },
];

const modeMeta = {
  animal: { label: '🦁 Animals',            searchTag: 'animal',   imgText: '🔍 See pictures of this animal'   },
  food:   { label: '🍎 Fruits & Food',       searchTag: 'food',     imgText: '🔍 See pictures of this food'     },
  sport:  { label: '⚽ Activities & Sports', searchTag: 'activity', imgText: '🔍 See pictures of this activity' },
};

// --- State ---
let wordPool = [];
let currentWordObj = null;
let typedIndex = 0;
let score = parseInt(sessionStorage.getItem('score') || '0', 10);
let selectedLevel = 1;
let selectedMode = '';

// --- DOM Elements ---
const startScreen      = document.getElementById('start-screen');
const gameContainer    = document.getElementById('game-container');
const emojiDisplay     = document.getElementById('emoji-display');
const wordDisplay      = document.getElementById('word-display');
const hintDots         = document.getElementById('hint-dots');
const scoreDisplay     = document.getElementById('score');
const hiddenInput      = document.getElementById('hidden-input');
const congratsText     = document.getElementById('congrats-text');
const levelBadge       = document.getElementById('level-badge');
const backBtn          = document.getElementById('back-btn');
const googleImgLink    = document.getElementById('google-img-link');
const modePanel        = document.getElementById('mode-panel');
const levelPanel       = document.getElementById('level-panel');
const backToModesBtn   = document.getElementById('back-to-modes-btn');
const modeLabelDisplay = document.getElementById('mode-label-display');
const vocabScreen      = document.getElementById('vocab-screen');
const vocabContent     = document.getElementById('vocab-content');
const vocabModeLabel   = document.getElementById('vocab-mode-label');
const viewVocabBtn     = document.getElementById('view-vocab-btn');
const backFromVocabBtn = document.getElementById('back-from-vocab-btn');

// --- Boot ---
fetch('words.json')
  .then(r => r.json())
  .then(data => { masterWordList = data; init(); })
  .catch(err => console.error('Failed to load words.json:', err));

function init() {

  // --- Speech Engine ---

  // Preload voices; Chrome fires onvoiceschanged once they are ready.
  let cachedVoices = [];
  const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  // Chrome bug #1 — synthesis silently stops after ~15 s of inactivity.
  // Keepalive: tickle pause/resume every 10 s so Chrome never hits the timeout.
  setInterval(() => {
    if (window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10000);

  // Chrome bug #2 — synthesis pauses when the tab loses focus.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.speechSynthesis.resume();
  });

  // --- Sound Effects ---
  function playWrongSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // AudioContext not supported — fail silently
    }
  }

  // --- Speech Helper ---
  function speak(text, onEnd) {
    // Chrome bug #3 — cancel() leaves synthesis in "paused" state, not "idle".
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang   = 'en-US';
      u.rate   = 0.85;
      u.volume = 1;

      // Always fetch fresh — stale cache may be empty on first call.
      const voices = window.speechSynthesis.getVoices();
      const voice  = voices.find(v => v.name === 'Google US English')
                  || voices.find(v => v.lang === 'en-US')
                  || voices.find(v => v.lang.startsWith('en'));
      if (voice) u.voice = voice;

      if (onEnd) {
        // Guard against double-fire (onend + fallback timeout)
        let fired = false;
        const done = () => { if (!fired) { fired = true; onEnd(); } };
        u.onend = done;
        const fallbackMs = 50 + text.length * 110 + 600;
        setTimeout(done, fallbackMs);
      }

      window.speechSynthesis.speak(u);
    }, 50);
  }

  // --- Screen Transitions ---
  function goToStartScreen() {
    window.speechSynthesis.cancel();
    currentWordObj = null;
    gameContainer.classList.add('opacity-0', 'pointer-events-none');
    vocabScreen.style.display = 'none';
    startScreen.style.display = '';
    modePanel.style.display = '';
    levelPanel.style.display = 'none';
    setTimeout(() => startScreen.classList.remove('opacity-0'), 20);
  }

  // --- Back Button ---
  backBtn.addEventListener('click', goToStartScreen);

  // --- Mode Selection ---
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMode = btn.dataset.mode;
      modeLabelDisplay.textContent = modeMeta[selectedMode].label;
      modePanel.style.display = 'none';
      levelPanel.style.display = '';
    });
  });

  backToModesBtn.addEventListener('click', () => {
    levelPanel.style.display = 'none';
    modePanel.style.display = '';
  });

  // --- Vocab Screen ---
  function openVocabScreen() {
    vocabModeLabel.textContent = modeMeta[selectedMode].label;
    vocabContent.innerHTML = '';

    [1, 2, 3, 4, 5].forEach(level => {
      const words = masterWordList.filter(w => w.mode === selectedMode && w.level === level);
      if (!words.length) return;

      const section = document.createElement('div');
      section.className = 'mb-8';

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2 mb-3 mt-4';
      header.innerHTML = `<span class="text-base">${levelMeta[level - 1].stars}</span><span class="text-sm font-bold text-gray-500 uppercase tracking-wider">${levelMeta[level - 1].label} · ${levelMeta[level - 1].desc}</span>`;
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3';

      words.forEach(w => {
        const card = document.createElement('button');
        card.className = 'flex flex-col items-center bg-white rounded-2xl py-4 px-2 shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all active:scale-95';
        card.innerHTML = `<span class="text-4xl mb-2 leading-none">${w.emoji}</span><span class="text-xs font-bold uppercase tracking-wide text-gray-600">${w.word}</span>`;
        card.addEventListener('click', () => speak(w.word));
        grid.appendChild(card);
      });

      section.appendChild(grid);
      vocabContent.appendChild(section);
    });

    startScreen.style.display = 'none';
    vocabScreen.style.display = '';
    vocabScreen.scrollTop = 0;
  }

  viewVocabBtn.addEventListener('click', openVocabScreen);

  backFromVocabBtn.addEventListener('click', () => {
    vocabScreen.style.display = 'none';
    startScreen.style.display = '';
  });

  // --- Level Management ---
  function startLevel(level) {
    selectedLevel = level;
    if (level === 0) {
      wordPool = masterWordList
        .filter(w => w.mode === selectedMode)
        .sort(() => Math.random() - 0.5);
      levelBadge.textContent = '🎲 Random';
    } else {
      wordPool = masterWordList
        .filter(w => w.mode === selectedMode && w.level === level)
        .sort(() => Math.random() - 0.5);
      levelBadge.textContent = levelMeta[level - 1].label;
    }
    scoreDisplay.textContent = score;
  }

  function triggerLevelComplete() {
    // Block new input while celebrating
    currentWordObj = null;

    const colors = ['#a1c4fd', '#ff9a9e', '#fef9e7', '#fcd34d', '#86efac'];
    confetti({ particleCount: 180, spread: 100, origin: { x: 0.5, y: 0.5 }, colors });
    setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { x: 0.2, y: 0.5 }, colors }), 350);
    setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { x: 0.8, y: 0.5 }, colors }), 700);

    if (selectedLevel === 0 || selectedLevel >= 5) {
      // Random mode or all levels finished
      congratsText.textContent = '🏆 Champion!';
      congratsText.classList.remove('opacity-0', 'scale-50', 'congrats-pop');
      void congratsText.offsetWidth;
      congratsText.classList.add('congrats-pop');
      speak('Amazing! You finished all the words! You are a spelling champion!', () => {
        setTimeout(goToStartScreen, 1500);
      });
    } else {
      const nextLevel = selectedLevel + 1;
      congratsText.textContent = `⬆️ Level ${nextLevel}!`;
      congratsText.classList.remove('opacity-0', 'scale-50', 'congrats-pop');
      void congratsText.offsetWidth;
      congratsText.classList.add('congrats-pop');
      speak(`Congratulations! Level up! Level ${nextLevel}!`, () => {
        setTimeout(() => {
          startLevel(nextLevel);
          loadNextWord();
        }, 600);
      });
    }
  }

  // --- Level Selection (start screen) ---
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.level, 10);
      // Reset score for a fresh game
      score = 0;
      sessionStorage.setItem('score', '0');
      startLevel(level);

      scoreDisplay.textContent = score;
      startScreen.classList.add('opacity-0');
      setTimeout(() => {
        startScreen.style.display = 'none';
        gameContainer.classList.remove('opacity-0', 'pointer-events-none');
        hiddenInput.focus();
        loadNextWord();
      }, 100);
    });
  });

  // --- Word Management ---
  function loadNextWord() {
    // If pool is empty the level is complete
    if (wordPool.length === 0) {
      triggerLevelComplete();
      return;
    }

    currentWordObj = wordPool.pop();
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

    // Update Google Image search link
    const meta = modeMeta[selectedMode] || modeMeta.animal;
    googleImgLink.href = `https://www.google.com/search?q=${encodeURIComponent(currentWordObj.word)}+${meta.searchTag}&tbm=isch`;
    googleImgLink.textContent = meta.imgText;

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

    if (char.toLowerCase() !== targetChar) {
      // Wrong letter — buzz sound + shake
      playWrongSound();
      const letters = wordDisplay.querySelectorAll('.letter');
      const el = letters[typedIndex];
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
      return;
    }

    // Correct letter
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

  function finishWord() {
    score++;
    scoreDisplay.textContent = score;
    sessionStorage.setItem('score', String(score));

    // Letters rainbow
    const letters = wordDisplay.querySelectorAll('.letter');
    letters.forEach(l => l.classList.add('rainbow-text', 'jiggle'));

    // Emoji celebrate
    emojiDisplay.classList.remove('emoji-celebrate');
    void emojiDisplay.offsetWidth;
    emojiDisplay.classList.add('emoji-celebrate');

    // Congrats text pop
    const phrase = congratsPhrases[Math.floor(Math.random() * congratsPhrases.length)];
    congratsText.textContent = phrase;
    congratsText.classList.remove('opacity-0', 'scale-50', 'congrats-pop');
    void congratsText.offsetWidth;
    congratsText.classList.add('congrats-pop');

    // Wait for last character (~500 ms) + 200 ms gap, then speak phrase.
    // After phrase finishes, wait 500 ms then load next word.
    setTimeout(() => speak(phrase, () => setTimeout(loadNextWord, 500)), 700);

    // Staggered confetti bursts
    const colors = ['#a1c4fd', '#ff9a9e', '#fef9e7', '#fcd34d', '#86efac'];
    confetti({ particleCount: 120, spread: 70,  origin: { x: 0.5, y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.2, y: 0.5 }, colors }), 300);
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.8, y: 0.5 }, colors }), 500);
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
