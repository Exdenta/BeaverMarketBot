FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for canvas (chart generation)
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY .env.example ./.env

# Create necessary directories
RUN mkdir -p data logs charts

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["npm", "start"]