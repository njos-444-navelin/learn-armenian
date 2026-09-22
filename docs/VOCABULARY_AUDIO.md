# Word pronunciation audio

Every [`Word`](../src/lib/content/words/types.ts) in the word library is
voiced — a "loudspeaker" button next to its Armenian text
([`SpeakerButton.svelte`](../src/lib/components/SpeakerButton.svelte)) plays a
pre-generated audio clip of that exact word. The same clip plays everywhere
the word appears: a deck's word list
([`VocabularyWordList.svelte`](../src/lib/components/VocabularyWordList.svelte)),
the flip-card trainer
([`VocabularyTrainer.svelte`](../src/lib/components/VocabularyTrainer.svelte)),
a letter's "in a word" example in the alphabet trainer, and the word popover
in a dialogue ([`DialogueWordPopover.svelte`](../src/lib/components/DialogueWordPopover.svelte)).

This doc exists because, like [`docs/AUTH.md`](AUTH.md), most of what makes
this feature actually work happens outside the codebase (an ElevenLabs
generation + an `ffmpeg` transcode) before a file ever reaches git. **If
you're adding a new word to the library, you need the checklist at the
bottom of this doc — the code has no "missing audio" fallback.** (Dialogue
*lines* — whole sentences in two voices — have their own, separate
checklist in [`docs/DIALOGUES.md`](DIALOGUES.md).)

## Where the files live, and why

Audio ships as plain static files under
[`static/audio/words/<wordId>.m4a`](../static/audio/words/) — one flat
directory keyed by word id, so a word shared by a deck, a letter example and
a dialogue has exactly one file — served straight off Netlify's CDN, the
same pipeline that already serves `static/icons/*`. Not Supabase Storage.

(Until 2026-09 vocabulary clips lived under `static/audio/vocabulary/<deckId>/`
and the alphabet's example words under `static/audio/words/`, with several
words recorded twice; merging the two registries into the one library — see
[Conventions §10](CONVENTIONS.md#10-words-live-in-one-shared-library-decks-and-dialogues-reference-it-by-id)
— moved every clip into `words/` and dropped the duplicates.)

That's the cheaper option for this app specifically: Netlify bandwidth for
static assets is already fully paid for by the existing hosting plan, so a
few more small files cost nothing incremental. Supabase Storage would be a
*new* billable resource (storage + egress) that this project doesn't use for
anything else today, plus bucket/access-policy setup, for no benefit over
what's already free. At this catalog's scale (dozens to low hundreds of
words, a few KB each) the total either way is trivial — "cheaper" mostly
just resolves to "which pipeline is already free," and that's the static
route.

It also fits the app's existing shape better:
- Audio ships alongside the word library's code, reviewable in a PR diff,
  versioned in git like everything else under `src/lib/content/`.
- No auth/signed-URL complexity — a `<audio src>` just points straight at
  the file.
- **Deliberately not added to the PWA's offline precache list**
  (`workbox.globPatterns` in [`vite.config.ts`](../vite.config.ts)). That
  list is global — every file matching it gets downloaded on first install,
  for every visitor, regardless of which words they ever look at. A learner
  who never opens "Greetings" shouldn't download its pronunciation clips.
  Audio is fetched on demand instead — normal HTTP/browser caching handles
  repeat plays.

## Encoding

**AAC-LC in an `.m4a` container, mono, 24kHz, 32kbps CBR.** A ~1-second word
comes out to roughly 4–6KB.

```sh
ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac -b:a 32k -movflags +faststart <wordId>.m4a
```

Why this over the obvious alternatives:
- **AAC over MP3**: at this low a bitrate, MP3 (LAME) shows audible
  "underwater"/swishy compression artifacts on speech; AAC-LC stays
  noticeably cleaner at the same bitrate — it's a better fit for "reasonably
  good, not pristine" than MP3 is.
- **AAC over Opus**: Opus is more efficient bit-for-bit, but has had
  inconsistent `<audio>` support in Safari/iOS historically. AAC/`.m4a` has
  universal support across every browser/OS this app targets, no fallback
  `<source>` needed.
- **Mono, 24kHz, 32kbps**: a single spoken word doesn't need stereo or a
  44.1kHz sample rate — halving/quartering those relative to "full quality"
  defaults costs nothing perceptible for speech-only content this short,
  while meaningfully shrinking every file.
- **No silence trimming**: tested (`silenceremove`) and rejected — at a
  threshold loose enough to be safe, it barely trims anything; at a
  threshold that trims meaningfully, it risks clipping soft
  leading/trailing consonants. Files are already ~5KB either way, so the
  byte savings aren't worth the quality risk.

## Voices and model

Generated via the ElevenLabs MCP connector's `creative_generate_speech`
tool. The workspace has two voices, with a fixed division of labor:

- **"Tereza jan speaks Armenian"** (`voice_id: B7DEF4tn54LpozCVN7ah`) —
  **the app's main voice.** Everything single-voiced defaults to her:
  individual vocabulary words, and any future single-speaker audio. If
  you're generating a word clip, it's Tereza, no exceptions.
- **"Lazy Dmitrii"** (`voice_id: oNYQkBHg8N8sOXiVNvyU`) — **the second
  voice, used only where two speakers are necessary** — his lines in a
  dialogue (see [`docs/DIALOGUES.md`](DIALOGUES.md)). Never the default for
  anything; single words are always Tereza.

These replaced the earlier "Temporary Armenian voice before we create one
with Tereza" placeholder (deleted from the workspace on 2026-08-18; the
whole catalog was regenerated with Tereza jan the same day). Unlike that
placeholder, whose `voice_id` churned with every dashboard recreation,
these two are the intended long-term voices — the ids above are safe to
use directly. If a generation fails with an unknown-voice error, check
`creative_list_voices` before assuming anything else is wrong.

