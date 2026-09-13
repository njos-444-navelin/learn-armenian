"""Build the single-file review page a human auditions takes on — see
docs/VOCABULARY_AUDIO.md, "Reviewing takes". Every clip is inlined as a
data: URI so the page can be published as an Artifact with no external
requests. Styled on the app's own tokens.

    python3 scripts/audio/review_page.py spec.json out.html

spec.json:
{
  "title": "Bread Shop Re-record",            # the <title> — a name, not a caption
  "kicker": "bread-shop · full re-record",
  "heading": "…", "lede": "…",
  "sections": [
    {"heading": "Lines",
     "bulk": [{"label": "Dmitrii: read 1 everywhere", "match": "d", "value": "r1"}],   # optional
     "rows": [
       {"name": "l-01", "group": "d",              # radio group name; `group` is what bulk buttons match
        "title": "Բարև ձեզ։ Ես ուզում եմ հաց։", "sub": "Hello. I want bread.",
        "metrics": true,                            # run pitch.py on each option
        "context": ["l-00", "l-01", "l-02"],        # optional: play these rows' picks in order
        "options": [{"value": "r1", "label": "Read 1", "file": "…/01.m4a", "checked": true}, …]}
     ]}
  ]
}
A row with a single option and no radio use is fine too (reference clips).
"""
import base64
import html
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

CSS = """
:root{--bg:#f5ead8;--surface:#ebddc5;--own:#fdf3ea;--ink:#201e1d;--muted:#645c50;--sage:#56633f;--sage-soft:#e1eecc;--terra:#c67139;--line:rgb(32 30 29 / .16);--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--serif:"Noto Serif","Noto Serif Armenian",Georgia,serif;--hy:"Noto Serif Armenian","Noto Serif",serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#201e1d;--surface:#2d2926;--own:#332a24;--ink:#f5ead8;--muted:#b8ad9c;--sage:#aebf92;--sage-soft:#3d472b;--terra:#d98a52;--line:rgb(245 234 216 / .18)}}
:root[data-theme="dark"]{--bg:#201e1d;--surface:#2d2926;--own:#332a24;--ink:#f5ead8;--muted:#b8ad9c;--sage:#aebf92;--sage-soft:#3d472b;--terra:#d98a52;--line:rgb(245 234 216 / .18)}
body{background:var(--bg);color:var(--ink);font-family:var(--serif);font-size:16px;line-height:1.5}
main{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 8rem;display:flex;flex-direction:column;gap:2rem}
h1{font-size:1.6rem;font-weight:700;margin:0 0 .35rem;text-wrap:balance}
h2{font-size:1.1rem;font-weight:600;margin:0}
p{margin:0;max-width:65ch}.lede{color:var(--muted)}
.kicker{font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
section{display:flex;flex-direction:column;gap:.9rem}
.row{display:flex;flex-direction:column;gap:.5rem;padding:.9rem 1rem;border-radius:14px;background:var(--surface)}
.row.d{background:var(--own)}
.head{display:flex;flex-direction:column;gap:.15rem}.hy{font-family:var(--hy);font-size:1.15rem;font-weight:600}.head small{color:var(--muted)}
.opts{display:flex;flex-wrap:wrap;gap:.5rem}
.chip{display:inline-flex;align-items:center;gap:.5rem;padding:.3rem .8rem .3rem .45rem;border:1px solid var(--line);border-radius:999px;cursor:pointer;font-size:.9rem;position:relative}
.chip:has(input:checked){background:var(--sage-soft);border-color:var(--sage)}
.chip input{position:absolute;opacity:0;pointer-events:none}
.chip:has(input:focus-visible){outline:2px solid var(--terra);outline-offset:2px}
.pick{width:.95rem;height:.95rem;border-radius:50%;border:2px solid var(--muted);box-sizing:border-box;flex:none}
.chip:has(input:checked) .pick{border-color:var(--sage);background:radial-gradient(circle,var(--sage) 45%,transparent 50%)}
.play{display:grid;place-items:center;width:2.1rem;height:2.1rem;border-radius:50%;border:none;background:var(--terra);color:#201e1d;cursor:pointer;flex:none}
.play.on{background:var(--sage);color:var(--bg)}
.num{font-family:var(--mono);font-size:.75rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}.num.up{color:var(--sage);font-weight:700}
.bulk{display:flex;flex-wrap:wrap;gap:.5rem}
.bulk button{padding:.45rem .9rem;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-size:.85rem;cursor:pointer}
.bulk button:hover{background:var(--surface)}
footer{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--line)}
.bar{max-width:46rem;margin:0 auto;padding:.85rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.go{padding:.55rem 1rem;border-radius:999px;background:var(--sage);color:var(--bg);border:none;font:inherit;font-weight:600;display:inline-flex;align-items:center;gap:.5rem;cursor:pointer}
.status{font-family:var(--mono);font-size:.8rem;color:var(--muted);flex:1;min-width:12rem;word-break:break-all}.status b{color:var(--ink)}
"""

PLAY = ('<button type="button" class="play" data-src="{key}" aria-label="{label}"><svg viewBox="0 0 24 24" '
        'width="18" height="18" aria-hidden="true"><path d="M7 5v14l11-7z" fill="currentColor"/></svg></button>')

