FROM node:16

WORKDIR /usr/src/app

# Install dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

# Generate Prisma client
COPY prisma ./prisma
RUN yarn run genprisma

# Bundle app source
COPY . .

# Build TypeScript app
RUN yarn run build

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
