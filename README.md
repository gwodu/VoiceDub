
# Audio Translation App

A web application built with TypeScript, React, and Express that provides audio translation services using the ElevenLabs API.

## Features

- Record and upload audio files
- Translate audio to multiple languages
- Real-time audio visualization with waveforms
- Responsive UI built with React and Tailwind CSS
- Backend API using Express

## Supported Languages

- English
- Spanish
- French
- German
- Italian
- Portuguese
- Polish
- Hindi

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Integration**: ElevenLabs for audio translation
- **Audio Processing**: WaveSurfer.js

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - `ELEVEN_LABS_API_KEY` - Your ElevenLabs API key
   - Database connection variables

### Development

Run the development server:

```
npm run dev
```

### Building for Production

```
npm run build
```

### Deployment

```
npm run start
```

## Project Structure

- `/client` - Frontend React application
- `/server` - Express backend
- `/shared` - Shared types and schemas
- `/server/services` - Service layer including ElevenLabs API integration

## License

MIT
