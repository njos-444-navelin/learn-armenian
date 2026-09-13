"""Lift the tail pitch of a clip — a last resort for a question the voice
insists on reading with a fall (docs/DIALOGUES.md, "Third round"). Ramps
rubberband's pitch over the final `span` seconds before the voiced end,
ease-in so the rise is late and quick like speech, formants preserved.

    python3 scripts/audio/bend.py in.m4a out.m4a [rise_st=4] [span=0.28]
"""
import array
import math
import subprocess
import sys

SR = 24000


def voiced_end(path):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
        capture_output=True, check=True,
    ).stdout
    a = array.array('h')
    a.frombytes(raw)
    win, last = SR // 100, 0.0
    for i in range(0, len(a) - win, win):
        seg = a[i:i + win]
        rms = math.sqrt(sum(s * s for s in seg) / win) / 32768
        if 20 * math.log10(rms + 1e-9) > -38:
            last = (i + win) / SR
    return last


def bend(src, dst, rise_st=4.0, span=0.28, steps=14):
    t0 = voiced_end(src) - span
    cmds = []
    for k in range(steps + 1):
        semis = rise_st * (k / steps) ** 1.6
        cmds.append(f'{t0 + span * k / steps:.3f} rubberband pitch {2 ** (semis / 12):.4f}')
    af = f"asendcmd=c='{'; '.join(cmds)}',rubberband=pitch=1.0:pitchq=quality:formant=preserved"
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ac', '1', '-ar', str(SR),
         '-c:a', 'aac', '-b:a', '32k', '-movflags', '+faststart', dst],
        check=True,
    )


if __name__ == '__main__':
    bend(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 4.0,
         float(sys.argv[4]) if len(sys.argv) > 4 else 0.28)