JS = """
const audio = new Audio(); let lit = null; let seqRun = 0;
function light(el){ if (lit) lit.classList.remove('on'); lit = el; if (el) el.classList.add('on'); }
document.querySelectorAll('[data-src]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); seqRun++; audio.onended = () => light(null); audio.src = SRC[b.dataset.src]; light(b); audio.play(); }));
const KEYS = {};
document.querySelectorAll('input[type=radio]').forEach(r => { KEYS[r.name + ':' + r.value] = r.closest('label').querySelector('[data-src]').dataset.src; });
function pickKey(name){ const v = document.querySelector(`input[name="${name}"]:checked`)?.value; return v === undefined ? null : KEYS[name + ':' + v]; }
const status = document.getElementById('status');
function summary(){ const p = NAMES.map(n => `${n}:${document.querySelector(`input[name="${n}"]:checked`)?.value ?? '·'}`); status.innerHTML = `picks <b>${p.join(' ')}</b>`; }
document.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', summary));
document.querySelectorAll('[data-bulk-match]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll(`input[data-group="${b.dataset.bulkMatch}"][value="${b.dataset.bulkValue}"]`).forEach(i => i.checked = true); summary(); }));
function playSeq(keys){ const run = ++seqRun; let i = 0; const next = () => { if (run !== seqRun) return; if (i >= keys.length) { light(null); return; } const key = keys[i++]; audio.onended = () => setTimeout(next, 400); audio.src = SRC[key]; light(document.querySelector(`[data-src="${key}"]`)); audio.play(); }; next(); }
document.querySelectorAll('[data-ctx]').forEach(b => b.addEventListener('click', () => playSeq(b.dataset.ctx.split(',').map(pickKey).filter(Boolean))));
document.getElementById('all')?.addEventListener('click', () => playSeq(ALL.map(pickKey).filter(Boolean)));
summary();
"""


def metrics(path):
    d = json.loads(subprocess.run([sys.executable, os.path.join(HERE, 'pitch.py'), path],
                                  capture_output=True, text=True, check=True).stdout)
    if 'error' in d:
        return ''
    t = d['terminal_st']
    arrow = ('↗ +' if t > 0.5 else '↘ ' if t < -0.5 else '→ ') + f'{t:.1f}'
    return (f'<span class="num">peak {d["peak_pos_pct"]}% +{d["prominence_st"]:.1f} st</span>'
            f'<span class="num {"up" if t > 0.5 else ""}">{arrow} st</span>')


def dur(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True, check=True).stdout)


def build(spec):
    src, names, all_rows, out = {}, [], [], []
    for sec in spec['sections']:
        out.append(f'<section><h2>{html.escape(sec["heading"])}</h2>')
        if sec.get('bulk'):
            out.append('<div class="bulk">' + ''.join(
                f'<button type="button" data-bulk-match="{b["match"]}" data-bulk-value="{b["value"]}">{html.escape(b["label"])}</button>'
                for b in sec['bulk']) + '</div>')
        for row in sec['rows']:
            name = row['name']
            names.append(name)
            if row.get('in_all', True):
                all_rows.append(name)
            chips = ''
            for i, opt in enumerate(row['options']):
                key = f'{name}:{opt["value"]}'
                src[key] = 'data:audio/mp4;base64,' + base64.b64encode(open(opt['file'], 'rb').read()).decode()
                m = metrics(opt['file']) if row.get('metrics') else ''
                chips += (f'<label class="chip"><input type="radio" name="{name}" value="{opt["value"]}" '
                          f'data-group="{row.get("group", "")}"{" checked" if opt.get("checked") else ""}>'
                          f'<span class="pick" aria-hidden="true"></span>{PLAY.format(key=key, label=html.escape(opt["label"]))}'
                          f'<span>{html.escape(opt["label"])}</span><span class="num">{dur(opt["file"]):.2f} s</span>{m}</label>')
            ctx = (f'<div class="bulk"><button type="button" data-ctx="{",".join(row["context"])}">▶ In context</button></div>'
                   if row.get('context') else '')
            out.append(f'<div class="row {row.get("group", "")}"><div class="head"><span class="kicker">{html.escape(row.get("kicker", name))}</span>'
                       f'<span class="hy" lang="hy">{html.escape(row.get("title", ""))}</span><small>{html.escape(row.get("sub", ""))}</small></div>'
                       f'<div class="opts">{chips}</div>{ctx}</div>')
        out.append('</section>')
    footer_btn = ('<button type="button" class="go" id="all"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">'
                  '<path d="M7 5v14l11-7z" fill="currentColor"/></svg> Play all picks in order</button>' if spec.get('play_all') else '')
    return (f'<title>{html.escape(spec["title"])}</title>\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Noto+Serif+Armenian:wght@400;600;700&display=swap">\n'
            f'<style>{CSS}</style>\n<main>\n<header><div class="kicker">{html.escape(spec.get("kicker", ""))}</div>'
            f'<h1>{html.escape(spec.get("heading", spec["title"]))}</h1><p class="lede">{html.escape(spec.get("lede", ""))}</p></header>\n'
            + '\n'.join(out) +
            f'\n</main>\n<footer><div class="bar">{footer_btn}<span class="status" id="status"></span></div></footer>\n'
            f'<script>\nconst SRC = {json.dumps(src)};\nconst NAMES = {json.dumps(names)};\nconst ALL = {json.dumps(all_rows)};\n{JS}</script>\n')


if __name__ == '__main__':
    spec = json.load(open(sys.argv[1], encoding='utf8'))
    page = build(spec)
    open(sys.argv[2], 'w', encoding='utf8').write(page)
    print(f'{len(page) // 1024} KB -> {sys.argv[2]}')
