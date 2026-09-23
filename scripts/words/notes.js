#!/usr/bin/env node
// @ts-check
/**
 * The word-comments review page — internal, local only. Lists every word in
 * the library with its translation and its two comments, in both languages,
 * as editable fields.
 *
 *     node scripts/words/notes.js          # then open http://localhost:4747
 *
 * `?deck=<id>` narrows the page to one deck's words, in the deck's order —
 * the view for drafting a new deck. See docs/WORDS.md.
 *
 * Saving edits just that entry's `translation`, `global` and `cardOnly` in
 * place, leaving every other byte of `entries.ts` alone. The file is then
 * re-imported so its load-time checks run over the result; if they throw, the
 * write is rolled back and the message shown on the card.
 */
import http from 'node:http';
import path from 'node:path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ENTRIES = path.join(ROOT, 'src/lib/content/words/entries.ts');
const DECKS = path.join(ROOT, 'src/lib/content/vocabulary/decks');
const PORT = Number(process.env['PORT'] ?? 4747);
/** The two optional comment blocks, in the order the file keeps them. */
const COMMENTS = /** @type {const} */ (['global', 'cardOnly']);

/**
 * @typedef {{ en: string; ru: string }} Translated
 * @typedef {{ id: string; armenian: string; translation: Translated; register?: string | undefined; global?: Translated | undefined; cardOnly?: Translated | undefined }} Word
 * @typedef {{ translation: Translated; global: Translated; cardOnly: Translated }} Fields
 */

// --- Reading -----------------------------------------------------------------

/**
 * Imports `entries.ts` afresh (the query string defeats the module cache),
 * which also runs its load-time checks.
 * @returns {Promise<readonly Word[]>}
 */
async function loadWords() {
	const url = `${pathToFileURL(ENTRIES).href}?t=${Date.now()}`;
	const module = /** @type {{ WORDS: readonly Word[] }} */ (await import(url));
	return module.WORDS;
}

/**
 * Every deck's ordered word ids, read by importing the deck files the same
 * way the app does.
 * @returns {Promise<Record<string, readonly string[]>>}
 */
async function loadDecks() {
	const files = (await readdir(DECKS)).filter((file) => file.endsWith('.ts'));
	const entries = await Promise.all(
		files.map(async (file) => {
			const url = `${pathToFileURL(path.join(DECKS, file)).href}?t=${Date.now()}`;
			const module = /** @type {{ WORD_IDS: readonly string[] }} */ (await import(url));
			return /** @type {const} */ ([file.slice(0, -'.ts'.length), module.WORD_IDS]);
		})
	);
	return Object.fromEntries(entries);
}

/**
 * The file's `// --- Section ---` comments, by word id, so the page can
 * group words the way the file does. Purely a reading aid.
 * @param {string} source
 * @returns {Map<string, string>}
 */
function sectionsById(source) {
	const sections = new Map();
	let current = '';
	for (const line of source.split('\n')) {
		const header = /^\t\/\/ --- (.*)$/.exec(line);
		if (header !== null) {
			current = (header[1] ?? '').replace(/ ---$/, '').split(/:| \(/)[0] ?? '';
			continue;
		}
		const id = /\bid: '([^']+)'/.exec(line);
		if (id !== null && id[1] !== undefined) sections.set(id[1], current);
	}
	return sections;
}

// --- Writing -----------------------------------------------------------------

/** @param {string} text */
function quote(text) {
	return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s*\n\s*/g, ' ')}'`;
}

/**
 * The index of the `}` closing the object literal that opens at `start`,
 * stepping over string literals and line comments so a brace inside a
 * comment can't fool the count.
 * @param {string} source
 * @param {number} start
 */
function objectEnd(source, start) {
	let depth = 0;
	for (let i = start; i < source.length; i++) {
		const char = source[i];
		if (char === "'") {
			for (i++; i < source.length && source[i] !== "'"; i++) if (source[i] === '\\') i++;
		} else if (char === '/' && source[i + 1] === '/') {
			i = source.indexOf('\n', i);
		} else if (char === '{') {
			depth++;
		} else if (char === '}' && --depth === 0) {
			return i;
		}
	}
	throw new Error('unbalanced braces');
}

const STRING = "'(?:[^'\\\\]|\\\\.)*'";
const ONE_LINE = new RegExp(
	`^\\{ id: (${STRING}), armenian: (${STRING}), translation: \\{ en: ${STRING}, ru: ${STRING} \\}(?:, register: (${STRING}))? \\}$`
);
const TRANSLATION = new RegExp(`translation: \\{ en: ${STRING}, ru: ${STRING} \\}`);

