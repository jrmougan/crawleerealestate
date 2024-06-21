# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM node:lts-bullseye-slim
LABEL org.opencontainers.image.source=https://github.com/jrmougan/crawleerealestate

WORKDIR /app

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./

# Arm custom package
RUN if [ "$(uname -m)" = "armv7l" ]; then \
    echo "Running on ARMv7 architecture"; \
    apt-get update; \
    apt-get install -y python3 build-essential; \
fi

# Install all dependencies. Don't audit to speed up the installation.
RUN npm install --include=dev --audit=false

# Next, copy the source files using the user set
# in the base image.
COPY . ./



# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN npm run build


# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version


COPY ./src/public ./dist/public
# Run the image. If you know you won't need headful browsers,
# you can remove the XVFB start script for a micro perf gain.
RUN npx playwright install-deps  
CMD npm run start:prod --silent

expose 3000
