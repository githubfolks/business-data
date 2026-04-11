-- CreateTable "Business"
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "external_id" TEXT NOT NULL UNIQUE,
    "provider" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "subcategories" VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR(100)[],
    "street" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone_numbers" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "website" VARCHAR(255),
    "email" VARCHAR(255),
    "rating" DOUBLE PRECISION,
    "review_count" INTEGER,
    "opening_hours" JSONB,
    "attributes" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "source_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced" TIMESTAMP(3),
    "search_text" TEXT
);

-- CreateIndex
CREATE INDEX "Business_external_id_idx" ON "Business"("external_id");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE INDEX "Business_category_idx" ON "Business"("category");

-- CreateIndex
CREATE INDEX "Business_status_idx" ON "Business"("status");

-- CreateIndex
CREATE INDEX "Business_city_idx" ON "Business"("city");

-- CreateIndex
CREATE INDEX "Business_created_at_idx" ON "Business"("created_at");

-- CreateIndex
CREATE INDEX "Business_latitude_longitude_idx" ON "Business"("latitude", "longitude");

-- Create Full-text search index
CREATE INDEX "Business_fts_idx" ON "Business" USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || category || ' ' || COALESCE(city, '')));
