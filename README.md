# Blender Dashboard – Edge Function Proxy

## Setup (einmalig, ~5 Minuten)

### 1. Supabase CLI installieren
```bash
npm install -g supabase
```

### 2. Login & Projekt verbinden
```bash
supabase login
supabase link --project-ref uhzbjsmuvbmrbrrfinxn
```

### 3. Anthropic API Key als Secret hinterlegen
```bash
supabase secrets set ANTHROPIC_API_KEY=dein-anthropic-key-hier
```

Den Anthropic API Key bekommst du unter: https://console.anthropic.com/keys

### 4. Edge Function deployen
```bash
supabase functions deploy proxy
```

### 5. URL in config.js eintragen
Nach dem Deploy bekommst du eine URL wie:
```
https://uhzbjsmuvbmrbrrfinxn.supabase.co/functions/v1/proxy
```

Diese URL in `config.js` eintragen:
```javascript
const PROXY_URL = 'https://uhzbjsmuvbmrbrrfinxn.supabase.co/functions/v1/proxy';
```

## Was der Proxy macht
- **image_search**: Ruft Anthropic API auf (kein CORS Problem mehr)
- **youtube_sync**: YouTube Views sicher abrufen

## Kosten
- Supabase Edge Functions: 500.000 Aufrufe/Monat kostenlos
- Anthropic: Pay-per-use (sehr günstig, ~$0.003 pro Suche)
