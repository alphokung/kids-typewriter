# Game Design Document: Animal Alpha-Type

## 1. Core Concept
Animal Alpha-Type is an interactive, web-based educational game designed to help young children learn the alphabet and basic spelling. By combining cute animal emojis with high-contrast text and immediate auditory feedback, the game creates a positive reinforcement loop for learning.

## 2. Target Audience
- **Primary:** Children aged 3–7 years.
- **Secondary:** Parents and educators looking for simple, no-install educational tools.

## 3. Visual Design (UI/UX)
- **Style:** "Bubbly" and soft aesthetic. Uses heavy rounded corners (`border-radius: 60px`), soft pastel colors (Sky Blue, Pink, Cream), and the **Quicksand** font for high readability.
- **Visual Cues:**
  - **Current Letter:** Highlighted in blue with an underline and a continuous pulse animation to draw focus.
  - **Typed Letters:** Faded out and slightly scaled down to show progress.
  - **Hint Dots:** Represent the total word length so children understand the "size" of the word visually.
  - **Success Feedback:** Features full-screen confetti bursts and a "Rainbow Text" jiggle animation. A random congratulatory message (e.g., "Awesome!") physically pops up above the animal emoji.

## 4. Educational Mechanics
- **Phonics & Recognition:** The game uses text-to-speech to read the full animal name when it appears, providing immediate context.
- **Character Reinforcement:** As each key is pressed, the game speaks only that specific character (forced to lowercase) to reinforce letter recognition.
- **Reward Loop:** Upon completing a word, the game plays a combination of the finished word and a celebratory phrase (e.g., *"Bear! Great job!"*).
- **Non-Repeating Learning:** Words are shuffled in a `wordPool` system, ensuring children interact with every animal in the library before seeing a duplicate.

## 5. Audio Engine
- **Background Music:** An 8-bit arcade soundtrack (Tetris theme) loops continuously at a low volume (`0.2`) to provide a fun atmosphere without drowning out the voice.
- **Voice Synthesis:** The game uses **Google Translate TTS via HTML5 Audio** instead of the native Web Speech API (`window.speechSynthesis`). This bypasses browser-specific bugs (such as Safari garbage collection issues or Chrome paused-state bugs) and ensures 100% reliable voice playback across all devices.

## 6. Mobile & Desktop Considerations
- **Responsive Layout:** The interface is designed to be "Thumb-friendly".
- **Dynamic Viewport Scaling:** Listens to the `window.visualViewport` API. When a software keyboard is toggled on mobile devices, the game container dynamically scales down (`transform: scale(0.85)`) and aligns to the top to prevent the keyboard from overlapping the word card.
- **Focus Management:** A hidden `<input>` field is kept focused via `touchstart` and `click` events to ensure the mobile keyboard stays active while tapping the screen.
- **Desktop Support:** Natively binds to physical keyboard `keydown` events for a seamless desktop typing experience.

---

# Technical Specification

## 1. Technical Stack
- **Language:** HTML5, CSS3, JavaScript (Vanilla ES6+).
- **Styling:** Tailwind CSS (via CDN) + Custom Vanilla CSS for keyframe animations.
- **External Libraries:** `canvas-confetti` (via CDN) for celebration effects.

## 2. Core Modules

### A. Word Management Logic
- **Data Structure:** An array of over 60 objects containing the `word` string and `emoji` character.
- **Shuffle Algorithm:** The `wordPool` system clones the master list, shuffles it using `Math.random() - 0.5`, and pops items one by one.

### B. Audio Engine (TTS + BGM)
- **BGM:** HTML5 `Audio` object looping an external `.mp3`.
- **TTS Generator (`playTTSAudio`):**
  - Constructs a Google Translate URL: `https://translate.google.com/translate_tts?ie=UTF-8&q=[text]&tl=en&client=tw-ob`
  - Cancels any currently playing TTS audio before instantiating a new `Audio(url)`.
  - Ensures zero overlap between letters if the user types rapidly.

### C. DOM & State Management
- **Variables:** `typedIndex` (current position), `score` (successful completions).
- **DOM Updates:** Dynamically generates `<span>` elements for letters and `<div>` elements for hint dots. Toggles `.typed`, `.current`, and `.active` CSS classes based on input validation.

### D. Mobile Input Hack
- Uses an `<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="opacity-0 absolute -z-10" />`.
- Captures the `input` event, reads the last typed character, validates it via `handleInput()`, and immediately clears the input's value to prevent text build-up.
