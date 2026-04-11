# Business Intelligence Dashboard

A modern React web dashboard for the Business Intelligence Platform API.

## Features

- **Search Businesses**: Full-text search, search by category, or search by location
- **Business Details**: View comprehensive business information, reviews, and ratings
- **Analytics Dashboard**: Visualize business metrics with interactive charts
- **Recommendations**: Get trending and personalized business recommendations
- **Similar Businesses**: Discover competitors and similar businesses

## Installation

```bash
cd dashboard
npm install
```

## Running the Dashboard

```bash
npm start
```

The dashboard will open at `http://localhost:3000` and connect to the API at `http://localhost:3000/api/v1`.

## Build for Production

```bash
npm run build
```

## Configuration

The dashboard connects to the API via the `REACT_APP_API_URL` environment variable. By default, it connects to `http://localhost:3000/api/v1`.

To change the API URL:

```bash
REACT_APP_API_URL=https://api.example.com/api/v1 npm start
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Navigation.js   # Navigation bar
│   └── BusinessCard.js # Business listing card
├── pages/              # Page components
│   ├── SearchPage.js
│   ├── AnalyticsPage.js
│   ├── RecommendationsPage.js
│   └── BusinessDetailPage.js
├── api.js              # API client wrapper
├── App.js              # Main app component
└── index.js            # Entry point
```

## Available Pages

1. **Search Page** (`/search`)
   - Text search for businesses
   - Search by category
   - Search by location
   - View results in card format

2. **Business Detail** (`/business/:id`)
   - Full business information
   - Contact details
   - Opening hours
   - Similar businesses
   - Competitors

3. **Analytics** (`/analytics`)
   - Business metrics overview
   - Charts by category, status, and rating
   - Statistical insights

4. **Recommendations** (`/recommendations`)
   - Trending businesses
   - Personalized recommendations by location and category
   - Competitor analysis

## Technologies

- React 18
- React Router 6
- Axios
- Recharts (charting library)
- CSS3

## License

MIT
