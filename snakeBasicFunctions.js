import data from './data.json' with { type: 'json' };
// очистка консоли
export function clearConsole() {
    console.clear();
}

// генерация случайной позиции на поле
export function getRandomPosition() {
    return {
        X: Math.floor(Math.random() * data.gridSize),
        Y: Math.floor(Math.random() * data.gridSize)
    };
}