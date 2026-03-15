# FreshList

Smart grocery and pantry management app built with React Native and Expo.

## Features

- **Shopping List** — Shared family lists with real-time sync via Supabase
- **Pantry Tracker** — Track what you have at home with expiry reminders
- **AI Chat** — Ask for recipes, meal plans, and shopping suggestions powered by Claude
- **Barcode Scanner** — Scan products to quickly add them to your list or pantry
- **Recipe Cooking Mode** — Step-by-step cooking with text-to-speech instructions
- **Weekly Summary** — Stats on spending, waste reduction, and meal planning
- **Family Sharing** — Invite family members to collaborate on lists
- **Smart Notifications** — Expiry alerts, cooking reminders, and weekly summaries
- **Offers & Location** — Nearby supermarket deals based on your location

## Tech Stack

- **Frontend**: React Native + Expo (SDK 52) with expo-router
- **Backend**: Supabase (Auth, Database, Realtime)
- **AI**: Claude API for chat and recipe suggestions
- **State**: React Context + AsyncStorage
- **Styling**: React Native StyleSheet with dark/light theme support

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode 15+ (for native builds)
- Android: Android Studio (for native builds)

### Installation

```bash
git clone https://github.com/gmoll-oss/freshlist.git
cd freshlist
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
```

### Run

```bash
# Development server
npm start

# iOS native build
npm run ios

# Android native build
npm run android

# Web
npm run web
```

### Deploy to Vercel (Web)

```bash
npm run build:web
```

Or connect the GitHub repo to Vercel with:
- **Build Command**: `npx expo export --platform web`
- **Output Directory**: `dist`

## Project Structure

```
src/
├── app/              # Expo Router screens (file-based routing)
│   ├── (tabs)/       # Tab navigation (home, shopping, scan, pantry, stats)
│   ├── cook/         # Cooking mode screens
│   └── ...           # Other screens (chat, profile, family, etc.)
├── components/       # Reusable UI components
├── constants/        # Theme, colors, fonts
├── hooks/            # Custom hooks (useAuth, useNotifications, etc.)
├── lib/              # Supabase client config
├── services/         # Business logic (camera, notifications, purchases, etc.)
└── utils/            # Cross-platform wrappers (haptics, alert, speech)
```

## License

Private — All rights reserved.
