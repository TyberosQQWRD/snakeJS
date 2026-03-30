const readline = require('readline');

const FIELD_SIZE = 20;
const INITIAL_SNAKE = [
    { X: 10, Y: 10 },
    { X: 9, Y: 10 },
    { X: 8, Y: 10 }
];
const INITIAL_DIRECTION = 'RIGHT';
const OBSTACLE_INCREASE_INTERVAL = 5;

let snake = [];
let direction = INITIAL_DIRECTION;
let nextDirection = INITIAL_DIRECTION;
let food = null;
let obstacles = [];
let score = 0;
let applesEaten = 0;
let nextScoreIncrement = 10;
let gameRunning = true;
let gameLoop = null;

// настройка ввода
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

// очистка консоли
function clearConsole() {
    console.clear();
}

// генерация случайной позиции на поле
function getRandomPosition() {
    return {
        X: Math.floor(Math.random() * FIELD_SIZE),
        Y: Math.floor(Math.random() * FIELD_SIZE)
    };
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
    if (snake.length + obstacles.length >= FIELD_SIZE * FIELD_SIZE) {
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
            for (let y = 0; y < FIELD_SIZE; y++) {
                for (let x = 0; x < FIELD_SIZE; x++) {
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
    const newObstacleCount = Math.floor(applesEaten / OBSTACLE_INCREASE_INTERVAL);
    // когда съедается пятое яблоко, добавляем еще одно препятствие
    if (newObstacleCount > currentObstacleCount) {
        const obstaclesToAdd = newObstacleCount - currentObstacleCount;
        const newObstacles = generateObstacles(obstaclesToAdd);
        obstacles.push(...newObstacles);
    }
}

// проверка столкновения со стеной
function checkWallCollision(head) {
    return head.X < 0 || head.X >= FIELD_SIZE || head.Y < 0 || head.Y >= FIELD_SIZE;
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
    const grid = Array(FIELD_SIZE).fill().map(() => Array(FIELD_SIZE).fill(' '));
    
    // размещаем препятствия
    obstacles.forEach(obstacle => {
        if (obstacle.X >= 0 && obstacle.X < FIELD_SIZE && 
            obstacle.Y >= 0 && obstacle.Y < FIELD_SIZE) {
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
    console.log('─'.repeat(FIELD_SIZE * 2 + 3));
    console.log(` Счет: ${score}  |  Длина: ${snake.length}  |  Следующее яблоко: +${nextScoreIncrement}`);
    console.log('─'.repeat(FIELD_SIZE * 2 + 3));
    
    // выводим поле
    for (let y = 0; y < FIELD_SIZE; y++) {
        let row = '│ ';
        for (let x = 0; x < FIELD_SIZE; x++) {
            row += grid[y][x] + ' ';
        }
        row += '│';
        console.log(row);
    }
    
    // выводим нижнюю границу
    console.log('─'.repeat(FIELD_SIZE * 2 + 3));
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
    score = 0;
    applesEaten = 0;
    nextScoreIncrement = 10;
    gameRunning = true;
    obstacles = [];
    
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
    }, 150);
    
    renderGame();
}

// перезапуск игры
function restartGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    startGame();
}

// обработка ввода с клавиатуры
process.stdin.on('keypress', (str, key) => {
    if (!gameRunning) {
        if (key.name === 'r') {
            restartGame();
        }
        return;
    }
    
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

// обработка выхода
process.on('SIGINT', () => {
    console.log('\nИгра завершена');
    process.exit();
});