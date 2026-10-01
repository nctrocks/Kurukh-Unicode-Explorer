"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BookOpen, Braces, Check, Copy, Grid2X2, Info, LockKeyhole, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { characters, formatCP, inspectText, SAMPLE, searchCharacters, type Filter } from "@/lib/unicode";
type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
type ModelContext = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };
const SOURCE = "https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt";
const CHART = "https://www.unicode.org/charts/PDF/Unicode-17.0/U170-11DB0.pdf";
const SPEC = "https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-13/";

export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState(characters[0]);
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(200);
  const [copied, setCopied] = useState<number | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [fontError, setFontError] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const results = useMemo(() => searchCharacters(query, filter), [query, filter]);
  const inspection = useMemo(() => inspectText(text), [text]);
  const assignedCount = inspection.filter(c => c.status === "Tolong Siki").length;
  const unassignedCount = inspection.filter(c => c.status === "Unassigned").length;
  const outsideCount = inspection.length - assignedCount - unassignedCount;
  useEffect(() => {
    let active = true;
    document.fonts.load('32px "Tolong Explorer"', String.fromCodePoint(0x11db0)).then(fonts => { if (active) { setFontReady(fonts.length > 0); setFontError(fonts.length === 0); } }).catch(() => { if (active) setFontError(true); });
    return () => { active = false; if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const inputString = (input: unknown, field: string, max: number) => {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object.");
      const value = (input as Record<string, unknown>)[field];
      if (Object.keys(input).some(key => key !== field) || typeof value !== "string" || value.length > max) throw new Error(`Expected ${field} as a string of at most ${max} UTF-16 units.`);
      return value;
    };
    const tools: Tool[] = [
      { name: "search_tolong_siki", title: "Search Tolong Siki", description: "Search the Unicode 17.0 grid by official name, code point, or character and display matching positions.", inputSchema: { type: "object", properties: { query: { type: "string", maxLength: 200 } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { const q = inputString(input, "query", 200); flushSync(() => { setQuery(q); setFilter("all"); }); return { results: searchCharacters(q).map(c => ({ codePoint: formatCP(c.cp), name: c.name, assigned: c.assigned })) }; } },
      { name: "inspect_tolong_siki_text", title: "Inspect Unicode text", description: "Replace playground text and inspect Unicode code points, including shared marks and unassigned positions. Text stays in the page.", inputSchema: { type: "object", properties: { text: { type: "string", maxLength: 10000 } }, required: ["text"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute(input) { const value = inputString(input, "text", 10000); flushSync(() => { setText(value); setLimit(200); }); return { codePoints: inspectText(value).map(c => ({ position: c.position, codePoint: c.codePoint, name: c.name, status: c.status })), utf16Units: value.length }; } },
    ];
    for (const tool of tools) { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {} }
    return () => lifecycle.abort();
  }, []);
  async function copy(value: string, label: string, cp?: number) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const active = document.activeElement as HTMLElement | null;
        const area = document.createElement("textarea"); area.value = value; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.select();
        const success = document.execCommand("copy"); area.remove(); active?.focus(); if (!success) throw new Error("Clipboard unavailable");
      }
      toast.success(`${label} copied`);
      if (cp !== undefined) { setCopied(cp); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(null), 1800); }
    } catch { toast.error("Copy was blocked. Select the text and use your device’s copy command."); }
  }
  function insertSelected() {
    if (!selected.assigned) return;
    const value = String.fromCodePoint(selected.cp), start = editor.current?.selectionStart ?? text.length, end = editor.current?.selectionEnd ?? text.length;
    if (text.length - (end - start) + value.length > 10000) { toast.error("The playground limit is 10,000 UTF-16 units."); return; }
    flushSync(() => { setText(text.slice(0, start) + value + text.slice(end)); setLimit(200); });
    editor.current?.focus(); editor.current?.setSelectionRange(start + value.length, start + value.length);
  }
  return <>
    <Toaster theme="light" position="bottom-right" />
    <a href="#explorer" className="skip-link">Skip to explorer</a>
    <header className="site-header"><a className="brand" href="#explorer" aria-label="Kurukh Unicode Explorer home"><span className="brand-mark"><Grid2X2 size={21} /></span><span>Kurukh<span className="brand-light"> / Unicode Explorer</span></span></a><nav aria-label="Page sections"><a href="#explorer">Explorer</a><a href="#playground">Playground</a><a href="#why-it-matters">About the encoding</a></nav><span className="private-badge"><LockKeyhole size={13} /> Private workspace</span></header>
    <main>
      <section className="intro" aria-labelledby="title"><div><div className="eyebrow">KURUKH LANGUAGE TECHNOLOGY <span>/</span> UNICODE 17.0</div><h1 id="title">Tolong Siki <span className="title-light">character lab</span></h1><p>Explore the script. See the code behind every character.</p></div><a className="source-link" href={CHART} target="_blank" rel="noreferrer"><BookOpen size={16} /> Official Unicode chart</a></section>
      <div className="workspace">
        <section className="explorer-panel" id="explorer" aria-labelledby="grid-title">
          <div className="panel-heading"><div className="heading-with-icon"><Grid2X2 size={18} /><h2 id="grid-title">Character explorer</h2></div><span className="version-label">17.0.0</span></div>
          <div className="block-summary"><code>U+11DB0–U+11DEF</code><span><b>54</b> assigned <span className="summary-separator">/</span> <b>10</b> unassigned</span></div>
          <div className="search-wrap"><Search size={18} /><Input id="character-search" aria-label="Search character names or code points" placeholder="Search a name or code point, e.g. LETTER K or U+11DCA" value={query} maxLength={200} onChange={e => setQuery(e.target.value)} />{query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}</div>
          <div className="filter-row"><RadioGroup value={filter} onValueChange={v => setFilter(v as Filter)} className="filters" aria-label="Character assignment filter">{([["all", "All", 64], ["assigned", "Assigned", 54], ["unassigned", "Unassigned", 10]] as const).map(([value, label, count]) => <label key={value} className={filter === value ? "filter active" : "filter"}><RadioGroupItem value={value} aria-label={label} /><span>{label}</span><span className="filter-count">{count}</span></label>)}</RadioGroup><span className="result-count" aria-live="polite">{results.length} positions</span></div>
          <div className="grid-guide"><span><span className="legend-swatch" /> Assigned · click to copy</span><span><span className="legend-swatch unassigned-swatch" /> Unassigned · inspect only</span></div>
          <div className="character-grid" aria-label="Tolong Siki characters in code point order">{results.map(c => <button key={c.cp} className={`character-card ${!c.assigned ? "unassigned-card" : ""} ${selected.cp === c.cp ? "selected-card" : ""} ${copied === c.cp ? "copied-card" : ""}`} data-cp={formatCP(c.cp)} aria-pressed={selected.cp === c.cp} aria-label={`${c.name}, ${formatCP(c.cp)}${c.assigned ? ", copy character" : ", inspect unassigned position"}`} title={`${formatCP(c.cp)} · ${c.name}`} onClick={() => { setSelected(c); if(c.assigned) void copy(String.fromCodePoint(c.cp), formatCP(c.cp), c.cp); }}><span className="card-code">{formatCP(c.cp).slice(2)}</span><span className={`card-glyph ${c.assigned ? "tolong" : ""}`} aria-hidden="true">{copied === c.cp ? <Check size={27} /> : c.assigned ? String.fromCodePoint(c.cp) : "—"}</span><span className="card-name">{c.short}</span></button>)}</div>
          {results.length === 0 && <div className="no-results"><Search size={26} /><h3>No matching characters</h3><p>Try SELA, a code point like 11DB0, or another assignment filter.</p><button className="secondary-button" onClick={() => { setQuery(""); setFilter("all"); }}>Reset search and filters</button></div>}
          <div className="character-detail" aria-live="polite"><div className="detail-glyph tolong" aria-hidden="true">{selected.assigned ? String.fromCodePoint(selected.cp) : "—"}</div><div className="detail-content"><div className="detail-meta"><code>{formatCP(selected.cp)}</code><span className={`status ${selected.assigned ? "assigned-status" : "unassigned-status"}`}>{selected.assigned ? "Assigned" : "Unassigned"}</span></div><h3>{selected.name}</h3><p>{selected.assigned ? `${selected.kind} · ${selected.category} · Decimal ${selected.cp} · 2 UTF-16 units` : "No character is assigned here in Unicode 17.0. This position cannot be copied as a Tolong Siki character."}</p></div><button className="icon-button add-button" aria-label="Insert selected character into playground" title="Insert into playground" disabled={!selected.assigned} onClick={insertSelected}><Plus size={19} /></button></div>
          <div className="data-note"><Info size={14} /><p>Assignment and names come from <a href={SOURCE} target="_blank" rel="noreferrer">UnicodeData.txt · 17.0.0</a>. A missing glyph is a font issue, not an unassigned character.</p></div>
        </section>
        <section className="playground-panel" id="playground" aria-labelledby="playground-title">
          <div className="panel-heading"><div className="heading-with-icon"><Braces size={20} /><h2 id="playground-title">Text playground</h2></div><span className="live-label">LIVE INSPECTOR</span></div>
          <div className="playground-body"><div className="editor-label-row"><label htmlFor="text-playground">Your text</label><button className="text-button" onClick={() => { setText(SAMPLE); setLimit(200); }}>Load sample</button></div><Textarea id="text-playground" ref={editor} className="tolong playground-editor" value={text} dir="ltr" spellCheck={false} autoCorrect="off" autoCapitalize="off" maxLength={10000} placeholder="Type or paste Tolong Siki here…" onChange={e => { setText(e.target.value); setLimit(200); }} /><div className="editor-helper"><span>Paste text, or add a selected character with +.</span><button className="text-button clear-text" disabled={!text} onClick={() => { setText(""); setLimit(200); }}>Clear</button></div><div className="playground-actions"><button className="primary-button" disabled={!text} onClick={() => void copy(text, "Text")}><Copy size={15} /> Copy text</button><button className="secondary-button" disabled={!text} onClick={() => void copy(inspection.map(c => c.codePoint).join(" "), "Code points")}>Copy code points</button></div><div className="text-metrics" aria-live="polite"><div><b>{inspection.length}</b><span>code points</span></div><div><b>{text.length}</b><span>UTF-16 units</span></div><div><b>{assignedCount}</b><span>Tolong Siki</span></div></div>
          <div className="inspection-heading"><h3>Code point sequence</h3><span>IN INPUT ORDER</span></div>
          {inspection.length === 0 ? <div className="inspection-empty"><Braces size={28} /><p>Your characters will appear here.</p><span>Each row is one Unicode code point.</span></div> : <><div className="inspection-list"><ol>{inspection.slice(0, limit).map(c => <li key={c.position} className={c.status === "Unassigned" || c.status === "Invalid UTF-16" ? "inspection-warning" : ""}><span className="sequence-index">{c.position.toString().padStart(2, "0")}</span><span className={`sequence-glyph ${c.status === "Tolong Siki" ? "tolong" : ""}`} aria-hidden="true">{c.display}</span><div className="sequence-detail"><div><code>{c.codePoint}</code><span className={`sequence-status ${c.status === "Tolong Siki" ? "tolong-status" : ""}`}>{c.status}</span></div><p>{c.name}</p><span className="unit-info">UTF-16: {c.utf16}</span></div></li>)}</ol></div>{inspection.length > limit && <button className="secondary-button show-more" onClick={() => setLimit(l => l + 200)}>Show next {Math.min(200, inspection.length - limit)} code points ({limit} of {inspection.length})</button>}<p className="inspection-summary">{assignedCount} Tolong Siki · {unassignedCount} unassigned · {outsideCount} outside the block</p></>}
          <p className="privacy-note"><LockKeyhole size={13} /> Playground text is processed here and is never saved or sent to a server.</p><p className="limit-note">Limit: 10,000 UTF-16 units. Shared marks and spaces can belong in Kurukh text.</p></div>
        </section>
      </div>
      <section className="context-section" id="why-it-matters" aria-labelledby="why-title"><div className="context-intro"><span className="eyebrow">FROM SCRIPT TO SOFTWARE</span><h2 id="why-title">A foundation for Kurukh<br />language technology.</h2><p>Unicode gives Tolong Siki characters stable identities across keyboards, apps, and datasets. That makes real text searchable, shareable, and usable for language tools.</p></div><div className="context-points"><article><span className="point-number">01</span><div><h3>Build with characters, not appearances</h3><p>Store Unicode text instead of legacy font codes. A Tolong Siki-looking Latin letter is still Latin underneath; changing its font does not convert the encoding.</p></div></article><article><span className="point-number">02</span><div><h3>Keep datasets clean</h3><p>Check code points before building dictionaries, OCR, keyboards, or a language model. The 10 unassigned positions are not part of the Unicode 17.0 repertoire. Preserve shared combining marks used by the script.</p></div></article><article><span className="point-number">03</span><div><h3>Count text correctly</h3><p>Every character in this block sits beyond U+FFFF, so JavaScript uses two UTF-16 units for it. Iterate by code point; a visible letter plus a combining mark may contain multiple code points.</p></div></article></div></section>
      <section className="source-section" aria-labelledby="source-title"><div><h2 id="source-title">Encoding notes & sources</h2><p>This explorer is pinned to Unicode 17.0.0. It inspects encoding, not Kurukh spelling or pronunciation.</p></div><div className="source-details"><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>What it establishes</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><a href={SOURCE} target="_blank" rel="noreferrer">Unicode character database</a></TableCell><TableCell>Official names and properties; 54 assigned positions</TableCell></TableRow><TableRow><TableCell><a href={CHART} target="_blank" rel="noreferrer">Tolong Siki code chart</a></TableCell><TableCell>Block layout and reference glyphs</TableCell></TableRow><TableRow><TableCell><a href={SPEC} target="_blank" rel="noreferrer">Core specification · §13.24</a></TableCell><TableCell>Script structure and shared combining marks</TableCell></TableRow></TableBody></Table><p className="font-note">{fontError ? "The display font could not load. Names and code points remain accurate; your device may show missing-glyph boxes." : fontReady ? "Tolong Siki display font loaded." : "Loading the Tolong Siki display font…"} <a href="/fonts/NOTICE.txt" target="_blank" rel="noreferrer">Font credits & license</a>. Font shapes are a visual aid; Unicode data determines assignment.</p></div></section>
    </main>
    <footer><span className="footer-brand"><Grid2X2 size={15} /> Kurukh Unicode Explorer</span><span>Unicode 17.0.0 <span className="footer-separator">·</span> U+11DB0–U+11DEF</span></footer>
  </>;
}