**Model: `eleven_v3`, not `eleven_multilingual_v2`.** The catalog was
originally generated with `eleven_multilingual_v2` (the connector's default
recommendation for multilingual text), but it turned out to mangle longer,
phonetically complex Armenian words — confirmed on `Հաջողություն`
("Good luck"), which came out badly garbled while short common words like
`Բարև` sounded fine. Regenerating that same word with the same voice but
`eleven_v3` fixed it, so the whole catalog was redone on `eleven_v3`. If a
future word sounds off, don't assume it's the voice — try `eleven_v3` first
(and if you're not already on it, that's the bug).

**`eleven_multilingual_v2` is a last resort, not an arm to try.** It is
markedly worse than `eleven_v3` on this voice in general — flatter,
mushier, and 15–20 dB quieter (the food deck's Կարագ and Աղ control arms
on 2026-09-21 peaked at −19 to −28 dB against −2 to −8 dB for the v3 takes
beside them; Հոպար's below was ~11 dB down). Every time it has been
generated as a comparison arm the reviewer has rejected it, and the one
clip shipped from it (`hopar`) is the catalog's known weak one. Reach for
it only when v3 has failed on a word outright, across several rounds and
prompt variants, and there is no native recording to fall back on; never
as a routine second opinion. If a v2 take is ever shipped, level it
(`volume=…dB`) against the v3 clips around it, as `hopar` is.

**If the main voice ever changes again, every existing `.m4a` file needs
regenerating with the new `voice_id`** — there's no per-word tracking of
which voice generated which file, so treat a voice swap as "redo the whole
catalog," not an incremental migration. (This has happened twice: the
2026-08-18 switch from the temporary voice to Tereza jan, and the 2026-09-08
regeneration below.)

**The same applies when a voice is *re-cloned in place*.** On 2026-09-08 both
voices were re-recorded in the ElevenLabs dashboard for higher quality,
keeping their existing `voice_id`s — so nothing in this doc's ids changed,
but every clip was still from the old sample set and every one was redone
(all 39 letter phonemes and all 71 word clips, `eleven_v3`, Tereza jan). An
unchanged `voice_id` is *not* evidence a clip is current; there's still no
per-file tracking of which take generated which file. If the voices are
re-recorded again, redo the whole catalog again.

**Prompt policy used for that regeneration**, worth reusing next time, since
this doc records prompt tweaks but nothing machine-readable maps a file to
the prompt that made it: **structural fixes were carried forward, tone fixes
only where a human listen had confirmed them.** Concretely — the "Ո"→"Վ"
respelling and the schwa buffer are engine-level bugs and were kept; the
delivery-direction tags were kept only for `nor`, `ynker` and `yot`, whose
tags this doc records as *resolved by listen*, and dropped everywhere else
(they had been tuned against the old voice's takes, so re-applying unproven
ones would over-steer a better voice). Everything else was regenerated from
the plain prompt and left for the listening pass.

