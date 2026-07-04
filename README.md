# Company Research Assistant

An AI-powered full-stack web application that researches any company from just a name or website URL. It crawls the web for public information, generates AI insights via OpenRouter, finds competitors, and produces a downloadable PDF report.

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui-style components
- **Backend:** Express 5 + TypeScript (Node.js)
- **Search:** Serper.dev (Google Search API)
- **AI:** OpenRouter (supports GPT-4o, Claude, Gemini, Llama, and custom models)
- **PDF:** jsPDF
- **Crawler:** cheerio + native fetch
- **Discord:** Bot API v10 with multipart file upload

## Project Structure

```
├── server/
│   ├── index.ts              # Express server entry point
│   ├── routes/
│   │   └── research.ts       # API routes (research, PDF, Discord)
│   ├── services/
│   │   ├── serper.ts         # Serper.dev search integration
│   │   ├── crawler.ts        # Website crawler (cheerio)
│   │   ├── openrouter.ts     # OpenRouter AI analysis
│   │   ├── pdf.ts            # PDF report generation
│   │   └── discord.ts        # Discord bot integration
│   └── types/
│       └── index.ts          # Shared server types
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI primitives (button, card, etc.)
│   │   ├── ChatInterface.tsx # Main chat UI
│   │   ├── ChatInput.tsx     # Input + model selector
│   │   ├── ProgressSteps.tsx # Stage progress indicator
│   │   ├── CompanyCard.tsx   # Company info card
│   │   ├── ProductsCard.tsx  # Products/services card
│   │   ├── PainPointsCard.tsx
│   │   ├── CompetitorsCard.tsx
│   │   └── SettingsPanel.tsx # Discord settings dialog
│   ├── lib/
│   │   ├── api.ts            # Frontend API client (SSE, PDF, Discord)
│   │   ├── types.ts          # Frontend types
│   │   └── utils.ts          # Utility functions (cn)
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- API keys for [Serper.dev](https://serper.dev) and [OpenRouter](https://openrouter.ai)

### Installation

```bash
# Clone or copy the project
cd company-research-assistant

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERPER_API_KEY` | Yes | API key from [serper.dev](https://serper.dev) for Google search |
| `OPENROUTER_API_KEY` | Yes | API key from [openrouter.ai](https://openrouter.ai) for AI analysis |
| `PORT` | No | Backend server port (default: `3001`) |

Discord credentials are entered at runtime via the Settings panel (not env vars).

### Running Locally

```bash
# Start both frontend (port 5173) and backend (port 3001)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Or run separately:
npm run dev:server   # Backend only on :3001
npm run dev:client   # Frontend only on :5173
```

### Production Build

```bash
npm run build    # Build frontend
npm start        # Start backend server
```

## How It Works

### 1. Company Research Flow

1. User enters a company name (e.g. "Stripe") or URL (e.g. "https://stripe.com")
2. If a name was given, **Serper.dev** resolves it to the official website
3. The **crawler** visits the website and extracts content from key pages
4. **Serper.dev** supplementary searches fill gaps (contact info, industry)
5. **OpenRouter** analyzes all collected data and returns structured JSON
6. Results stream to the UI via Server-Sent Events with progress indicators
7. User can download a PDF report or auto-send to Discord

### 2. Website Crawler

Located in `server/services/crawler.ts`.

- Starts from the resolved/given URL
- Discovers internal links and prioritizes important pages (About, Products, Services, Contact, Pricing)
- Max ~18 pages, with deduplication by URL normalization and content hash
- Skips irrelevant pages (`/login`, `/cart`, `/admin`, media files, etc.)
- Strips nav/footer/script boilerplate before text extraction
- 10-second timeout per page fetch

### 3. Serper.dev Search Integration

Located in `server/services/serper.ts`.

- **Website resolution:** Searches `"{company} official website"` and scores results to pick the most likely official site (penalizes LinkedIn, Wikipedia, etc.)
- **Supplementary info:** Searches for phone, address, and contact details
- **Competitors:** Searches `"{company} competitors alternatives"` for grounded competitor suggestions

### 4. OpenRouter AI Analysis

Located in `server/services/openrouter.ts`.

- Sends crawled content + search results to the selected model
- Requests structured JSON output: summary, products/services, pain points, competitors
- Curated model list: GPT-4o Mini, Claude 3.5 Sonnet, Gemini Flash 1.5, Llama 3.1 70B
- Custom model ID field for any OpenRouter-supported model

### 5. Competitor Analysis

Combines Serper search results with OpenRouter reasoning. The AI is instructed to prefer competitors found in search results rather than hallucinating. Each competitor includes name, website, and reasoning.

### 6. PDF Report Generation

Located in `server/services/pdf.ts`.

- Uses jsPDF to generate a professional A4 report
- Sections: Company Information, Summary, Products & Services, Pain Points, Competitor Analysis
- Dark header, clean typography, page numbers
- Triggered via "Download PDF Report" button or Discord auto-send

### 7. Discord Integration

Located in `server/services/discord.ts` and `src/components/SettingsPanel.tsx`.

- Settings panel (gear icon) for Bot Token, Channel ID, Applicant Name, Email
- Stored in React session state only (no database)
- After research completes, automatically sends a message + PDF attachment to the configured channel
- Uses Discord Bot API v10 with multipart form data upload
- Message includes applicant info, company name, and website

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + API key status |
| `GET` | `/api/models` | List curated OpenRouter models |
| `POST` | `/api/research` | Start research (SSE stream) |
| `POST` | `/api/pdf` | Generate PDF from research data |
| `POST` | `/api/discord` | Send report to Discord channel |

## License

MIT
