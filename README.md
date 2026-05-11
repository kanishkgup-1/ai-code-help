# AI Coding Assistant

A full-stack MVP for a Python-focused AI coding assistant with:

- a marketing landing page
- a live Monaco-powered Python editor with suggestions
- a separate chat page for full-code Q&A
- an Express backend with modular analysis and pluggable AI integration

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Editor: Monaco Editor
- Routing: React Router
- Styling: custom responsive CSS

## Project Structure

```text
.
|-- backend
|   |-- package.json
|   `-- src
|       |-- app.js
|       |-- server.js
|       |-- config
|       |-- controllers
|       |-- routes
|       |-- services
|       `-- utils
|-- frontend
|   |-- package.json
|   |-- vite.config.js
|   `-- src
|       |-- components
|       |-- pages
|       `-- services
|-- .env.example
`-- package.json
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start the backend:

```bash
npm run dev:backend
```

4. Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

5. Open the frontend at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Express server port |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `PYTHON_BIN` | Python executable used for syntax compilation |
| `AI_PROVIDER` | `google-ai-studio` for Gemini or `placeholder` for local fallback |
| `GEMINI_API_KEY` | Google AI Studio API key for chat and AI-powered editor reviews |
| `GEMINI_MODEL` | Gemini model ID, for example `gemini-2.5-flash-lite` or `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODEL` | Optional backup model used if the primary Gemini model is temporarily overloaded |
| `GEMINI_THINKING_BUDGET` | Optional Gemini thinking budget, `0` for faster low-cost responses |

## API Endpoints

### `POST /api/analyze`

Analyzes Python code for:

- syntax issues
- quality tips
- improvement suggestions

Request body:

```json
{
  "code": "print('hello')"
}
```

### `POST /api/chat`

Answers questions about a larger Python snippet.

Request body:

```json
{
  "code": "def add(a, b):\n    return a + b",
  "question": "Explain this code"
}
```

## MVP Notes

- The editor uses lightweight static analysis for every review and can optionally add Gemini-backed suggestions.
- Automatic AI editor reviews are rate-limited to larger edits: at least 5 new meaningful lines, 2 seconds idle time, 30 seconds since the last AI call, and different code from the last AI-reviewed snapshot.
- The editor improvement lane is tuned to focus on time-complexity and space-complexity opportunities instead of generic advice.
- The backend is structured so you can later swap in `pylint`, `flake8`, `pyright`, or a different AI provider.

## Deployment

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root to `frontend`.
3. Build command:

```bash
npm run build
```

4. Output directory:

```text
dist
```

5. Add environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api
```

### Backend on Render

1. Create a new Web Service from the repository.
2. Set the root directory to `backend`.
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm start
```

5. Add environment variables from `.env.example`.
6. Set `CLIENT_ORIGIN` to your deployed Vercel URL.

## Future Upgrades

- add real AI provider integration
- use `pylint`, `flake8`, or `pyright` for richer analysis
- add authentication and usage history
- stream chat responses
- persist editor sessions
