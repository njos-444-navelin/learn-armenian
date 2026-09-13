"""Crude but adequate F0 tracker for judging a question's contour — see
docs/DIALOGUES.md, "Questions read as statements". Normalized
autocorrelation on 30 ms windows every 10 ms; voiced when RMS > -38 dB and
the ACF peak is strong. Reports where the pitch peak sits (% of the voiced
span), its prominence over the line's median (st), the terminal movement
(last 220 ms median vs the rest, st), and the mean level.

    python3 scripts/audio/pitch.py clip.m4a [more.m4a ...]   # one JSON line each
"""
import json
import subprocess
import sys

import numpy as np

SR = 24000
FMIN, FMAX = 80, 450


def load(path):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def track(x):
    win, hop = int(0.03 * SR), int(0.01 * SR)
    lmin, lmax = SR // FMAX, SR // FMIN
    times, f0 = [], []
    for start in range(0, len(x) - win, hop):
        seg = x[start:start + win]
        rms = np.sqrt(np.mean(seg ** 2))
        times.append(start / SR)
        if 20 * np.log10(rms + 1e-9) < -38:
            f0.append(np.nan)
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, 'full')[win - 1:]
        ac = ac / (ac[0] + 1e-9)
        lag = lmin + int(np.argmax(ac[lmin:lmax]))
        f0.append(SR / lag if ac[lag] > 0.5 else np.nan)
    return np.array(times), np.array(f0)


def st(a, b):
    return 12 * np.log2(a / b)


def analyse(path):
    x = load(path)
    t, f = track(x)
    v = ~np.isnan(f)
    if v.sum() < 5:
        return {'file': path, 'error': 'unvoiced'}
    tv, fv = t[v], f[v]
    fs = np.array([np.median(fv[max(0, i - 2):i + 3]) for i in range(len(fv))])  # kills octave flips
    med = np.median(fs)
    i = int(np.argmax(fs))
    span = tv[-1] - tv[0]
    tail = fs[tv >= tv[-1] - 0.22]
    head = fs[tv < tv[-1] - 0.22]
    terminal = st(np.median(tail), np.median(head)) if len(head) and len(tail) else 0
    return {
        'file': path,
        'duration': round(len(x) / SR, 2),
        'voiced_span': round(float(span), 2),
        'peak_pos_pct': int(round((tv[i] - tv[0]) / span * 100)) if span > 0 else 0,
        'prominence_st': round(float(st(fs[i], med)), 1),
        'terminal_st': round(float(terminal), 1),
        'median_f0': int(med),
        'mean_db': round(float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)), 1),
    }


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(json.dumps(analyse(p)))