## ⚠️ VERY IMPORTANT: word-initial "Ո" is pronounced "vo", not "o"

Armenian orthography has a rule ElevenLabs' TTS does not know: a
**word-initial "Ո" is pronounced /vo/, not /o/.** `Ոնց` ("how?", informal) is
pronounced "vonts" — not "onts". `Որ` ("which/that") is "vor", not "or". This
holds for essentially every word that starts with a standalone "Ո".

Three situations where that does **not** apply — leave these alone:
- **A "Ո" that is not the first letter.** The rule is about word-*initial*
  position only. `Չորս` ("four") has its Ո second, so it is a plain /o/ —
  "chors", never "chvors" — and the prompt is already correct as spelled.
  Worth stating because the trap is to pattern-match on the letter rather
  than its position.
- **The digraph "Ու"** (Ո followed by ւ) is pronounced /u/, not /vo/ or
  /voo/ — e.g. `Ուշ` ("late") is "ush". If a word starts with "Ու" (two
  letters, not one), it's already fine as literally spelled.
- **A few lexical exceptions**: `ով` ("who") and its forms (`ովքեր`,
  "who, pl.") are pronounced "ov", not "vov".

**ElevenLabs reads the literal spelling and gets the general rule wrong** —
it renders a word-initial standalone "Ո" as a flat "o", silently dropping
the "v" sound. Confirmed on `Ոնց` (`vonts`), which first came out as "onts".

**Workaround — respell for the TTS prompt only, never for the word itself:**
when generating audio for a word starting with a standalone "Ո" (not "Ու",
not one of the `ով`/`ովքեր` exceptions), swap that first "Ո" for "Վ" in the
`prompt` you send to `creative_generate_speech` — e.g. generate `vonts`
with the prompt `Վոնց`, not `Ոնց`. Discard that respelling immediately
after — the deck file's `armenian` field and everything the learner sees
must keep the correct, real spelling (`Ոնց`). "Վ" is unambiguously /v/ to
the TTS engine and reliably restores the sound it otherwise drops.

**Always listen to the result of any word starting with "Ո"** before
treating its audio as done — this is a TTS engine bug, not something
catchable by reading the code or the source text.

## Stress on the wrong syllable: end the prompt with the Armenian full stop `։`

Armenian stress is regularly on the **last** syllable. The engine gets this
wrong often enough to matter, and on 2026-09-09 two words —
`normal` (Նորմալ) and `nayel` (Նայել) — kept landing the stress on the
*first* syllable across many takes.

**What fixed it: writing the prompt as `Նորմա՛լ։` — capitalised, with the
shesht stress mark `՛` on the final syllable's vowel, and ending in the
Armenian full stop `։` (U+0589), not a Latin `.`** Both words were settled
from that form on the first round of takes after a dozen failures with a
Latin period.

Three treatments were generated side by side, four takes each, so the
finding isn't a lucky roll:

| prompt | result |
|---|---|
| `Նորմա՛լ։` capitalised + mark + Armenian stop | **chosen for both words** |
| `նորմա՛լ։` lowercase + mark | audibly drawled; 1.0–2.2 s against 0.6–0.9 s |
| `նորմալ։` lowercase, no mark | same drawl, stress still unreliable |

Two things to take from that:

- **Lowercasing the prompt makes it worse, not better.** The hypothesis was
  that a capital initial cues prominence on the first syllable; the takes
  say otherwise — lowercase roughly doubled the duration and read as a
  drawl. Keep the word capitalised, per Conventions §10.
- **The Latin period is a real hazard.** A `.` after Armenian text appears
  to weaken the engine's commitment to an Armenian reading. `Նորմալ` is a
  Russian loan, and the wrong stress it produced is exactly Russian stress
  ("нормáльно") — consistent with the model falling out of Armenian and
  into the nearest language it knows the word from. **For a loanword,
  reach for `։` first.**

**Confirmed the next day on a native word: the punctuation alone is enough.**
`anel` (Անել, "to do") had the same wrong-syllable problem, and was
regenerated as two families — `Անե՛լ։` with the stress mark and `Անել։`
with only the Armenian full stop. **The plain `Անել։` was chosen.** So the
rule has two levels:

