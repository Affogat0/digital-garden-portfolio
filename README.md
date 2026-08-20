# Digital Garden Portfolio

A cinematic portfolio built with Next.js, React, and a scroll-controlled canvas frame sequence.

## Prerequisites

- Node.js `>=22.13.0`

## Local development

```bash
npm install
npm run dev
npm run build
```

## Deploy to Vercel

1. Import `Affogat0/digital-garden-portfolio` into Vercel.
2. Keep the detected framework as **Next.js**.
3. Use the repository root and the default `npm run build` command.
4. Deploy. The current portfolio does not require environment variables.

The large cinematic frame sequence is served from `public/cinematic-frames/` and is loaded progressively by the browser.
