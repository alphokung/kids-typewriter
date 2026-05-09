# 🦁 Animal Alpha-Type

An interactive spelling game for young children (ages 3–7). Kids pick a difficulty level, hear the animal's name pronounced, then type each letter to spell it out — earning confetti and praise when they finish.

No install required. Runs entirely in the browser.

---

## ✨ Features

- **5 difficulty levels** — from 3-letter words (cat, dog) up to 8+ letters (elephant, butterfly)
- **Word pronunciation** — the animal name is spoken aloud when each word appears; tap the emoji to hear it again
- **Visual feedback** — the current letter is highlighted with a pulse, typed letters fade out, hint dots show word length
- **Celebration** — confetti burst + rainbow animation + a random congrats phrase on completion
- **Mobile & desktop** — works on phones, tablets, and keyboards; the layout adjusts when the on-screen keyboard opens

---

## 🎮 How to Play

1. Open the game in a browser
2. Choose a level (1 = easiest, 5 = hardest)
3. Listen to the word being pronounced
4. Type the letters one by one — correct letters light up automatically
5. Complete the word to earn a star and move to the next animal
6. Tap the animal emoji anytime to hear the word again

---

## 📁 Project Structure

```
├── index.html        # Game UI
├── app.js            # Game logic
├── styles.css        # Custom animations and letter states
├── words.json        # Word list with emoji and level tags
└── _media/
    └── Level_Seven_Ascent.mp3
```

---

## 🧩 Levels

| Level | Word Length | Examples |
|-------|-------------|---------|
| ⭐ 1 | 3 letters | cat, dog, bee |
| ⭐⭐ 2 | 4 letters | bear, frog, duck |
| ⭐⭐⭐ 3 | 5 letters | tiger, shark, koala |
| ⭐⭐⭐⭐ 4 | 6–7 letters | rabbit, penguin, octopus |
| ⭐⭐⭐⭐⭐ 5 | 8+ letters | elephant, butterfly, kangaroo |

---

## 🗂️ Adding Words

Edit [`words.json`](words.json). Each entry needs three fields:

```json
{ "word": "parrot", "emoji": "🦜", "level": 4 }
```

- `word` — lowercase spelling
- `emoji` — any single emoji
- `level` — integer 1–5

---

## 🛠️ Tech Stack

- Vanilla HTML / CSS / JavaScript (no framework)
- [Tailwind CSS](https://tailwindcss.com) via CDN
- [canvas-confetti](https://github.com/catdad/canvas-confetti) via CDN
- Web Speech API for pronunciation

---

## 🚀 Running Locally

Because the game fetches `words.json`, it needs to be served over HTTP — not opened as a `file://` URL.

**Option 1 — Node**
```bash
npx serve .
```

**Option 2 — Python**
```bash
python3 -m http.server
```

Then open `http://localhost:3000` (or whichever port the server prints).