**The shesht is not a general energy lever.** Seven words rejected on a first
pass were re-rolled at eight takes each, four plain and four with the shesht
added on the stressed syllable (Ե՛մ, Չե՛մ, Դա՛, Ի՛սկ, Թե՛, Կա՛թ, Չո՛րս). The
picks split **five plain to two shesht** — no systematic winner. Use the
shesht for the loanword stress problem it actually solves, not to make a word
livelier.

A tempting follow-up guess — that the shesht might at least help on *short*
words, where the engine has little room to place stress itself — **also
failed**. `Չորս` is a monosyllable, its shesht arm came back visibly tighter
and more even (0.64–0.88 s against 0.72–1.36 s), and the plain arm still won
the listen. Duration consistency is not audible quality; do not use it as a
proxy.

- **Always end an Armenian prompt with `։`, never a Latin `.`** That is the
  actual fix, and it costs nothing.
- **Add the shesht `՛` only for a loanword** whose source language stresses
  a different syllable — `Նորմալ` from Russian is the case in hand. On a
  native Armenian word the mark is unnecessary, and the takes without it
  sounded more natural.

**Do not reach for a delivery-direction tag for this.** `[speaking clearly,
stressing the final syllable] Նորմալ.` was tried and rejected: the takes ran
1.0–2.2 s (against ~0.6 s for a clean word), reading as over-articulated
rather than natural, and each one cost **≈55 credits against ≈7** for the
same word without the tag, because the bracketed text is billed as
characters. A tag is an expensive way to get a worse clip; punctuation and
the stress mark are free.

## The breath at the end: cut it, but only when you can prove it is one

The voice frequently inhales after finishing a word. On a single-word clip
this is very audible — the word ends, there is a beat of silence, and then a
gasp. It is the single most common defect in generated takes: **20 of 48
takes in one re-roll batch had one.**

The fix is a trim, not a re-roll. The shape is always the same:

```
[speech][gap][short blip]
         ^ cut here
```

So: find the loud segments, and if the **last** one is short (< 0.45 s) and
separated from the previous one by a real gap (≥ 0.08 s), cut at the end of
the previous segment, keep 60 ms of tail, and fade out over 50 ms so the end
is not a click. `silencedetect=noise=-40dB:d=0.08` finds the segments;
`atrim` + `afade` does the cut.

**Guard it.** `tun.m4a` (Տուն) has a soft initial consonant, and the naive
rule read the entire word as the "breath" and 0.02 s of lead-in as the
speech — it would have deleted the word. Three conditions prevent that:

- what remains must be at least 0.25 s long;
- the discarded blip must be **shorter** than what remains;
- what remains must be at least 40% of the total loud duration.

If any fails, keep the clip whole. Silence is cheap; a truncated word is not.

This is [`scripts/audio/breath_trim.py`](../scripts/audio/breath_trim.py)
(`python3 scripts/audio/breath_trim.py <mp3_dir> <m4a_dir>`): it runs the
rule over a directory of downloaded takes and writes the trimmed ones in
the app's encoding, printing a line per file. It applies the rule again
while a trailing blip remains — a take with two breaths is the same shape
twice — which is what turned three 1.6–2.0 s family-deck takes back into
0.65–0.8 s words. Run it before building the picker page, so what the
human hears is what ships.

### The glued breath: fixable by hand, NOT safe to automate

Some inhales never rise above the noise gate. They ride straight out of the
word's decay, so there is no `[gap][blip]` for the rule above to find — the
clip just ends in a faint hiss. `bread-shop` line 04 was one: speech ends at
0.87 s, and from 0.97 s the level is only −45 to −49 dB while its
high-frequency content jumps from −15 dB to −4 dB relative.

Cutting that one by hand was right, and it worked. **Do not turn it into an
automatic pass.** The obvious rule — find the last frame above a −38 dB
"voiced floor", then trim what follows if it is quiet and broadband — was
tried here, and it is a **sibilant detector, not a breath detector**:

| final sound | words tested | rule fires |
|---|---|---|
| fricative or affricate | `mis`, `yes`, `ays`, `voch`, `inch`, `hats` | **4 of 6** |
| vowel or nasal | `dzu`, `sa`, `da`, `te`, `em`, `en` | **0 of 6** |

The tempting guard — "a word-final fricative is loud, so the level gate
protects it" — **is false.** Armenian word-final /s/ in this voice measures
**−41 to −44 dB**, below the −38 dB floor, with a high-frequency delta of
+9 to +13 dB: exactly the signature the rule looks for. Left to run, it would
have cut 0.11–0.17 s off every take of `Միս` — the /s/ itself.

