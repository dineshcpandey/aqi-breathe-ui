# Use a base image with Node.js
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Set the user (OpenShift typically uses user ID 1001)
RUN chown -R 1001:1001 /app
USER 1001

# Copy the rest of the application
COPY --chown=1001:1001 . .

# Disable eslint caching if needed
ENV DISABLE_ESLINT_PLUGIN=true

# Start the app
CMD ["npm", "start"]