const character = document.getElementById('character');
const question = document.getElementById('question');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const playArea = document.getElementById('play-area');
const gameOverElement = document.getElementById('game-over');
const gameOverText = document.getElementById('game-over-text');
const scoreText = document.getElementById('score-text');
const restartText = document.getElementById('restart-text');
const highScoreText = document.getElementById('high-score-text');

let score = 0;
let lives = 3;
let activeStars = [];
let gameActive = true;
let fallingIntervals = [];
let fallSpeed = 50; // Initial falling speed
let powerUpActive = false;

const problems = [
    { question: 'd/dx (x^2) = ?', correct: '2x', wrong: 'x^2' },
    { question: 'd/dx (sin(x)) = ?', correct: 'cos(x)', wrong: 'sin(x)' },
    { question: 'd/dx (e^x) = ?', correct: 'e^x', wrong: 'x*e^x' },
    { question: 'd/dx (ln(x)) = ?', correct: '1/x', wrong: 'ln(x)' },
    { question: 'd/dx (arccos(cos(x))) = ?', correct: 'sin(x)', wrong: 'sec(x)' },
    { question: 'd/dx (x^2+3) = ?', correct: '2x', wrong: '2x+3' },
    { question: 'd/dx (2pi) = ?', correct: '0', wrong: '2' },
    { question: 'd/dx ((2/3)x^9) = ?', correct: '6x^8', wrong: '3x^8' },
    { question: '∫ 2x dx', correct: 'x^2+C', wrong: 'x^3+C' },
    { question: '∫ 3x^2 dx', correct: 'x^3+C', wrong: '3x^2' },
    { question: '∫ (1/x) dx', correct: 'ln|x|+C', wrong: 'ln(x^2)+C' },
    { question: '∫ e^x dx', correct: 'e^x+C', wrong: 'e^(2x)+C' },
    { question: '∫ (sin(x)) dx', correct: '-cos(x)+C', wrong: 'cos(x)' },
    { question: '∫ (cos(x)) dx', correct: 'sin(x)+C', wrong: 'tan(x)+C' },
    { question: '∫ (1/x^2) dx', correct: '-1/x+C', wrong: '1/x+C' },
    { question: '∫ (1/(x^2+1)) dx', correct: 'arctan(x)+C', wrong: 'tan(x)+C' },
    { question: '∫ (x/x^2) dx', correct: 'ln|x|+C', wrong: 'ln(x)+C' },
    { question: '∫ (x/(x^2+1)) dx', correct: '1/2 ln(x^2+1)+C', wrong: 'ln(x)+C' },
];

function generateProblem() {
    if (activeStars.length === 0 && gameActive) {
        const problem = problems[Math.floor(Math.random() * problems.length)];
        question.textContent = problem.question;
        createStar(problem.correct, true);
        createStar(problem.wrong, false);
    }
    // Spawn the power-up if score is a multiple of 50 and there isn't an active power-up
    if (score % 50 === 0 && score > 0 && !powerUpActive) {
        activateLifePowerUp();
    }
}

function createStar(answer, isCorrect) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.textContent = answer;
    playArea.appendChild(star);

    let starX, starY;
    let maxAttempts = 10;
    let attempts = 0;
    do {
        // Try random placement
        starX = Math.random() * (playArea.clientWidth - 100);
        starY = -100; // Off-screen top
        star.style.left = starX + 'px';
        star.style.top = starY + 'px';
        attempts++;
    } while (checkOverlap(star) && attempts < maxAttempts);

    // Fallback to fixed positions if overlapping
    if (checkOverlap(star)) {
        let positions = getFixedPositions();
        for (let pos of positions) {
            starX = pos.x;
            starY = pos.y;
            star.style.left = starX + 'px';
            star.style.top = starY + 'px';
            if (!checkOverlap(star)) break;
        }
    }

    activeStars.push({ element: star, isCorrect });

    animateStar(star, isCorrect);
}

function checkOverlap(newStar) {
    const newStarRect = newStar.getBoundingClientRect();
    return activeStars.some(starObj => {
        const starRect = starObj.element.getBoundingClientRect();
        return !(
            newStarRect.right < starRect.left ||
            newStarRect.left > starRect.right ||
            newStarRect.bottom < starRect.top ||
            newStarRect.top > starRect.bottom
        );
    });
}

function getFixedPositions() {
    return [
        { x: 50, y: 0 },
        { x: 150, y: 0 },
        { x: 250, y: 0 },
        { x: 350, y: 0 },
        { x: 450, y: 0 },
    ];
}

function animateStar(star, isCorrect) {
    let position = 0;
    const interval = setInterval(() => {
        if (!gameActive) {
            clearInterval(interval);
            return;
        }
        if (position >= playArea.clientHeight - 60) {
            clearInterval(interval);
            if (isCorrect) {
                lives -= 1;
                updateLivesAndScore();
            }
            removeAllStars();
            generateProblem();
        } else {
            position += 5;
            star.style.top = position + 'px';
            checkCollision(star, isCorrect, interval);
        }
    }, fallSpeed);
    fallingIntervals.push(interval);
}

let scoreMultiplierActive = false;
let speedBoostActive = false;