/**
 * Rewrites one word's translation and comments in the source text of
 * `entries.ts`.
 * @param {string} source
 * @param {string} id
 * @param {Fields} fields
 * @returns {string}
 */
function applyEdit(source, id, fields) {
	const marker = `id: '${id}'`;
	const at = source.indexOf(marker);
	if (at === -1 || at !== source.lastIndexOf(marker)) throw new Error(`word "${id}" not found once in entries.ts`);
	const start = source.lastIndexOf('{', at);
	const end = objectEnd(source, start);
	let object = source.slice(start, end + 1);

	const translationEn = fields.translation.en.trim();
	const translationRu = fields.translation.ru.trim();
	if (translationEn === '' || translationRu === '') throw new Error('translation: both languages are required');
	const translation = `translation: { en: ${quote(translationEn)}, ru: ${quote(translationRu)} }`;

	const addsComment = COMMENTS.some(
		(field) =>
			(fields[field].en.trim() !== '' || fields[field].ru.trim() !== '') &&
			!object.includes(`\n\t\t${field}: {`)
	);
	if (!object.includes('\n') && addsComment) {
		const parts = ONE_LINE.exec(object);
		if (parts === null) throw new Error(`word "${id}": one-line entry has an unexpected shape`);
		const [, wordId, armenian, register] = parts;
		object =
			`{\n\t\tid: ${wordId},\n\t\tarmenian: ${armenian},\n\t\t${translation}` +
			(register === undefined ? '' : `,\n\t\tregister: ${register}`) +
			'\n\t}';
	}
	if (!TRANSLATION.test(object)) throw new Error(`word "${id}": entry has an unexpected shape`);
	object = object.replace(TRANSLATION, translation);

	/**
	 * A comment block — either language on its own, or both. A comment may be
	 * written for one reader only (`PartiallyTranslated`).
	 * @param {'global' | 'cardOnly'} field
	 */
	const blockOf = (field) =>
		new RegExp(
			`\\n((?:\\t\\t//[^\\n]*\\n)*)\\t\\t${field}: \\{\\n\\t\\t\\t(?:en: ${STRING}(?:,\\n\\t\\t\\tru: ${STRING})?|ru: ${STRING})\\n\\t\\t\\}`
		).exec(object);

	for (const field of COMMENTS) {
		const en = fields[field].en.trim();
		const ru = fields[field].ru.trim();
		// One language on its own is allowed and meant (docs/DIALOGUES.md,
		// "Word comments", rule 12). Emptying both removes the comment.
		const langs = [];
		if (en !== '') langs.push(`en: ${quote(en)}`);
		if (ru !== '') langs.push(`ru: ${quote(ru)}`);
		const wanted = langs.length === 0 ? null : `${field}: {\n\t\t\t${langs.join(',\n\t\t\t')}\n\t\t}`;
		const existing = blockOf(field);

		if (existing !== null && wanted !== null) {
			const comments = existing[1] ?? '';
			object = object.slice(0, existing.index) + `\n${comments}\t\t${wanted}` + object.slice(existing.index + existing[0].length);
		} else if (existing !== null) {
			// Drop the block and the comma that ended the property before it.
			const from = object[existing.index - 1] === ',' ? existing.index - 1 : existing.index;
			object = object.slice(0, from) + object.slice(existing.index + existing[0].length);
		} else if (wanted !== null) {
			if (!object.endsWith('\n\t}')) throw new Error(`word "${id}": entry has an unexpected shape`);
			// `global` goes before `cardOnly`, matching the file's ordering.
			const next = field === 'global' ? blockOf('cardOnly') : null;
			object =
				next === null
					? `${object.slice(0, -3)},\n\t\t${wanted}\n\t}`
					: `${object.slice(0, next.index)}\n\t\t${wanted},${object.slice(next.index)}`;
		}
	}

	return source.slice(0, start) + object + source.slice(end + 1);
}

// --- Server ------------------------------------------------------------------

/** @param {http.IncomingMessage} request */
function readBody(request) {
	return new Promise((resolve, reject) => {
		let body = '';
		request.setEncoding('utf8');
		request.on('data', (chunk) => (body += chunk));
		request.on('end', () => resolve(body));
		request.on('error', reject);
	});
}

