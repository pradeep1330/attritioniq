# Stage 1: Build Frontend from Root Files
FROM node:20 AS frontend-builder
WORKDIR /app

# Copy root frontend dependency specifications
COPY package*.json ./
RUN npm install

# Copy root frontend source files and configuration
COPY index.html vite.config.ts tsconfig.json ./
COPY src/ ./src/

# Build production bundle to /app/dist
RUN npm run build

# Stage 2: Python Backend Serving Static Frontend
FROM python:3.11-slim
WORKDIR /app/backend

# Install curl and system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML and API dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./

# Copy built frontend dist from stage 1 into ./static
COPY --from=frontend-builder /app/dist ./static

# Expose port (default 8000, overridable by Cloud Run/Docker $PORT)
EXPOSE 8000

ENV PORT=8000

# Start unified service from the backend directory
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
