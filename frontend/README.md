# DocMod by Chiza Labs

Smart file converter built with GRASP principles and pure JavaScript.

## Color Scheme
Primary brand color: **#24B1B1** (Teal)

## Architecture (GRASP)
- **Information Expert**: Each converter knows its own format (ImageConverter knows Sharp, DocumentConverter knows Mammoth)
- **Creator**: ConverterFactory creates converter instances
- **Controller**: ConversionController handles HTTP only
- **Low Coupling**: Routes don't know about Sharp/FFmpeg directly
- **High Cohesion**: Services only orchestrate; converters only convert
- **Indirection**: Factory sits between routes and concrete converters
- **Polymorphism**: All converters extend BaseConverter
- **Protected Variations**: New formats added by extending BaseConverter, not modifying existing code

## Smart Categories
When you upload a file, the frontend detects its category and only shows relevant conversion options:
- **Images** → PNG, JPEG, WebP, AVIF, GIF, TIFF, BMP
- **Documents** → HTML, PDF (optimization), TXT
- **Video/Audio/Archive** → Coming soon (FFmpeg integration)

## Setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Non-JS Dependencies Needed for Full Power
- **Pandoc** or **LibreOffice**: Required for DOCX→PDF, PPTX→PDF (not available in pure JS)
- **FFmpeg**: Required for video/audio conversions (fluent-ffmpeg wraps it)

These are architected as pluggable extensions — add them without touching existing code.

## Deployment
- Frontend: Vercel
- Backend: Render
