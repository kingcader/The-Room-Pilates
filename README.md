# The Room - Pilates Studio App

A high-end, minimalist React Native mobile app for "The Room" boutique Pilates studio.

## Tech Stack

- **Frontend**: React Native with Expo (Expo Router)
- **Styling**: NativeWind (Tailwind CSS)
- **Backend/Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the `supabase-setup.sql` script
3. Copy your Supabase URL and anon key from Project Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the App

```bash
npm start
```

Then press `i` for iOS or `a` for Android.

## Database Schema

The app uses the following tables:
- `users` - User profiles with credits and membership info
- `classes` - Available class types
- `schedule` - Scheduled class instances
- `bookings` - User class bookings
- `products` - Memberships and class packs

## Features

- **Home Dashboard**: Welcome message, classes completed, streak tracking, next reservation
- **Schedule**: Horizontal calendar, class listings, booking functionality
- **Shop**: View and purchase memberships and class packs
- **Profile**: User info, membership status, reservation history

## Design System

- **Colors**: Black (#000000), White (#FFFFFF), Paper/Cream (#F0F0EB)
- **Typography**: Serif for headers (Georgia), Sans-serif for body (System)
- **Style**: High contrast, minimalist, clean lines

