import readline from 'readline';

const INITIAL_SNAKE = [
    { X: 10, Y: 10 },
    { X: 9, Y: 10 },
    { X: 8, Y: 10 }
];
const INITIAL_DIRECTION = 'RIGHT';

let direction = INITIAL_DIRECTION;
let nextDirection = INITIAL_DIRECTION;
let food = null;
let score = 0;
let nextScoreIncrement = 10;
let gameRunning = true;
let gameLoop = null;
let obstacles = [];
let applesEaten = 0;
let snake = [];

import {clearConsole, getRandomPosition} from "./snakeBasicFunctions.js"
import data from './data.json' with { type: 'json' };

// настройка ввода
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

// проверка столкновения со стеной
function checkWallCollision(head) {
    return head.X < 0 || head.X >= data.gridSize || head.Y < 0 || head.Y >= data.gridSize;
}
// проверка столкновения с собой или препятствиями
function checkCollision(head) {
    // проверка на столкновение с телом (исключаем голову при движении)
    if (snake.some((segment, index) => index > 0 && segment.X === head.X && segment.Y === head.Y)) {
        return true;
    }
    // проверка на столкновение с препятствиями
    if (obstacles.some(obstacle => obstacle.X === head.X && obstacle.Y === head.Y)) {
        return true;
    }
    return false;
}

// генерация препятствий
function generateObstacles(count) {
    const newObstacles = [];
    let generated = 0;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (generated < count && attempts < maxAttempts) {
        const pos = getRandomPosition();
        if (!isPositionOccupied(pos.X, pos.Y, true) && 
            !(food && food.X === pos.X && food.Y === pos.Y)) {
            newObstacles.push(pos);
            generated++;
        }
        attempts++;
    }
    
    return newObstacles;
}

// добавление новых препятствий
function addObstacles() {
    const currentObstacleCount = obstacles.length;
    // когда съедается пятое яблоко, добавляем еще одно препятствие
    const newObstacleCount = Math.floor(applesEaten / data.obstacleCreationInterval);
    if (newObstacleCount > currentObstacleCount) {
        const obstaclesToAdd = newObstacleCount - currentObstacleCount;
        const newObstacles = generateObstacles(obstaclesToAdd);
        obstacles.push(...newObstacles);
    }
}

// проверка, занята ли позиция змеей или препятствиями
function isPositionOccupied(x, y, includeSnake = true) {
    if (includeSnake && snake.some(segment => segment.X === x && segment.Y === y)) {
        return true;
    }
    if (obstacles.some(obstacle => obstacle.X === x && obstacle.Y === y)) {
        return true;
    }
    return false;
}

// генерация яблочек
function generateApple() {
    if (snake.length + obstacles.length >= data.gridSize * data.gridSize) {
        gameRunning = false;
        clearConsole();
        console.log('Поздравляем! Вы заполнили всё поле!');
        console.log(`Финальный счет: ${score}`);
        console.log('\nНажмите R для перезапуска или Q для выхода');
        return false;
    }
    
    let newFood = null;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
        newFood = getRandomPosition();
        attempts++;
        if (attempts > maxAttempts) {
            // если не можем быстро найти свободное место, ищем вручную
            for (let y = 0; y < data.gridSize; y++) {
                for (let x = 0; x < data.gridSize; x++) {
                    if (!isPositionOccupied(x, y)) {
                        newFood = { X: x, Y: y };
                        break;
                    }
                }
                if (newFood) break;
            }
        }
    } while (isPositionOccupied(newFood.X, newFood.Y, true) && attempts <= maxAttempts);
    
    food = newFood;
    return true;
}

