# Word pronunciation audio

Every word in the library is voiced, and the same clip plays wherever the word appears. Most of what makes this work happens outside the codebase — an ElevenLabs generation plus an `ffmpeg` transcode — before a file reaches git. **Adding a word means following the checklist at the bottom; there is no missing-audio fallback.** Dialogue _lines_ have their own checklist in [DIALOGUES.md](DIALOGUES.md).

## Where the files live

Plain static files at `static/audio/words/<wordId>.m4a`, one flat directory, so a word shared by a deck, a letter example and a dialogue has exactly one file. Served off Netlify's CDN, not Supabase Storage: static bandwidth is already paid for, where Storage would be a new billable resource for no benefit at this scale. It also keeps clips reviewable in a PR diff and needs no signed URLs.

**Deliberately not in the PWA precache list** (`workbox.globPatterns`). That list is global, so every visitor would download every deck's clips on install. Audio is fetched on demand; normal HTTP caching handles repeat plays.

## Encoding

**AAC-LC in `.m4a`, mono, 24kHz, 32kbps CBR** — roughly 4–6KB per word.

```sh
ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac -b:a 32k -movflags +faststart <wordId>.m4a
```

- **AAC over MP3**: at this bitrate MP3 has audible swishy artifacts on speech.
- **AAC over Opus**: Opus is more efficient but has had inconsistent `<audio>` support in Safari/iOS; `.m4a` needs no fallback `<source>`.
- **No silence trimming.** Loose enough to be safe trims nothing; tight enough to matter risks clipping soft leading consonants, for a few hundred bytes.

## Voices and model

Generated with the ElevenLabs connector's `creative_generate_speech`.

- **Tereza jan** (`B7DEF4tn54LpozCVN7ah`) is the app's main voice. Every word clip is Tereza, no exceptions.
- **Lazy Dmitrii** (`oNYQkBHg8N8sOXiVNvyU`) is used only where two speakers are necessary — his dialogue lines. Never for a single word.

**Model: `eleven_v3`.** `eleven_multilingual_v2` mangles longer, phonetically complex Armenian words. If a word sounds off, check you're on v3 first.

**`eleven_multilingual_v2` is a last resort, not a comparison arm.** It is flatter, mushier and 15–20 dB quieter on this voice. Every time it's been generated as a control the reviewer has rejected it, and the one clip shipped from it is the catalog's known weak one. Reach for it only after v3 has failed outright across several rounds and prompt variants. If a v2 take ever ships, level it (`volume=…dB`) against the v3 clips around it.

**If the main voice changes — or is re-cloned in place — the whole catalog needs regenerating.** Nothing tracks which take produced which file, so an unchanged `voice_id` is not evidence a clip is current. When that happens, carry forward **structural** prompt fixes (the "Ո"→"Վ" respelling, the schwa buffer) and drop **tone** fixes unless a human listen confirmed them — they were tuned against the old voice and would over-steer a better one.

## ⚠️ Word-initial "Ո" is pronounced "vo", not "o"

The engine reads the literal spelling and gets this rule wrong, silently dropping the /v/. **Respell for the prompt only:** send `Վոնց`, keep `Ոնց` in the data and everywhere the learner sees it.

Three cases where the rule does _not_ apply — leave them alone:

- **A "Ո" that isn't first.** `Չորս` is "chors". The trap is pattern-matching on the letter rather than its position.
- **The digraph "Ու"** is /u/: `Ուշ` is "ush", already correct as spelled.
- **Lexical exceptions**: `ով` and its forms are "ov", not "vov".

Always listen to any word starting with "Ո" — this is an engine bug, not something readable from the code.

## Stress on the wrong syllable: end the prompt with `։`

Armenian stress is regularly on the last syllable, and the engine gets it wrong often enough to matter.

- **Always end an Armenian prompt with the Armenian full stop `։` (U+0589), never a Latin `.`** A Latin period weakens the engine's commitment to an Armenian reading — a loanword then comes back with its _source_ language's stress. That fix alone settled a native word that had failed a dozen times.
- **Add the shesht `՛` only for a loanword** whose source stresses a different syllable. It is not a general energy lever: seven words re-rolled with and without it split five plain to two shesht, and it lost on a monosyllable too, where the shesht arm was more _consistent_ in duration and still lost the listen. Duration consistency is not audible quality.
- **Keep the word capitalized.** Lowercasing the prompt roughly doubled the duration and read as a drawl.
- **Don't reach for a delivery-direction tag.** `[speaking clearly, stressing the final syllable]` produced over-articulated 1–2 s takes at ~55 credits against ~7. Punctuation and the stress mark are free.

## The breath at the end

The voice frequently inhales after a word — the single most common defect, around 20 takes in 48 in one batch. The fix is a trim, not a re-roll, and the shape is always:

```
[speech][gap][short blip]
         ^ cut here
```

Find the loud segments (`silencedetect=noise=-40dB:d=0.08`); if the last is short (< 0.45 s) after a real gap (≥ 0.08 s), cut at the previous segment's end, keep 60 ms of tail and fade 50 ms. **Guard it** — three conditions, any failure keeping the clip whole: what remains is ≥ 0.25 s, the blip is shorter than what remains, and what remains is ≥ 40% of the total loud time. Without them a word with a soft initial consonant reads as the breath and gets deleted.

[`breath_trim.py`](../scripts/audio/breath_trim.py) runs this over a directory and writes the trimmed takes in the app's encoding, re-applying while a trailing blip remains. Run it **before** building the picker page, so the human hears what ships.

Counter-intuitively, lowering the noise floor finds _fewer_ breaths: a quiet inhale merges into the word's decay and stops being a separate segment. `-40dB` is the operating point.

### The glued breath: fixable by hand, NOT safe to automate

