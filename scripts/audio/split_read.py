"""Cut a speaker's whole-part read into line clips — the recipe in
docs/DIALOGUES.md, "Record each speaker's whole part in ONE generation".

    python3 scripts/audio/split_read.py <lines.json> <read.mp3> <out_dir> <target_db>

<lines.json> is a list of [lineNumber, spokenText, shippedClipOrNull], where the
shipped clip is used only for its duration.

Which of the detected gaps are line boundaries is found by brute force against
expected line lengths, scored by per-segment relative error. One gain is applied
to the whole read, so the speaker's lines land at their shipped mean level.
"""
import itertools
import json
import os
import re
import subprocess
import sys

import numpy as np


def dur(path):
    return float(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
        capture_output=True, text=True, check=True,
    ).stdout)


def gaps(path):
    out = subprocess.run(
        ['ffmpeg', '-i', path, '-af', 'silencedetect=noise=-40dB:d=0.06', '-f', 'null', '-'],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    merged = []
    for s, e in zip(starts, ends):
        if merged and s - merged[-1][1] < 0.05:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return merged


def letters(text):
    return sum(ch.isalpha() for ch in text)


def expected_lengths(lines):
    # A line's length is roughly a fixed overhead plus so much per letter —
    # a two-word question like "Իսկ մի՞ս?" takes ~0.9 s, not the 0.5 s that
    # letters alone predict — so fit intercept + slope on the known lines
    # (falling back to proportional if there are too few to fit).
    known = [(letters(t), dur(c)) for _, t, c in lines if c]
    if len(known) >= 3:
        a, b = np.polyfit([n for n, _ in known], [d for _, d in known], 1)
        b = max(b, 0.2)
        estimate = lambda t: b + a * letters(t)  # noqa: E731
    else:
        spl = sum(d for _, d in known) / sum(n for n, _ in known)
        estimate = lambda t: letters(t) * spl  # noqa: E731
    return [dur(c) if c else estimate(t) for _, t, c in lines]


def fit(path, lines):
    total = dur(path)
    g = gaps(path)
    interior = [(s, e) for s, e in g if s > 0.2 and e < total - 0.2]
    lead = g[0][1] if g and g[0][0] < 0.05 else 0.0
    tail = g[-1][0] if g and g[-1][1] > total - 0.05 else total
    exp0 = np.array(expected_lengths(lines))
    n = len(lines)
    two_sentence = [k for k, (_, t, _) in enumerate(lines) if t.count('։') + t.count('?') >= 2]
    best = None
    for combo in itertools.combinations(range(len(interior)), n - 1):
        # Segments are speech-only (previous pause end -> this pause start),
        # and the expectations are stretched to the read's *speech* time,
        # excluding the chosen pauses. Measuring mid-pause to mid-pause
        # instead made a 0.5 s line between two long pauses look like 1.1 s.
        starts = [lead] + [interior[i][1] for i in combo]
        ends = [interior[i][0] for i in combo] + [tail]
        segs = np.array(ends) - np.array(starts)
        exp = exp0 * segs.sum() / exp0.sum()
        if np.any(np.abs(segs - exp) / exp > 0.45):
            continue
        mids = np.array([(interior[i][0] + interior[i][1]) / 2 for i in combo])
        bounds = [lead, *mids, tail]
        chosen = set(combo)
        if any(not [i for i, (gs, ge) in enumerate(interior)
                    if i not in chosen and gs > bounds[k] and ge < bounds[k + 1]]
               for k in two_sentence):
            continue
        err = float(np.sqrt(np.mean(((segs - exp) / exp) ** 2)))
        if best is None or err < best[0]:
            best = (err, combo)
    if best is None:
        raise SystemExit(f'{path}: no gap combination within 45% of the expected lengths')
    err, combo = best
    cuts, prev_end = [], lead
    for k, i in enumerate([*combo, None]):
        if i is None:
            start, end = prev_end, tail
        else:
            start, end = prev_end, interior[i][0]
            prev_end = interior[i][1]
        cuts.append({'line': lines[k][0], 'start': round(start, 3), 'end': round(end, 3),
                     'len': round(end - start, 2), 'expected': round(float(exp[k]), 2)})
    return err, cuts


def mean_db(path):
    out = subprocess.run(['ffmpeg', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float(re.search(r'mean_volume: ([-\d.]+)', out).group(1))


def cut(path, cuts, out_dir, target_db):
    os.makedirs(out_dir, exist_ok=True)
    gain = round(target_db - mean_db(path), 1)
    for c in cuts:
        st, en = max(0.0, c['start'] - 0.04), c['end'] + 0.08
        af = (f'atrim={st:.3f}:{en:.3f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.02,'
              f'afade=t=out:st={en - st - 0.05:.3f}:d=0.05,volume={gain}dB')
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', path, '-af', af, '-ac', '1', '-ar', '24000',
             '-c:a', 'aac', '-b:a', '32k', '-movflags', '+faststart',
             os.path.join(out_dir, f"{c['line']:02d}.m4a")],
            check=True,
        )
    return gain


if __name__ == '__main__':
    lines_path, read, out_dir, target = sys.argv[1:5]
    lines = json.load(open(lines_path, encoding='utf8'))
    err, cuts = fit(read, lines)
    gain = cut(read, cuts, out_dir, float(target))
    print(json.dumps({'read': read, 'rel_rms': round(err, 3), 'gain_db': gain, 'cuts': cuts}, ensure_ascii=False))
