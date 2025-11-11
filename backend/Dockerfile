# Use Node LTS slim image
FROM node:18-slim

# Set working directory
WORKDIR /usr/src/app

# Install build tools for native modules (needed for some npm packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies (including nodemon)
RUN npm install

# Copy rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the app using nodemon
CMD ["npm", "run", "dev"]
