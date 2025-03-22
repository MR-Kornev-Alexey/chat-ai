# Используем образ с Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем схему Prisma и остальные файлы проекта
COPY prisma ./prisma
COPY . .

# Генерируем Prisma Client в контейнере
RUN npx prisma generate

# Запуск приложения
CMD ["npm", "start"]
