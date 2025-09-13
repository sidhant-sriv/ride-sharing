# Use an official Bun image as a parent image
FROM oven/bun:1 as base

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install app dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate prisma client
RUN bunx prisma generate

# The port the application will run on
EXPOSE 3000

# The command to start the server
CMD ["bun", "run", "index.ts"]