function activateScoreMultiplier() {
    if (!scoreMultiplierActive) {
        scoreMultiplierActive = true;
        setTimeout(deactivateScoreMultiplier, 10000); // Power-up lasts for 10 seconds (adjust duration as needed)
        // Add visual feedback to indicate that the power-up is active (e.g., change color or display an icon)
        setTimeout(() => {
            scoreMultiplierActive = false;
            // Remove visual feedback for the end of the power-up
        }, 10000);
    }
}

function deactivateScoreMultiplier() {
    scoreMultiplierActive = false;
    // Remove visual feedback for the end of the power-up
}

function activateSpeedBoost() {
    if (!speedBoostActive) {
        speedBoostActive = true;
        character.style.transition = 'left 0.05s'; // Increase movement speed
        setTimeout(deactivateSpeedBoost, 10000); // Power-up lasts for 10 seconds (adjust duration as needed)
        // Add visual feedback to indicate that the power-up is active (e.g., change color or display an icon)
        setTimeout(() => {
            speedBoostActive = false;
            character.style.transition = 'left 0.1s'; // Reset movement speed
            // Remove visual feedback for the end of the power-up
        }, 10000);
    }
}

function deactivateSpeedBoost() {
    speedBoostActive = false;
    character.style.transition = 'left 0.1s'; // Reset movement speed
    // Remove visual feedback for the end of the power-up
}

// Update collision detection to handle power-ups
function checkCollision(star, isCorrect, interval) {
    const characterRect = character.getBoundingClientRect();
    const starRect = star.getBoundingClientRect();

    if (
        starRect.bottom >= characterRect.top &&
        starRect.top <= characterRect.bottom &&
        starRect.left <= characterRect.right &&
        starRect.right >= characterRect.left
    ) {
        clearInterval(interval);
        fallingIntervals = fallingIntervals.filter(int => int !== interval);
        if (isCorrect) {
            if (scoreMultiplierActive) {
                score += 20; // Double the score
            } else {
                score += 10;
            }
            updateFallSpeedAndBackground();
            // Play "ding" sound effect
            // Randomly activate power-ups
            const random = Math.random();
            if (random < 0.1) { // Adjust probability as needed
                activateScoreMultiplier();
            } else if (random < 0.2) { // Adjust probability as needed
                activateSpeedBoost();
            }
        } else {
            lives -= 1;
        }
        updateLivesAndScore();
        removeAllStars();
        generateProblem();
    }
}

function updateFallSpeedAndBackground() {
    if (score >= 250) {
        fallSpeed = 20; // Falling speed for score >= 250
        document.body.style.background = 'linear-gradient(to bottom, rgba(255, 0, 0, 0.8), rgba(0, 0, 0, 0.8))'; // Red gradient
    } else if (score >= 150) {
        fallSpeed = 30; // Falling speed for score >= 150
        document.body.style.background = 'linear-gradient(to bottom, rgba(0, 255, 0, 0.8), rgba(0, 0, 255, 0.8))'; // Green to blue gradient
    } else if (score >= 70) {
        fallSpeed = 40; // Falling speed for score >= 70
        document.body.style.background = 'linear-gradient(to bottom, rgba(205, 125, 225, 0.8), rgba(0, 0, 255, 0.8))'; // Original gradient
    }
}

function removeAllStars() {
    activeStars.forEach(({ element }) => {
        playArea.removeChild(element);
    });
    activeStars = [];
    fallingIntervals.forEach(interval => clearInterval(interval));
    fallingIntervals = [];
}

function updateLivesAndScore() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;

    if (lives <= 0) {
        endGame();
    }
}

function endGame() {
    gameActive = false;
    gameOverText.textContent = 'Game Over';
    scoreText.textContent = `Your score was: ${score}`;
    restartText.textContent = 'Click to play again';
    gameOverElement.style.display = 'flex';
    const highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
        localStorage.setItem('highScore', score);
        highScoreText.textContent = `New High Score: ${score}!`;
    } else {
        highScoreText.textContent = `High Score: ${highScore}`;
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    fallSpeed = 50; // Reset falling speed
    document.body.style.background = 'linear-gradient(to bottom, rgba(205, 125, 225, 0.8), rgba(0, 0, 255, 0.8))'; // Reset gradient
    gameActive = true;
    updateLivesAndScore();
    gameOverElement.style.display = 'none';
    generateProblem();
}

document.addEventListener('mousemove', (e) => {
    if (gameActive) {
        let mouseX = e.clientX - playArea.offsetLeft;
        const characterWidth = character.clientWidth;
        if (mouseX < 0) mouseX = 0;
        if (mouseX > playArea.clientWidth - 50) mouseX = playArea.clientWidth - 50; // Adjust the limit based on the character's width
        character.style.left = mouseX + 'px';
    }
});

document.addEventListener('touchmove', (e) => {
    if (gameActive) {
        let touchX = e.touches[0].clientX - playArea.offsetLeft;
        if (touchX < 0) touchX = 0;
        if (touchX > playArea.clientWidth - 50) touchX = playArea.clientWidth - 50;
        character.style.left = touchX + 'px';
    }
});

gameOverElement.addEventListener('click', () => {
    if (!gameActive) {
        resetGame();
    }
});

generateProblem();
