# 🕵️ Seller Stalker

Amazon seller monitoring + price hunting dashboard.

## Features

- **Track Amazon Sellers** - Monitor seller storefronts via Keepa API
- **New Product Alerts** - Get notified when sellers add new products
- **Discord Notifications** - Rich embeds with product images
- **Check All Sellers** - One-click to refresh all tracked sellers
- **Export/Import** - Backup and restore your data
- **Persistent Storage** - Data saved in browser localStorage

## Deploy to Vercel

### Option 1: One-Click Deploy (Easiest)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Click "Deploy"

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# In this folder, run:
vercel

# Follow the prompts
```

### Option 3: Manual Deploy

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project" → "Import Third-Party Git Repository"
3. Or drag and drop this folder to upload

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Setup

1. **Keepa API Key** - Get one at [keepa.com/#!api](https://keepa.com/#!api)
2. **Discord Webhook** (optional) - Create in Discord server settings → Integrations → Webhooks

## Usage

1. Click "Settings" and enter your Keepa API key
2. Click "+ Add Seller" and enter an Amazon seller ID
   - Find seller IDs in URLs like: `amazon.com/sp?seller=SELLER_ID`
3. Click "Check Now" to fetch the seller's products
4. New products will be highlighted and sent to Discord (if configured)

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Keepa API
