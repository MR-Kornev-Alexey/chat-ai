# Используем образ с Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем исходный код в контейнер
COPY . .

# Компилируем проект из TypeScript в JavaScript
RUN npm run build

# Запускаем приложение
CMD ["npm", "start"]
