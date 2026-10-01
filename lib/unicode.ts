import assigned from "@/data/tolong-siki.json";
import shared from "@/data/shared-characters.json";
export const START = 0x11db0, END = 0x11def;
export type Character = { cp: number; name: string; category: string; combining: number; assigned: boolean; kind: string; short: string };
export type Filter = "all" | "assigned" | "unassigned";
export const formatCP = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
const records = new Map(assigned.map(c => [c.cp, c]));
const common = new Map(shared.map(c => [c.cp, c]));
export const characters: Character[] = Array.from({ length: END - START + 1 }, (_, i) => {
  const cp = START + i, c = records.get(cp);
  const kind = !c ? "Unassigned" : cp <= 0x11db5 ? "Vowel" : cp <= 0x11dd8 ? "Consonant" : cp <= 0x11ddb ? "Sign" : "Digit";
  return { cp, name: c?.name ?? "Unassigned in Unicode 17.0", category: c?.category ?? "Cn", combining: c?.combining ?? 0, assigned: !!c, kind, short: c?.name.replace("TOLONG SIKI ", "").replace(/^(LETTER|SIGN|DIGIT) /, "") ?? "Unassigned" };
});
export function searchCharacters(query: string, filter: Filter = "all") {
  const q = query.trim().toUpperCase(), hex = q.replace(/^(U\+|0X|\\U\{?)/, "").replace(/\}$/, "");
  return characters.filter(c => {
    if (filter === "assigned" && !c.assigned || filter === "unassigned" && c.assigned) return false;
    return !q || c.name.includes(q) || c.kind.toUpperCase().includes(q) || formatCP(c.cp).slice(2).includes(hex) || String(c.cp) === q || String.fromCodePoint(c.cp) === query.trim();
  });
}
export function inspectText(text: string) {
  let offset = 0;
  return Array.from(text, (character, index) => {
    const cp = character.codePointAt(0)!, record = records.get(cp), extra = common.get(cp);
    const inBlock = cp >= START && cp <= END, invalid = cp >= 0xd800 && cp <= 0xdfff;
    const status = invalid ? "Invalid UTF-16" : record ? "Tolong Siki" : inBlock ? "Unassigned" : extra?.category === "Mn" ? "Shared combining mark" : "Outside block";
    const name = record?.name ?? (inBlock ? "Unassigned in Unicode 17.0" : extra?.name ?? (invalid ? "LONE SURROGATE — not a Unicode scalar value" : "Outside Tolong Siki block"));
    const unitOffset = offset; offset += character.length;
    const utf16 = Array.from({length: character.length}, (_, i) => character.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")).join(" ");
    const display = cp === 0x20 ? "␠" : cp === 0xa ? "↵" : cp === 0xd ? "CR" : cp === 0x9 ? "⇥" : inBlock && !record ? "—" : extra?.category === "Mn" ? `◌${character}` : character;
    return { position: index + 1, character, cp, codePoint: formatCP(cp), name, status, display, unitOffset, utf16, units: character.length };
  });
}
export const SAMPLE = String.fromCodePoint(0x11db0, 0x11db1, 0x11db2, 0x11db3, 0x11db4, 0x11db5) + " " + String.fromCodePoint(0x11de0, 0x11de1, 0x11de2);