/**
 * @param {http.ServerResponse} response
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson(response, status, payload) {
	response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
	response.end(JSON.stringify(payload));
}

async function wordsPayload() {
	const [words, source] = await Promise.all([loadWords(), readFile(ENTRIES, 'utf8')]);
	const sections = sectionsById(source);
	return words.map((word) => ({ ...word, section: sections.get(word.id) ?? '' }));
}

const server = http.createServer(async (request, response) => {
	try {
		const { pathname } = new URL(request.url ?? '/', 'http://localhost');
		if (request.method === 'GET' && pathname === '/') {
			response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
			response.end(PAGE);
		} else if (request.method === 'GET' && pathname === '/api/words') {
			sendJson(response, 200, await wordsPayload());
		} else if (request.method === 'GET' && pathname === '/api/decks') {
			sendJson(response, 200, await loadDecks());
		} else if (request.method === 'POST' && request.url === '/api/save') {
			const { id, translation, global, cardOnly } = JSON.parse(await readBody(request));
			const before = await readFile(ENTRIES, 'utf8');
			const after = applyEdit(before, id, { translation, global, cardOnly });
			if (after !== before) {
				await writeFile(ENTRIES, after);
				try {
					await loadWords();
				} catch (error) {
					await writeFile(ENTRIES, before);
					throw error;
				}
			}
			const word = (await wordsPayload()).find((candidate) => candidate.id === id);
			sendJson(response, 200, word);
		} else {
			response.writeHead(404).end();
		}
	} catch (error) {
		sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
	}
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`Word comments: http://localhost:${PORT}  (editing ${path.relative(ROOT, ENTRIES)})`);
});

// --- Page --------------------------------------------------------------------

const PAGE = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Word comments</title>
<style>
:root{--bg:#f5ead8;--surface:#ebddc5;--field:#fdf3ea;--ink:#201e1d;--muted:#645c50;--sage:#56633f;--sage-soft:#e1eecc;--terra:#c67139;--line:rgb(32 30 29 / .16);--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--serif:"Noto Serif","Noto Serif Armenian",Georgia,serif;--hy:"Noto Serif Armenian","Noto Serif",serif}
@media (prefers-color-scheme: dark){:root{--bg:#201e1d;--surface:#2d2926;--field:#332a24;--ink:#f5ead8;--muted:#b8ad9c;--sage:#aebf92;--sage-soft:#3d472b;--terra:#d98a52;--line:rgb(245 234 216 / .18)}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--serif);font-size:15px;line-height:1.45}
main{max-width:64rem;margin:0 auto;padding:2rem 1.25rem 3rem;display:flex;flex-direction:column;gap:1.5rem}
h1{font-size:1.5rem;margin:0}
h2{font-size:.75rem;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:1.5rem 0 0;font-weight:600}
p{margin:0;max-width:70ch;color:var(--muted)}
.bar{position:sticky;top:0;z-index:1;background:var(--bg);padding:.75rem 0;display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;border-bottom:1px solid var(--line)}
.bar input[type=search]{flex:1 1 14rem;min-width:0;padding:.45rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--field);color:inherit;font:inherit}
.bar label{display:inline-flex;gap:.4rem;align-items:center;font-size:.9rem;color:var(--muted);cursor:pointer}
.count{font-family:var(--mono);font-size:.75rem;color:var(--muted);white-space:nowrap}
.count b{color:var(--terra)}
.card{display:flex;flex-direction:column;gap:.6rem;padding:.9rem 1rem 1rem;border-radius:14px;background:var(--surface)}
.card.dirty{outline:2px solid var(--terra)}
.head{display:flex;flex-wrap:wrap;gap:.25rem .75rem;align-items:baseline}
.hy{font-family:var(--hy);font-size:1.25rem;font-weight:600}
.reg{font-style:italic;color:var(--sage);font-size:.85rem}
.id{font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-left:auto}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:.6rem .8rem}
@media (max-width:40rem){.fields{grid-template-columns:1fr}}
.field{display:flex;flex-direction:column;gap:.2rem}
.field span{font-family:var(--mono);font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
textarea,input.text{width:100%;padding:.45rem .6rem;border:1px solid var(--line);border-radius:8px;background:var(--field);color:inherit;font:inherit;line-height:1.4}
textarea{min-height:2.6rem;resize:none;overflow:hidden}
textarea:focus,input.text:focus{outline:2px solid var(--sage);outline-offset:1px;border-color:transparent}
.changed{border-color:var(--terra)}
.foot{display:flex;gap:.6rem;align-items:center;min-height:1.6rem}
button{font:inherit;font-size:.85rem;padding:.3rem .9rem;border-radius:999px;border:1px solid var(--line);background:var(--field);color:inherit;cursor:pointer}
button.save{background:var(--sage);color:var(--bg);border-color:transparent;font-weight:600}
button:disabled{opacity:.45;cursor:default}
.msg{font-size:.85rem;color:var(--muted)}
.msg.err{color:var(--terra)}
.hint{font-size:.82rem}
.hint code{font-family:var(--mono);font-size:.78rem}
.hint a{color:var(--sage)}
.hint .err{color:var(--terra)}
kbd{font-family:var(--mono);font-size:.75rem;border:1px solid var(--line);border-radius:4px;padding:0 .3rem}
.bottom{display:flex;gap:.75rem;align-items:center;padding:1.25rem 0 3rem;border-top:1px solid var(--line)}
.bottom button{font-size:.95rem;padding:.45rem 1.2rem}
</style>
</head>
<body>
<main>
	<div>
		<h1>Word comments</h1>
		<p class="hint" id="deckHint" hidden>Showing one deck’s words in the deck’s order — the whole library is at <a href="/">/</a>. A word the deck lists but the library lacks is named below in red.</p>
		<p class="hint">Every library word with its translation and its two comments: <code>global</code> shows everywhere — cards and dialogue popovers — and never quotes a phrase; <code>card-only</code> shows on the card and in the trainer only, and may quote the phrase. Either may be left in one language, when the fact is worth stating to one reader and not the other — the other then sees no comment at all. Edits save into <code>entries.ts</code> and go through its own checks. <kbd>Ctrl</kbd>+<kbd>S</kbd> saves everything changed. Rules: docs/DIALOGUES.md, “Word comments”.</p>
	</div>
	<div class="bar">
		<input id="q" type="search" placeholder="Filter — Armenian, translation, id, or comment text" autocomplete="off">
		<label><input id="only" type="checkbox" checked> Only words with a comment</label>
		<span class="count" id="count"></span>
	</div>
	<div id="list"></div>
	<div class="bottom">
		<button id="saveAll" class="save" disabled>Save all</button>
		<span class="msg" id="saveAllMsg"></span>
	</div>
</main>
<script>
const COMMENTS = ['global', 'cardOnly'];
const FIELDS = ['translation', ...COMMENTS];
const LABELS = { translation: 'translation', global: 'global', cardOnly: 'card-only' };
const LANGS = ['en', 'ru'];
/** @type {any[]} */
let words = [];
let shown = 0;
const drafts = new Map();
// ?deck=<id>: show only that deck's words, in its order (see docs/WORDS.md).
const deck = new URLSearchParams(location.search).get('deck');

