# Business Intelligence Platform

A scalable platform for collecting, normalizing, storing, and searching business information from external location intelligence providers (Google Places API, etc.) + local database.

## ✨ Features

- **Advanced Search**
  - 🔍 Full-text search (name, description, category)
  - 📍 Location-based search (city, country, postal code)
  - 🗺️ Geographic search (nearby by coordinates)
  - 🏷️ Category filtering
  - ⭐ Rating filters
  
- **Google Places Integration**
  - Real-time business data from Google Places API
  - Automatic data ingestion and normalization
  - Hybrid search (local database + Google)
  
- **Data Management**
  - PostgreSQL database with full-text search
  - Redis caching for performance
  - Automatic data normalization
  - Batch operations
  
- **Frontend UI**
  - React dashboard with advanced search
  - Table and card view modes
  - Excel export functionality
  - Real-time results

## 🏗️ Tech Stack

- **Frontend**: React 18 (Create React App)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 (with full-text search)
- **ORM**: Prisma
- **Cache**: Redis 7
- **API**: Google Places API, Custom REST API
- **Deployment**: Docker + Docker Compose, Kubernetes

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### 1. Clone & Setup
```bash
# Start all services (PostgreSQL, Redis, API, Frontend)
docker-compose up -d

# Wait for containers to start
sleep 5

# Seed sample data
docker exec business-data-app-1 npm run seed
```

### 2. Access the Application
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000/api/v1/search
- **Database**: PostgreSQL on port 5433

### 3. Enable Google Places Search (Optional)
```bash
# 1. Get API key from https://console.cloud.google.com
# 2. Add to .env file:
echo "GOOGLE_PLACES_API_KEY=your_key_here" >> .env
# 3. Restart app
docker-compose restart app
```

## 🔍 Available Search Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/search?query=...` | Text search | `?query=barbershop` |
| `/location?city=...` | Location search | `?city=New%20York` |
| `/category/:cat` | Category search | `/category/Barbershop` |
| `/nearby?lat=&lon=&radius=` | Geographic search | `?latitude=40.71&longitude=-74` |
| `/google?query=...` | Google Places search | `?query=coffee` |
| `/hybrid?query=...` | Hybrid search | `?query=pizza` |

## 📊 Sample Data

The database is pre-seeded with **6 test businesses**:

| Business | Category | Location |
|----------|----------|----------|
| Tony's Barbershop | Barbershop | New York, NY |
| Brooklyn Barbershop NYC | Barbershop | New York, NY |
| Upper West Barbers | Barbershop | New York, NY |
| The Daily Brew | Coffee Shop | San Francisco, CA |
| Manhattan Bistro | Restaurant | New York, NY |
| FitLife Gym | Fitness | Los Angeles, CA |

## 🐛 Troubleshooting

**Google Places search failed**: Ensure your Google API key is correctly set in the `.env` file.

## Development

Start the development server:

```bash
npm run dev
```

## Build

Build TypeScript to JavaScript:

```bash
npm run build
```

## Production

Start the production server:

```bash
npm start
```

## API Endpoints

### Ingestion

- `POST /api/v1/ingest/google-places/text-search` - Search and ingest from Google Places
- `POST /api/v1/ingest/google-places/nearby` - Search nearby businesses
- `POST /api/v1/ingest/google-places/:place_id` - Ingest single business by ID
- `POST /api/v1/ingest/batch` - Batch ingest multiple businesses
- `POST /api/v1/ingest/sync/:id` - Sync a specific business
- `POST /api/v1/ingest/sync-batch` - Batch sync businesses

### Search

- `GET /api/v1/search?query=...` - Full-text search
- `POST /api/v1/search/advanced` - Advanced search with filters
- `GET /api/v1/search/category/:category` - Search by category
- `GET /api/v1/search/location?city=...&country=...` - Search by location
- `GET /api/v1/search/nearby?latitude=...&longitude=...&radius=...` - Search nearby
- `GET /api/v1/search/name/:name` - Search by name
- `GET /api/v1/search/:id` - Get business by ID
- `GET /api/v1/search/external/:external_id` - Get by external ID
- `GET /api/v1/search/top-rated/:category?` - Get top-rated businesses
- `GET /api/v1/search/stats` - Get statistics
- `GET /api/v1/search/leads/:category` - Find leads by category

### System

- `GET /` - Health check
- `GET /api/v1/health` - Health status
- `GET /api/v1/version` - Version info
- `GET /api/v1/docs` - API documentation

## Database Schema (Prisma)

### Business Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary Key |
| `external_id` | String | Unique ID from provider (e.g., Google Place ID) |
| `provider` | String | Source provider (google_places, yelp) |
| `name` | String | Business name |
| `category` | String | Main category |
| `latitude`/`longitude` | Float | Geospatial coordinates |
| `rating` | Float | Average rating (0-5) |
| `status` | String | 'active', 'inactive', 'closed' |
| `source_data` | Json | Raw data from the provider |

## Seeding Data

Seed database with sample data:

```bash
npm run seed
```

## Project Structure

```
src/
├── config.ts              # Configuration management
├── index.ts               # Application entry point
├── db/                    # Database setup
├── models/                # Interface definitions
├── services/              # Business logic
│   ├── BusinessNormalizer.ts
│   ├── GooglePlacesClient.ts
│   ├── BusinessIngestionService.ts
│   ├── BusinessSearchService.ts
│   └── CacheService.ts
├── routes/                # API routes
│   ├── ingestRoutes.ts
│   ├── searchRoutes.ts
│   └── systemRoutes.ts
├── middleware/            # Express middleware
│   └── validation.ts
├── utils/                 # Helper functions
│   └── helpers.ts
└── scripts/               # Utility scripts
    └── seed.ts
```

## Performance Optimizations

- PostgreSQL GIN indexes on full-text search columns
- BRIN/B-Tree indexes on frequently filtered fields
- Haversine-based geospatial queries
- Redis caching for search results
- Batch processing for ingestion and sync operations
- Pagination support for all list endpoints

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-04-08T12:00:00.000Z"
}
```

## Scaling Considerations

- Read replicas for database query offloading
- Redis clustering for distributed caching
- API rate limiting (Implemented)
- Database connection pooling (via Prisma)
- Database connection pooling
- Asynchronous processing for bulk operations
- Background job queue for syncing (to be implemented)
