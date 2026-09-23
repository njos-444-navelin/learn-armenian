"""The gap-based breath trim from docs/VOCABULARY_AUDIO.md, "The breath at the
end", as a batch pass over new takes.

    python3 scripts/audio/breath_trim.py <mp3_dir> <m4a_dir>

A trailing blip after a real gap is cut and the result written in the app's
encoding; re-applied while one remains, since a take with two breaths is the
same shape twice. The guards below each keep the clip whole — `Տուն`'s soft
initial consonant once read as a blip. A clip the rule leaves alone isn't
written; transcode those with the plain ffmpeg command.

The automatic pass only. A "glued" breath that never drops below the gate is
fixed by hand — see the doc.
"""
import glob
import os
import re
import subprocess
import sys

ENCODE = ['-ac', '1', '-ar', '24000', '-c:a', 'aac', '-b:a', '32k', '-movflags', '+faststart']


def segments(path):
    """Loud segments of `path` as (start, end) pairs, and its duration."""
    log = subprocess.run(
        ['ffmpeg', '-v', 'info', '-i', path, '-af', 'silencedetect=noise=-40dB:d=0.08', '-f', 'null', '-'],
        capture_output=True, text=True,
    ).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', log).groups()
    duration = int(h) * 3600 + int(m) * 60 + float(s)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    loud, t = [], 0.0
    for start, end in zip(starts, ends + [duration]):
        if start > t:
            loud.append((t, start))
        t = end
    if t < duration:
        loud.append((t, duration))
    return loud, duration


def cut_point(segs):
    """Where to cut, or None to keep the clip whole."""
    total = sum(e - s for s, e in segs)
    kept = list(segs)
    while len(kept) >= 2:
        (_, prev_end), (blip_start, blip_end) = kept[-2], kept[-1]
        blip, gap = blip_end - blip_start, blip_start - prev_end
        remaining = sum(e - s for s, e in kept[:-1])
        if blip < 0.45 and gap >= 0.08 and prev_end >= 0.25 and blip < prev_end and remaining >= 0.4 * total:
            kept.pop()
        else:
            break
    return None if len(kept) == len(segs) else kept[-1][1] + 0.06


def main(mp3_dir, m4a_dir):
    os.makedirs(m4a_dir, exist_ok=True)
    for mp3 in sorted(glob.glob(os.path.join(mp3_dir, '*.mp3'))):
        name = os.path.basename(mp3)[:-4]
        segs, duration = segments(mp3)
        cut = cut_point(segs)
        if cut is None:
            print(f'{name:14} kept   {duration:.2f} s')
            continue
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-af', f'atrim=0:{cut:.3f},afade=t=out:st={cut - 0.05:.3f}:d=0.05',
             *ENCODE, os.path.join(m4a_dir, f'{name}.m4a')],
            check=True,
        )
        print(f'{name:14} cut    {duration:.2f} s -> {cut:.2f} s  ({len(segs) - 1} trailing blip(s) after {segs[0][1]:.2f} s)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
