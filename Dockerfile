# Multi-stage build for React AQI Mapping Platform
# Optimized for OpenShift deployment

# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Copy generated data files
COPY generated_data/ ./public/generated_data/

# Copy other necessary files
COPY *.js ./
COPY *.json ./

# Set environment for production build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_BUILD_PATH=/

# Build the application
RUN npm run build

# Stage 2: Production server with nginx
FROM nginx:1.25-alpine AS production

# Install additional tools for OpenShift compatibility
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create nginx user and set up directories for OpenShift
RUN addgroup -g 1001 -S nginx-openshift && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-openshift -g nginx-openshift nginx-openshift

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /var/run && \
    chown -R 1001:1001 /var/cache/nginx /var/log/nginx /etc/nginx /var/run && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /etc/nginx /var/run

# Custom nginx configuration for OpenShift
COPY <<EOF /etc/nginx/nginx.conf
worker_processes auto;
pid /var/run/nginx.pid;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                   '\$status \$body_bytes_sent "\$http_referer" '
                   '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen 8080;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # React Router support (SPA)
        location / {
            try_files \$uri \$uri/ /index.html;
            
            # Cache control for static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                access_log off;
            }
        }

        # Special handling for CSV data files
        location /generated_data/ {
            add_header Content-Type "text/csv";
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
        }

        # Health check endpoint for OpenShift
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Readiness probe endpoint
        location /ready {
            access_log off;
            return 200 "ready\n";
            add_header Content-Type text/plain;
        }

        # Error pages
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
EOF

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Ensure generated_data is accessible
RUN ls -la /usr/share/nginx/html/generated_data/ || echo "Generated data not found"

# Set proper permissions for OpenShift
RUN chown -R 1001:1001 /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Switch to non-root user (OpenShift requirement)
USER 1001

# Expose port 8080 (OpenShift default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]