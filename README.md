# Polski B1

A small study app for Polish at B1 level. It runs in the browser and installs on the iPhone home screen, where it works offline.

**Version 0.1** · App: https://randhood.github.io/polski-b1/

## What's in version 0.1

- **Study → Flash Cards.** Square cards with the Polish word on the front and the meaning on the back. Tap to flip, swipe to move on, tap the speaker to hear it (hold for slow). Choose English or Arabic, swap the direction, and pick a word type:
  - Nouns & Adjectives (top 1000), Adverbs (300), Verbs (300, with aspect pairs)
  - Pronouns, Conjunctions, Prepositions (with the case they take), Interrogative
- **Statistics.** Exercise accuracy (counted by questions) and test results for 1 week or 30 days. Tests show a pass/fail streak and a chart per section (Reading, Listening, Grammar, Writing). A test passes only when every section is at least 50%.
- **Settings.** Pronunciation speed, backup export and import, example results to try Statistics, and reset.
- Practice, Exercises and Test are under construction.

Results are saved on the phone only (IndexedDB). Export a backup from Settings now and then.

## Install on iPhone

1. Open https://randhood.github.io/polski-b1/ in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open Polski B1 from the home screen. After the first open it works offline.

For a clearer voice, download the Enhanced Polish voice in iPhone Settings → Accessibility → Read & Speak → Voices → Polish.

## Change the word lists or settings

- App settings (menu, languages, word categories, test pass rule, statistics ranges) are in `public/config/app.json`.
- Word lists are edited in `data-src/*.txt` (one word per line, `polish|...|english|arabic`), then rebuilt into `public/data/words/*.json`:

```sh
npm run words      # rebuild the JSON word lists
npm run validate   # check config and word lists
```

## Develop

```sh
npm install
npm run dev        # local server
npm test           # unit tests
npm run build      # production build in dist/
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. In the repo settings, Pages must use **Source: GitHub Actions**.