Note that line 04 ends in /m/. It was safe *because of the phoneme*, not
because of the threshold.

So the procedure is:

1. Only reach for this when a human reports an audible gasp on a specific
   clip. It is a diagnostic aid, never a batch job.
2. Check what the word or line **ends with**. If that is a fricative or an
   affricate (ս, շ, չ, ց, ժ, զ, խ, հ), do not trim — pick a different take.
3. Otherwise cut at the voiced end plus 60 ms with a 50 ms fade, re-cutting
   from the **original mp3** so the clip is not AAC-encoded twice.

Counter-intuitively, lowering the noise floor finds *fewer* breaths, not
more — a quiet inhale merges into the word's decay and stops being a separate
segment at all. `-40dB` is the operating point; `-50dB` and `-55dB` both
detect less.

## Connector mechanics that cost time

Three things about the ElevenLabs connector are worth knowing before a big
batch, because each one cost a round trip here:

**Three concurrent generations, and no more — check the number in the
error, it has changed.** The subscription caps parallel requests; the cap
was five in early September 2026 and **three** on 2026-09-16, when the family
deck's first batch — four words, four takes each, in one message — came back
with `Too many concurrent requests … a maximum of 3 concurrent requests`
on 7 of 16 generations (one word lost all four). Failed generations still
come back carrying a `price` field; whether they are actually charged is
unverified, but staying under the limit costs nothing either way. So, at a
cap of three: **one word per message, `generations_count: 3`** — a single
call of four already exceeds it. The rest of the deck went through that way
with no failures. A three-take word is a smaller choice than four, and it
has been enough; if the cap goes back up, go back to four.

**Signed download URLs expire 7200 s after their `X-Goog-Date`.** When they
do, downloads fail with HTTP 400. **Re-polling the same `flow_id` and
`session_ids` mints fresh URLs and does not regenerate anything** — no
credits, just a round trip. Never re-run a generation to recover a link.

**The scratchpad is not durable.** It was wiped twice mid-session here,
taking every downloaded take and build script with it. Keep nothing there
that cannot be re-fetched; the re-poll above is the recovery path, and it is
free.

## Reviewing takes: generate a few, pick one in a browser

