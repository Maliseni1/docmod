# DocMod

Smart file converter — drop a file, DocMod detects its type and only shows
the conversions that actually make sense for it. No format-matrix, no
clutter.

![DocMod screenshot](docs/screenshot.png)

## What it does today

- **Images** — PNG, JPEG, WebP, AVIF, GIF, TIFF, BMP, convertible to each
  other (via [sharp](https://sharp.pixelplumbing.com/)).
- **Documents** — DOCX→HTML, TXT↔HTML, and PDF optimization, all in pure
  JS (via [mammoth](https://github.com/mimetype/mammoth.js) and
  [pdf-lib](https://pdf-lib.js.org/)).
- **DOCX→PDF** — mammoth renders DOCX→HTML (as above), then a headless
  Chromium renders that to PDF, via `puppeteer-core` +
  `@sparticuz/chromium` (a Chromium build compressed specifically to fit
  a serverless function's size limit). Real formatting, tables, and
  images come through correctly since it's a real browser engine
  rendering the page, not a hand-rolled layout approximation.
- **PDF→DOCX** — `pdf-parse` extracts the text, `docx` writes it back out
  as a real Word file. Both pure JS, no native binaries. Honest limit:
  this recovers the text as plain reflowed paragraphs — it does not
  preserve the original layout, fonts, tables, or images. Full fidelity
  needs a real layout engine (what LibreOffice/Pandoc do below), which
  this direction intentionally avoids to stay lightweight.
- **Heavier document conversion** (DOCX/PPTX/XLSX→PDF via LibreOffice and
  Pandoc, with full layout fidelity) is implemented in
  `backend/src/converters/`, but isn't live in the current deployment —
  see [Deployment](#deployment) below for why.

The backend detects which system binaries (`pandoc`, `soffice`) are
actually present at runtime and only registers the converters it can
support, so the app degrades gracefully instead of failing — see
`backend/src/utils/BinaryChecker.js` and `ConverterFactory.js`.

## Other frontend features

- **Offline fallback page** — a minimal service worker
  (`frontend/public/sw.js`) caches a custom offline page
  (`frontend/public/offline.html`) the first time someone visits while
  online, so a later visit with no connection shows that instead of the
  browser's own generic error page. It only caches that one fallback
  page, not the app itself, so online users never risk seeing a stale
  cached version of the site.
- **Analytics** — [PostHog](https://posthog.com) (`frontend/src/posthog.js`)
  tracks a handful of conversion-funnel events (file selected, conversion
  started/completed/failed, download clicked) scoped to just the file
  category and target format — never filenames or file content. Enabled
  by setting `VITE_POSTHOG_KEY`/`VITE_POSTHOG_HOST`; a no-op if unset.

## Architecture

- `backend/src/converters/` — one class per conversion engine
  (`ImageConverter`, `PdfConverter`, `DocumentConverter`,
  `ChromiumPdfConverter`, `PdfToDocxConverter`, `PandocConverter`,
  `LibreOfficeConverter`), all extending `BaseConverter`. Adding a new
  format means adding a new converter, not modifying existing ones.
- `ConverterFactory` — resolves a `(fromExt, toExt)` pair to whichever
  registered converter supports it, built dynamically from which binaries
  `BinaryChecker` finds on the host.
- `ConversionService` / `ConversionController` — orchestration and HTTP
  concerns are kept separate; the controller never touches a converter
  directly.
- The frontend (`frontend/src/`) is a small Vite + React app: drop a file,
  it's classified client-side, the backend reports which target formats
  are valid for that category, convert, and the response comes back as a
  file blob in the same request (no separate download step).

## Setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:3000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL to match the backend above
npm install
npm run dev             # http://localhost:5173
```

## Deployment

Both frontend and backend deploy to **Vercel**:
- Frontend: a standard Vite project (Root Directory: `frontend`).
- Backend: deploys as a Vercel serverless function (`backend/api/index.js`
  + `backend/vercel.json`; Root Directory: `backend`). Set `VITE_API_URL`
  on the frontend project to the backend's deployed URL + `/api`, and
  `FRONTEND_URL` on the backend project to the frontend's URL (for CORS).

`backend/Dockerfile` and `render.yaml` are also kept in the repo — they
install LibreOffice + Pandoc for the full document-conversion feature set,
but that needs a real container host with enough RAM, not a serverless
function. They're for a future paid-VM deployment, not the current live
one; Vercel's serverless runtime has neither of those binaries, so
`ConverterFactory` simply doesn't register those converters there.

## Non-JS dependencies (for the Docker/container path only)
- **Pandoc** and/or **LibreOffice** — DOCX/PPTX/XLSX→PDF and related
  conversions `BinaryChecker` detects and wires in automatically if
  present.

---
Powered by Chiza Labs.
