FROM node:20.15-alpine
WORKDIR /service

COPY ./package.json ./yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

CMD ["yarn", "start"]