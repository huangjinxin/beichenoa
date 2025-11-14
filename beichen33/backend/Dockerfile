FROM node:18-alpine

RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 重新构建原生模块以确保架构兼容
RUN npm rebuild bcrypt --build-from-source

RUN npx prisma generate

EXPOSE 8891

CMD ["npm", "run", "start:dev"]