// движение змеи
function moveSnake() {
    // применяем новое направление, если оно не противоположно текущему
    if (nextDirection) {
        const isOpposite = (
            (direction === 'RIGHT' && nextDirection === 'LEFT') ||
            (direction === 'LEFT' && nextDirection === 'RIGHT') ||
            (direction === 'UP' && nextDirection === 'DOWN') ||
            (direction === 'DOWN' && nextDirection === 'UP')
        );
        
        if (!isOpposite) {
            direction = nextDirection;
        }
    }
    
    // вычисляем новое положение головы
    const head = snake[0];
    let newHead = { ...head };
    
    switch (direction) {
        case 'RIGHT':
            newHead.X++;
            break;
        case 'LEFT':
            newHead.X--;
            break;
        case 'UP':
            newHead.Y--;
            break;
        case 'DOWN':
            newHead.Y++;
            break;
    }
    
    // проверка на съедание яблочка
    const willEatFood = food && newHead.X === food.X && newHead.Y === food.Y;
    
    // двигаем змею
    if (willEatFood) {
        // добавляем новую голову
        snake.unshift(newHead);
        // увеличиваем счет
        score += nextScoreIncrement;
        nextScoreIncrement += 10;
        applesEaten++;
        
        // генерируем новую еду
        if (!generateApple()) {
            return false;
        }
        
        // добавляем препятствия каждые 5 яблочек
        addObstacles();
    } else {
        // добавляем новую голову и удаляем хвост
        snake.unshift(newHead);
        snake.pop();
    }
    
    // проверяем столкновения после движения
    if (checkWallCollision(snake[0]) || checkCollision(snake[0])) {
        gameRunning = false;
        clearConsole();
        console.log('Игра окончена!');
        console.log(`Счет: ${score}`);
        console.log('\nНажмите R для перезапуска или Q для выхода');
        return false;
    }
    
    return true;
}

// создание игрового поля
function renderGame() {
    clearConsole();
    
    // создаем пустое поле
    const grid = Array(data.gridSize).fill().map(() => Array(data.gridSize).fill(' '));
    
    // размещаем препятствия
    obstacles.forEach(obstacle => {
        if (obstacle.X >= 0 && obstacle.X < data.gridSize && 
            obstacle.Y >= 0 && obstacle.Y < data.gridSize) {
            grid[obstacle.Y][obstacle.X] = '#';
        }
    });
    
    // размещаем еду
    if (food) {
        grid[food.Y][food.X] = '*';
    }
    
    // размещаем змею
    snake.forEach((segment, index) => {
        if (index === 0) {
            grid[segment.Y][segment.X] = '@';
        } else {
            grid[segment.Y][segment.X] = 'o';
        }
    });
    
    // выводим верхнюю границу и информацию
    console.log('─'.repeat(data.gridSize * 2 + 3));
    console.log(` Счет: ${score}  |  Длина: ${snake.length}  |  Следующее яблоко: +${nextScoreIncrement}`);
    console.log('─'.repeat(data.gridSize * 2 + 3));
    
    // выводим поле
    for (let y = 0; y < data.gridSize; y++) {
        let row = '│ ';
        for (let x = 0; x < data.gridSize; x++) {
            row += grid[y][x] + ' ';
        }
        row += '│';
        console.log(row);
    }
    
    // выводим нижнюю границу
    console.log('─'.repeat(data.gridSize * 2 + 3));
    console.log('\nУправление: ↑ ↓ ← → | R - перезапуск | Q - выход');
}

// основной игровой цикл
function gameTick() {
    if (!gameRunning) return;
    
    const success = moveSnake();
    if (success) {
        renderGame();
    }
}

// запуск игры
function startGame() {
    // сброс состояния
    snake = INITIAL_SNAKE.map(segment => ({ ...segment }));
    direction = INITIAL_DIRECTION;
    nextDirection = INITIAL_DIRECTION;
    obstacles = [];
    applesEaten = 0;
    score = 0;
    nextScoreIncrement = 10;
    gameRunning = true;
    
    // генерация начальных препятствий
    addObstacles();
    
    // генерация первого яблочка
    generateApple();
    
    // очищаем предыдущий интервал если есть
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    // запускаем игровой цикл
    gameLoop = setInterval(() => {
        gameTick();
    }, data.gameSpeed);
    
    renderGame();
}

// перезапуск игры
function restartGame() {
    clearConsole()
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    startGame();
}

// обработка ввода с клавиатуры
process.stdin.on('keypress', (str, key) => {
    switch (key.name) {
        case 'up':
            nextDirection = 'UP';
            break;
        case 'down':
            nextDirection = 'DOWN';
            break;
        case 'left':
            nextDirection = 'LEFT';
            break;
        case 'right':
            nextDirection = 'RIGHT';
            break;
        case 'r':
            restartGame();
            break;
        case 'q':             
            console.log('\nИгра завершена');
            process.exit();
    }
});

// запускаем игру
console.log('Змейка загружается...');
startGame();