Generation is non-deterministic — the *same* prompt, the same voice and the
same model produce noticeably different takes run to run — and the agent
doing the generating cannot hear any of them. So the review step is not
optional, and doing it one clip at a time over chat is miserable: the human
ends up describing what they heard in prose ("the third one, but a bit
clipped"), which then has to be mapped back onto a file.

**The process that works: generate four takes per word, build a single
self-contained HTML page holding all of them, and let the human pick.**
This is how all 39 letter phonemes and the whole word catalog were reviewed
on 2026-09-09.

How the page works:

- **One row per word**: the Armenian text, the word id and its English
  gloss, then a row of chips — a dashed **now** chip playing the clip
  currently shipping, then the four new takes numbered 1–4, each labelled
  with its duration.
- **Tap to hear, tap the same chip again to choose.** Two taps rather than
  one, because the first tap is always "let me hear this" — a single-tap
  commit would mean every audition silently overwrites the previous pick.
- **Choosing `now` means "keep what's installed."** It records a decision
  without producing a swap, which distinguishes *reviewed and kept* from
  *not yet listened to* — the difference that makes a coverage count
  meaningful.
- **A sticky footer accumulates the picks as `id=take` lines** with a Copy
  button. The human pastes that block straight back into the conversation
  and the agent installs the files from it — no prose, no ambiguity, no
  re-listening to confirm which clip was meant.

Build details that matter:

- **Every clip is inlined as a `data:audio/mp4` base64 URI.** The page has
  to be a single file with no external requests: it's published as an
  Artifact, and the takes only exist in a scratch directory and behind
  signed ElevenLabs URLs that expire two hours after generation. Twelve
  words × five clips lands around 0.3MB, comfortably inside the 16MB
  Artifact ceiling.
- **Transcode before building the page, not after picking.** Run the
  `ffmpeg` command above on all four takes as they're downloaded. Then the
  chosen file is installed with a plain `cp` — the human auditioned exactly
  the bytes that ship, rather than a preview of a source that gets
  re-encoded afterwards.
- **Batch about twelve words per page.** Enough to be worth a round trip,
  short enough to finish in one sitting.

Cost is not the constraint here — a four-take word runs about 4–17 ElevenLabs
credits (well under a cent), so the whole 71-word catalog costs a few tens of
cents. **Take volume is the cheap lever; the human's listening time is the
expensive one.** Design the review page around their attention, not around
saving generations.

## An ending that stops dead: add 150 ms of room

Some takes end within a few hundredths of a second of the last consonant —
`Բարեկամ`, `Տղամարդ` and `Պապիկ` all did it, on take after take, across
three rounds. The word is complete, but the file ends on it and the player
stops with a thud; the reviewer hears "cut off too early" even on a take
nothing was cut from. The fix is `apad=pad_dur=0.15` — 150 ms of silence
after the word — not a re-roll: the new takes ended the same way. It's
harmless on a take that already has room, so when a reviewer says a word
ends too abruptly, pad every candidate of that word and let them pick on
the voice alone. (Sometimes there *is* something in that last stretch: a
tick at −37 dB against a −47 dB floor just after the release, or an inhale
starting to rise right before the file ends. Print a 10 ms RMS profile of
the tail, cut before it with a 30–50 ms fade, then pad.)

## A word the model doesn't know: Հոպար

`Հոպար` — the colloquial "father's brother" — came out with the stress on
the first syllable and a sharp fall onto the second, "HO-par", in every take
of every arm tried on 2026-09-16: plain `Հոպար։` ×6, `Հոպա՛ր։` with the
stress mark ×3, `[calmly] Հոպար։` ×3 (which also cost 15 credits a take
against 6), `eleven_multilingual_v2` ×3, and the word said twice
(`Հոպար։ Հոպար։` ×3, each occurrence cut out) — 21 readings, none neutral.
The shesht and the full stop fix a *loanword's* stress; they don't help a
word the model has no reading for at all. The shipped clip is the least
bad of the multilingual_v2 arm and the reviewer called it "abysmal"; it is
a known weak clip, not a settled one. (That arm also came out ~11 dB
quieter than the v3 takes around it — peak −14.5 dB against −3.5 to 0 dB
for the rest of the deck — so the shipped clip carries `volume=8dB`, which
puts it at the quiet end of the deck rather than the middle; a full match
would have been a 12 dB lift, and "slightly" was the brief. Check
`volumedetect` on a clip from a different model before shipping it next
to v3 clips.) **Stop after two arms** on a word
like this and ask a native speaker for a recording, or accept the clip and
mark it here. Candidates for the same trouble: the other colloquial kin
terms (`Մորքուր`, `Հորքուր`, which did come out fine) and anything not in
a dictionary.

## A one-letter word: prompt the bare letter, no full stop

`Է` (the third-person "is") with the usual `Է։` prompt came out as a long,
aimless "eeeh" in all three v3 takes — with nothing to say, the model
stretched the vowel into a filler. Two takes of the bare letter `Է`, no
punctuation, on the same model gave a short, plain "eh"; the reviewer picked
one of those. Two `Է։` takes on `eleven_multilingual_v2` were also
generated as a control and not picked. So for a single-letter word, drop the
`։` — the "add the Armenian full stop" rule above exists to fix stress, and
a one-vowel word has no stress to fix.

## Adding audio for a new word

Do this every time a word is added to
[`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts),
whichever feature needed it. Ask Claude to do it, or follow the same steps
by hand:

1. Generate: `creative_generate_speech` with `prompt` = the word's exact
   `armenian` field value (capitalized, per Conventions §10) **followed by
   the Armenian full stop `։`, not a Latin period** (see "Stress on the
   wrong syllable" above) — **and words starting with a standalone "Ո" need
   the "Ո"→"Վ" prompt respelling above** — `model_id: "eleven_v3"`,
   `voice_id: B7DEF4tn54LpozCVN7ah` (Tereza jan — see "Voices and model"
   above; words always use the main voice), `generations_count` = the
   concurrency cap (three as of 2026-09-16 — see "Connector mechanics"),
   **one word per message** — takes vary run to run and nobody generating
   them can hear them, so give the human something to choose between (see
   "Reviewing takes" above).
2. Poll `creative_get_flow_run_status` with the returned `flow_id` +
   `session_ids` until `all_completed`, then take each `media[].url`.
3. Download every take, then run `scripts/audio/breath_trim.py` over the
   directory and transcode whatever it left alone with the exact `ffmpeg`
   command above — the human should audition the exact bytes that will
   ship. Save the `flow_id` and `session_ids` somewhere outside the
   scratchpad as you go: re-polling them mints fresh download URLs for
   free, and the scratchpad has been wiped mid-session before.
4. Get a human to listen and pick. For a batch, build the picker page
   described above; for a single word, four chips in any playable form will
   do. Do not skip this because generation succeeded.
5. Save the chosen take as `static/audio/words/<wordId>.m4a` — `wordId` is
   the word's `id` field. No code change needed beyond the library entry
   itself — [`wordAudioSrc()`](../src/lib/content/words/audio.ts) derives
   the path from the id.
6. Commit the `.m4a` file alongside the library change.

**Known constraint:** the ElevenLabs workspace's free tier hit a very low
daily generation cap in practice (a handful of generations/day) before it
was upgraded to a paid plan — if generation starts failing with a
`free_tier_...` rate-limit error, that's the workspace plan, not a bug here.

### Current coverage

As of 2026-09-21, **all 130 words in `entries.ts` have a clip** — every one
chosen by a human from the picker described above and passed through the
gap-based breath trim. The 89 up to 2026-09-10 (including the eighteen
bread-shop words) were picked from four takes each; the seventeen family
deck words and the seven pronouns deck words from three, the concurrency
cap having dropped to three. Two of the family words (`papik`, `keri`) had
a glued breath cut by hand, and `hopar` is the known weak clip described
above. The pronouns batch was uneventful: 21 takes, 8 with a trailing
breath the script cut, none re-rolled.

Six words — `em`, `chem`, `da`, `isk`, `te`, `kat` — were rejected on a first
pass as "low energy" and re-rolled at eight takes each, split into a plain arm
and a shesht arm (see the stress section above); their installed clips are
from that second round.

The eleven food deck words (2026-09-21) took four rounds. Seven were picked
from the first three takes; four were re-rolled at the reviewer's request,
and two of those needed more:

- `karag` (Կարագ) came out as "karev" in twelve v3 takes across three
  rounds, plain and with the shesht alike — the word is ~0.4 s of speech
  and the final -գ is barely released. The shipped clip is a shesht take
  from the fourth round, with a trailing gasp cut by hand (the word ends in
  a stop, so that's safe). **The gap-based trim missed that gasp**: a 3 ms
  tick — the -գ release — sat in the middle of the 130 ms gap, splitting it
  into two silences each under the 80 ms detection floor, so the inhale
  merged into the word as one loud segment. If a take keeps a gasp the
  script "kept", run `silencedetect` at `d=0.03` and look for exactly that.
- `agh` (Աղ) came out breathy and drawn out — "inappropriately suggestive"
  — in six takes of `Աղ։`. The bare `Աղ`, no full stop, gave short plain
  0.3–0.4 s takes on the first try, and one shipped. So the one-letter
  rule above (Է) also covers a one-syllable word ending in a voiced
  fricative: there's no stress to fix, and the stop only invites the
  model to linger.
- A `eleven_multilingual_v2` control arm was generated for both and
  rejected outright — see "Voices and model" for why it's a last resort.

Two more clips were redone on 2026-09-22, both noticed while listening to
the finished deck:

- `dzu` (Ձու) read as "zu": the engine dropped the d of the Ձ affricate in
  every plain take, old and new. Respelling the prompt `Դձու։` — the Ո into
  Վ trick applied to an affricate — did restore the d but as a separate
  letter, "d-zu". What was picked is a `Ձու՛։` shesht take. **A surgical
  arm worth remembering if a shesht ever fails here:** the same voice says
  the affricate correctly in Ձուկ, so three Ձուկ takes were cut at the dip
  before the final կ release (~0.26 s, 30 ms fade, 150 ms pad) to make a
  clean "dzu". It was not needed this time, but a word that is another
  word's first syllable can be borrowed that way.
- `tey` (Թեյ) had a small artifact glued to its end — the level decayed to
  −44 dB at 0.47 s and rose back to −24 dB by 0.55 s with no gap between,
  so the trim script saw one loud segment and kept it. Cut by hand at
  0.49 s; safe because Թեյ ends in the glide -յ, not a fricative. Same
  shape as `karag` above: **when a reviewer reports a gasp the script
  "kept", print the RMS tail and look for a rise after the decay**, not
  for a gap.
