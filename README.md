# Contract & Estimate Parser

An AI-powered web application for parsing, organizing, and comparing property management contracts and estimates from PDF, JPG, and PNG files.

## Features

- **Upload & Parse** - Upload PDF, JPG, or PNG files. AI automatically extracts structured data.
- **Search & Filter** - Search by text across all fields. Filter by property, service category, and recurring status.
- **Compare** - Select up to 4 documents for side-by-side comparison in a printable table format.
- **Export/Print** - Print or save comparison views as PDF using your browser's print dialog.

## Data Fields Extracted

- Estimate Date
- Supplier Name
- Property (Canyon View, Rockpoint, Boulder Canyon, or Other)
- AI Description Summary
- Keywords
- Service Category
- Total Price
- Recurring (yes/no)
- Billing Interval
- Interval Amount
- Expiration Date
- Cancellation Terms

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for AI parsing)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/denautica/contract-estimate-parser.git
   cd contract-estimate-parser
   ```

2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

3. Create a `.env` file in the `server/` directory:
   ```bash
   cp server/.env.example server/.env
   ```

4. Add your OpenAI API key to `server/.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The server will serve the built frontend and run on the configured port (default 3000).

## Project Structure

```
contract-estimate-parser/
├── server/              # Node.js Express backend
│   ├── server.js        # API routes and file upload handling
│   ├── database.js      # SQLite database setup
│   ├── parser.js        # OpenAI integration for document parsing
│   └── .env             # Environment variables (create this)
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx      # Main dashboard
│   │   └── components/  # UI components
│   └── index.html
├── uploads/             # Uploaded files (created automatically)
└── data/                # SQLite database (created automatically)
```

## License

Private
