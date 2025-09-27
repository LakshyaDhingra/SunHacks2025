# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 recipe finder application that uses AI (Google Gemini) to help users discover recipes based on available ingredients. The app features:
- AI-powered recipe search using Gemini API
- Real-time streaming responses
- Recipe extraction and parsing capabilities
- React components with TypeScript
- Tailwind CSS for styling

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (uses Turbopack)
npm run dev

# Build for production (uses Turbopack)
npm run build

# Start production server
npm start
```

Note: There appears to be a JSON parsing error that occurs during build/dev commands (position 803) that may need investigation.

## Architecture

### Core Technologies
- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4
- **AI Integration**: Google Generative AI (Gemini) via @ai-sdk/google
- **Package Manager**: npm/pnpm (pnpm-lock.yaml present)

### Project Structure

#### API Layer (`/app/api/`)
- `recipes/search/route.ts`: POST endpoint for recipe search, handles streaming responses

#### AI Agents (`/lib/agents/`)
- `recipe-agent.ts`: Defines recipe finding agents using Gemini models
  - Uses `gemini-2.5-flash` for fast responses
  - Implements search and extraction workflow
  - Provides both streaming and non-streaming variants

#### Tools (`/lib/tools/`)
- `recipe-tools-enhanced.ts`: AI tool definitions for recipe operations
  - `recipeSearchTool`: Web search for recipes based on ingredients
  - `recipeExtractionTool`: Extracts structured recipe data from URLs
  - Currently uses mock data (needs real API integration)

#### Components (`/components/`)
- `RecipeFinder.tsx`: Main UI component for ingredient input and recipe display
- `RecipeCard.tsx`: Recipe display card component

#### Types (`/lib/types/`)
- `recipe.ts`: TypeScript interfaces for Recipe and RecipeSearchResult

### Key Patterns

1. **Path Aliases**: Uses `@/` for root imports (configured in tsconfig.json)
2. **Streaming Responses**: Implements real-time AI response streaming
3. **Tool-based AI Architecture**: Uses AI SDK's tool system for structured operations
4. **Mock Data**: Currently returns mock recipes - real web scraping/API integration needed

## Environment Setup

Requires a `.env` file with:
```
GEMINI_API_KEY=your_api_key_here
```

## Important Implementation Notes

1. The recipe search and extraction tools currently return mock data and need real implementation for:
   - Actual web search API integration (Google Custom Search, Serper, etc.)
   - Real recipe extraction from URLs
   - Schema.org/Recipe parsing

2. The streaming UI in `RecipeFinder.tsx` extracts recipes from streamed text but currently uses a simple keyword detection approach.

3. The application is configured for Turbopack in both development and production builds.

4. TypeScript is configured with strict mode and uses the bundler module resolution.
