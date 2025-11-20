# Development container
FROM node:20-alpine

# Accept build arguments for user ID and group ID
ARG USER_UID=1000
ARG USER_GID=1000

WORKDIR /app

# Install development tools
RUN apk add --no-cache git bash

# Copy package files
COPY package.json ./
COPY tsconfig.json ./
COPY nodemon.json ./
COPY public-openapi.json ./
COPY openapi.json ./

# Install all dependencies
RUN npm install -g nodemon ts-node && \
    npm install

# Copy source code
COPY src ./src

# Create user based on host UID/GID
RUN if [ "$USER_UID" = "1000" ] && [ "$USER_GID" = "1000" ]; then \
        echo "Using existing node user"; \
    else \
        addgroup -g $USER_GID appuser && \
        adduser -u $USER_UID -G appuser -s /bin/sh -D appuser; \
    fi

# Change ownership
RUN if [ "$USER_UID" = "1000" ] && [ "$USER_GID" = "1000" ]; then \
        chown -R node:node /app; \
    else \
        chown -R appuser:appuser /app; \
    fi

# Switch to appropriate user
USER ${USER_UID}:${USER_GID}

# Set the working directory for the user
WORKDIR /app

# Expose port
EXPOSE 3000

# Health check - uses PORT env var, defaults to 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;require('http').get('http://localhost:'+port+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Start application in development mode with hot reloading
CMD ["npm", "run", "dev"]