Some inhales never rise above the gate — the clip just ends in a faint hiss, with no `[gap][blip]` to find. Cutting one by hand is right; automating it is not. The obvious rule (trim after the last frame above a −38 dB voiced floor) is **a sibilant detector, not a breath detector**: it fired on 4 of 6 words ending in a fricative or affricate and 0 of 6 ending in a vowel or nasal. Armenian word-final /s/ measures −41 to −44 dB here, _below_ the floor, with exactly the high-frequency signature the rule looks for — left to run it would have cut the /s/ off every take of `Միս`.

So:

1. Only reach for this when a human reports an audible gasp on a specific clip.
2. Check what the word **ends with**. A fricative or affricate (ս, շ, չ, ց, ժ, զ, խ, հ) — don't trim, pick another take.
3. Otherwise cut at the voiced end + 60 ms with a 50 ms fade, re-cutting from the **original mp3** so the clip isn't AAC-encoded twice.

**When a reviewer reports a gasp the script "kept", print the RMS tail and look for a rise after the decay, not for a gap.** Two real cases: a 3 ms consonant release sat in the middle of a 130 ms gap and split it into two silences each under the detection floor; and a level that decayed to −44 dB and rose back to −24 dB with no gap at all. For the first, re-run `silencedetect` at `d=0.03`.

## Connector mechanics

- **Check the concurrency cap in the error; it changes.** It was five in early September 2026 and three later that month, when a batch of 16 generations failed 7 of them. At a cap of three: **one word per message, `generations_count: 3`**. Failed generations still come back carrying a `price` field.
- **Signed download URLs expire 7200 s after `X-Goog-Date`** and then fail with HTTP 400. **Re-polling the same `flow_id` and `session_ids` mints fresh URLs for free** — never re-run a generation to recover a link.
- **The scratchpad is not durable.** Keep nothing there that can't be re-fetched; the re-poll above is the recovery path.

## Reviewing takes

Generation is non-deterministic and the agent generating can't hear anything, so review isn't optional — and doing it one clip at a time over chat means the human describes what they heard in prose, which then has to be mapped back onto a file.

**Generate a few takes per word, build one self-contained HTML page holding all of them, and let the human pick** ([`review_page.py`](../scripts/audio/review_page.py)).

- **One row per word**: Armenian, id, gloss, then a dashed **now** chip playing what currently ships, then the new takes with durations.
- **Tap to hear, tap the same chip again to choose.** The first tap is always "let me hear this"; single-tap commit means every audition overwrites the last pick.
- **Choosing `now` means "keep what's installed"** — it records a decision, which is what distinguishes reviewed-and-kept from not-yet-listened-to.
- **A sticky footer accumulates picks as `id=take` lines** with a Copy button, so the human pastes a block back rather than prose.
- **Every clip is inlined as a `data:` URI** — the page must work with no external requests, since takes live in a scratch directory and behind URLs that expire in two hours. Twelve words × five clips is ~0.3MB.
- **Transcode before building the page**, so the human auditions the exact bytes that ship and the chosen file installs with a `cp`.
- **About twelve words per page.**

Cost isn't the constraint — a four-take word is a fraction of a cent. **Take volume is the cheap lever; the human's listening time is the expensive one.**

## Known fixes for specific symptoms

- **An ending that stops dead.** Some takes end within hundredths of a second of the last consonant and read as cut off even though nothing was cut. Add `apad=pad_dur=0.15`; it's harmless on a take that already has room, so pad every candidate rather than re-rolling. If there _is_ something in the tail (a tick above the floor, an inhale beginning), cut before it with a 30–50 ms fade, then pad.
- **A one-syllable word that drawls.** Drop the `։`. The full stop exists to fix stress, and a one-vowel word has none to fix — `Է` with it stretched into an aimless filler, and `Աղ` came out breathy until the bare letter was prompted.
- **A word the model has no reading for.** `Հոպար` came out wrong in 21 readings across five arms. The shesht and the full stop fix a _loanword's_ stress; they don't help here. **Stop after two arms** and ask a native speaker for a recording, or ship the least bad and note it. Candidates for the same trouble: colloquial kin terms and anything not in a dictionary.
- **A dropped affricate.** `Ձու` read as "zu" in every plain take; a shesht take fixed it. Respelling as `Դձու։` restored the d but as a separate letter. Worth remembering: a word that is another word's first syllable can be borrowed — three `Ձուկ` takes cut before the final release would have given a clean "dzu".

## Adding audio for a new word

Every time a word is added to `entries.ts`, whichever feature needed it:

1. **Generate**: `prompt` = the exact `armenian` value, capitalized, followed by `։` — with the "Ո"→"Վ" respelling where it applies — `model_id: "eleven_v3"`, `voice_id: B7DEF4tn54LpozCVN7ah`, `generations_count` = the concurrency cap, **one word per message**.
2. **Poll** `creative_get_flow_run_status` with the returned `flow_id` and `session_ids` until `all_completed`, then take each `media[].url`. Save those ids outside the scratchpad: re-polling mints fresh URLs for free.
3. **Download every take**, run `breath_trim.py` over the directory, and transcode whatever it left alone with the `ffmpeg` command above.
4. **Get a human to listen and pick.** Don't skip this because generation succeeded.
5. **Save as `static/audio/words/<wordId>.m4a`.** No code change beyond the library entry — `wordAudioSrc()` derives the path from the id.
6. **Commit the `.m4a` alongside the library change.**

**Known constraint:** the workspace's free tier hit a very low daily cap. A `free_tier_…` rate-limit error is the plan, not a bug here.

As of 2026-09-22 every word in `entries.ts` has a clip, each chosen by a human from the picker and passed through the breath trim. `hopar` is the one known weak clip.