const $ = (sel, el = document) => el.querySelector(sel);
const list = $('#list'), q = $('#q'), only = $('#only'), count = $('#count'), saveAllButton = $('#saveAll'), saveAllMsg = $('#saveAllMsg');

const text = (w, f, l) => (w[f] && w[f][l]) || '';
const draftOf = (w) => {
	if (!drafts.has(w.id)) drafts.set(w.id, Object.fromEntries(FIELDS.map((f) => [f, Object.fromEntries(LANGS.map((l) => [l, text(w, f, l)]))])));
	return drafts.get(w.id);
};
const isDirty = (w) => FIELDS.some((f) => LANGS.some((l) => draftOf(w)[f][l].trim() !== text(w, f, l)));
const hasComment = (w) => COMMENTS.some((f) => w[f]);
const matches = (w, needle) =>
	!needle || [w.id, w.armenian, ...FIELDS.flatMap((f) => LANGS.map((l) => text(w, f, l)))].some((s) => s.toLowerCase().includes(needle));

function grow(ta) { if (ta.tagName === 'TEXTAREA') { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; } }

function render() {
	const needle = q.value.trim().toLowerCase();
	const visible = words.filter((w) => (isDirty(w) || !only.checked || hasComment(w)) && matches(w, needle));
	shown = visible.length;
	list.replaceChildren();
	let section = null;
	for (const w of visible) {
		if (w.section !== section) {
			section = w.section;
			const h = document.createElement('h2');
			h.textContent = section || 'Other';
			list.append(h);
		}
		list.append(card(w));
	}
	updateCounts();
	requestAnimationFrame(() => list.querySelectorAll('textarea').forEach(grow));
}

function updateCounts() {
	const dirty = words.filter(isDirty).length;
	// One-language comments are deliberate, but a half-written one looks the
	// same in the file — so they are counted here, where an accidental one
	// stands out after a save.
	const oneLang = words.filter((w) => COMMENTS.some((f) => w[f] && !w[f].en !== !w[f].ru)).length;
	count.innerHTML = words.length + ' words · ' + words.filter(hasComment).length + ' with a comment · ' +
		(oneLang ? oneLang + ' in one language · ' : '') + shown + ' shown' + (dirty ? ' · <b>' + dirty + ' unsaved</b>' : '');
	saveAllButton.disabled = dirty === 0;
	saveAllButton.textContent = dirty ? 'Save all (' + dirty + ')' : 'Save all';
}

