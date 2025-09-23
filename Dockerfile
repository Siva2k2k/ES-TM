# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application with environment variables
RUN npm run build

# Production stage - Simple Node.js server
FROM node:18-alpine AS production

# Install serve globally
RUN npm install -g serve

# Create app directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Heroku dynamically assigns ports
# ENV PORT=3000

# Start the application - serve on all interfaces
CMD ["sh", "-c", "serve -s dist -l $PORT"]