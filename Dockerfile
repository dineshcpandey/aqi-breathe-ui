# Simple Dockerfile for OpenShift - runs npm start
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Copy generated data to public folder so React can serve it
COPY generated_data/ ./public/generated_data/

# Create non-root user for OpenShift compatibility
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appgroup -g appgroup appuser && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER 1001

# Expose port 3000 (React default)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the React development server
CMD ["npm", "start"]