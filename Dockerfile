# Используем официальный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости (npm ci для чистой установки)
RUN npm ci

# Копируем весь исходный код в контейнер
COPY . .

# Обновляем Prisma и генерируем клиента
RUN npx prisma generate

# Запускаем приложение
CMD ["npm", "start"]
