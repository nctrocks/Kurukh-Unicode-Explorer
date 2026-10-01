# Kurukh Unicode Explorer

A Tolong Siki character explorer and text playground pinned to Unicode 17.0.0.

## Features

- All 64 positions from U+11DB0 through U+11DEF, in code point order.
- 54 assigned characters and 10 clearly labeled unassigned positions.
- Search official character names, hexadecimal code points, decimal values, or pasted characters.
- Copy assigned characters by clicking the grid. Unassigned positions are inspect-only.
- Type or paste text and inspect every code point, its input order, and UTF-16 representation.
- Identify shared combining marks, whitespace, out-of-block characters, and malformed surrogate values.
- Copy text or the complete code point sequence, insert the selected character at the cursor, and load sample characters.
- Responsive layout, keyboard-accessible controls, and a bundled font covering all 54 assigned characters.
- Brief notes on encoding and its role in Kurukh keyboards, dictionaries, OCR, and language models.

Playground text is processed in browser memory. It is not saved or submitted to a server.

## Run locally

Use Node.js 22.13.0 or newer and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL shown in your terminal. A clean checkout defaults to the portable execution profile.

```bash
# Type-check
pnpm exec tsc --noEmit

# Build the Cloudflare-compatible Worker and browser assets
pnpm build

# Run the built Worker locally
pnpm start
```

The application uses React 19, TypeScript, Vinext/Vite, Tailwind CSS, and the included Shadcn/Radix controls. The complete starter support code is included for reproducible builds.

## Project files

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Explorer UI and interactions |
| `app/globals.css` | Responsive styles and font setup |
| `app/layout.tsx` | Document title, metadata, and favicon |
| `lib/unicode.ts` | Search, assignment lookup, and code point inspection |
| `data/tolong-siki.json` | Official names and properties for the 54 assigned positions |
| `data/shared-characters.json` | Shared marks and whitespace metadata |
| `data/provenance.json` | Source URL, Unicode version, and source SHA-256 |
| `public/fonts/` | Unmodified AncientSans display font, attribution, and license |
| `public/UNICODE-LICENSE.txt` | Unicode data license |
| `components/ui/` | Included interface primitives |
| `build/`, `scripts/`, `vite.config.ts` | Worker, build, and development support |
| `pnpm-lock.yaml` | Locked dependencies |

## Authoritative data

Names and assignment come from the Unicode Character Database, not browser Unicode-property support or font appearance.

- [UnicodeData.txt, version 17.0.0](https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt)
- [Unicode 17.0 Tolong Siki chart](https://www.unicode.org/charts/PDF/Unicode-17.0/U170-11DB0.pdf)
- [Core specification, chapter 13, section 13.24](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-13/)

The unassigned positions are U+11DDC-U+11DDF and U+11DEA-U+11DEF. They have no official character names in this version. Shared combining marks used in Kurukh text are encoded in other blocks and must not be rejected simply for being outside the Tolong Siki block.

All assigned Tolong Siki characters are supplementary-plane characters: one code point occupies two UTF-16 code units. The inspector preserves the original text and does not normalize or transliterate it.

The playground limit is 10,000 UTF-16 units. Long inspection results are shown in batches of 200 rows; copy actions include the complete text.

## Privacy and hosting

The existing hosted instance is private under the Sites platform's access controls. This source export does not include account credentials, deployment archives, or the original Site project identity. The `Private workspace` label is descriptive; access control is provided by the hosting platform, not by a client-side label. Local development and deployments on other platforms must apply their own access policy.

No GitHub Pages deployment is configured. Keep this repository private unless its owner explicitly approves public access.

The optional database/connector starter code is included, but the explorer does not use databases, connectors, or external text-processing services.

## Validation

See [VALIDATION.md](VALIDATION.md) for the interaction checks performed on this version. Browser visual QA and native browser WebMCP validation were unavailable. Agent-tool contracts were tested with a simulated page registry.

## Third-party licenses

Unicode data is distributed under Unicode License V3. The unmodified AncientSans font by Dare-demo Iie is distributed under IPA Font License Agreement V1.0. See the license files and `public/fonts/NOTICE.txt` for attribution, source files, and the original IPAexGothic replacement instructions. Included vendor and build support code retain their supplied license notices.