function card(w) {
	const d = draftOf(w);
	const el = document.createElement('article');
	el.className = 'card';
	el.dataset.id = w.id;
	el.innerHTML =
		'<div class="head"><span class="hy"></span>' +
		(w.register ? '<span class="reg">' + (w.register === 'formal' ? 'fml.' : 'inf.') + '</span>' : '') +
		'<span class="id"></span></div><div class="fields"></div>' +
		'<div class="foot"><button class="save" disabled>Save</button><button class="revert" disabled>Revert</button><span class="msg"></span></div>';
	$('.hy', el).textContent = w.armenian;
	$('.id', el).textContent = w.id;
	const fields = $('.fields', el);
	for (const f of FIELDS) for (const l of LANGS) {
		const wrap = document.createElement('label');
		wrap.className = 'field';
		const label = document.createElement('span');
		label.textContent = LABELS[f] + ' · ' + l;
		const input = document.createElement(f === 'translation' ? 'input' : 'textarea');
		if (f === 'translation') { input.type = 'text'; input.className = 'text'; } else { input.rows = 1; }
		input.value = d[f][l];
		input.lang = l;
		input.spellcheck = true;
		input.classList.toggle('changed', d[f][l].trim() !== text(w, f, l));
		input.addEventListener('input', () => {
			d[f][l] = input.value;
			input.classList.toggle('changed', input.value.trim() !== text(w, f, l));
			grow(input);
			refresh(el, w);
		});
		wrap.append(label, input);
		fields.append(wrap);
	}
	$('.save', el).addEventListener('click', () => save(w, el));
	$('.revert', el).addEventListener('click', () => { drafts.delete(w.id); render(); });
	refresh(el, w);
	return el;
}

function refresh(el, w) {
	const dirty = isDirty(w);
	el.classList.toggle('dirty', dirty);
	$('.save', el).disabled = !dirty;
	$('.revert', el).disabled = !dirty;
	updateCounts();
}

async function save(w, el) {
	const msg = $('.msg', el);
	msg.className = 'msg';
	msg.textContent = 'Saving…';
	const d = draftOf(w);
	const res = await fetch('/api/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: w.id, ...d }) });
	const body = await res.json();
	if (!res.ok) {
		msg.className = 'msg err';
		msg.textContent = body.error;
		return false;
	}
	Object.assign(w, { global: undefined, cardOnly: undefined }, body);
	drafts.delete(w.id);
	render();
	const fresh = list.querySelector('[data-id="' + w.id + '"] .msg');
	if (fresh) fresh.textContent = 'Saved';
	return true;
}

async function saveAll() {
	saveAllMsg.className = 'msg';
	saveAllMsg.textContent = '';
	let saved = 0, failed = 0;
	for (const w of words.filter(isDirty)) {
		const el = list.querySelector('[data-id="' + w.id + '"]');
		if (!el) continue;
		if (await save(w, el)) saved++; else failed++;
	}
	saveAllMsg.className = failed ? 'msg err' : 'msg';
	saveAllMsg.textContent = 'Saved ' + saved + (failed ? ' · ' + failed + ' failed — see the cards' : '');
}

q.addEventListener('input', render);
only.addEventListener('change', render);
saveAllButton.addEventListener('click', saveAll);
document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveAll(); }
});
window.addEventListener('beforeunload', (e) => { if (words.some(isDirty)) e.preventDefault(); });

async function load() {
	words = await fetch('/api/words').then((r) => r.json());
	if (deck) {
		const decks = await fetch('/api/decks').then((r) => r.json());
		const ids = decks[deck];
		const hint = $('#deckHint');
		hint.hidden = false;
		if (!ids) {
			hint.innerHTML = 'No deck <code></code> under <code>src/lib/content/vocabulary/decks/</code> — known: <code></code>. The whole library is at <a href="/">/</a>.';
			hint.querySelectorAll('code')[0].textContent = deck;
			hint.querySelectorAll('code')[1].textContent = Object.keys(decks).sort().join(', ');
			words = [];
		} else {
			const byId = new Map(words.map((w) => [w.id, w]));
			const missing = ids.filter((id) => !byId.has(id));
			words = ids.filter((id) => byId.has(id)).map((id) => ({ ...byId.get(id), section: 'Deck: ' + deck }));
			if (missing.length) {
				const err = document.createElement('span');
				err.className = 'err';
				err.textContent = ' Not in the library: ' + missing.join(', ') + '.';
				hint.append(err);
			}
			only.checked = false;
			document.title = 'Word comments · ' + deck;
		}
	}
	render();
}
load();
</script>
</body>
</html>
`;
