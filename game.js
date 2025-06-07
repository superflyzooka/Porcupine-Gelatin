// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

let player = {
    x: GAME_WIDTH / 2 - 25, // Initial x position (centered)
    y: GAME_HEIGHT / 2 - 25, // Initial y position (centered)
    width: 128, // Placeholder width for the sprite
    height: 128, // Placeholder height for the sprite
    speed: 5, // Pixels per frame
    level: 1, // Player's current level
    isBlinking: false, // State for blinking animation
    blinkTimer: 0,
    blinkDuration: 1000, // Blink duration in milliseconds
    blinkInterval: 3000 // Time between blinks in milliseconds
};

// Image objects for the sprite
const spriteImageEyesOpen = new Image();
const spriteImageEyesClosed = new Image();

// Flag to ensure images are loaded before drawing
let imagesLoaded = 0;
const totalImages = 2;

// Keyboard input state
let keys = {};

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Game Initialization ---
function initGame() {
    // Set the source for your sprite images
    // IMPORTANT: Replace 'path/to/your/eyes_open.png' and 'path/to/your/eyes_closed.png'
    // with the actual paths to your image files.
    spriteImageEyesOpen.src = 'PorcupineGelatinCO.png';
    spriteImageEyesClosed.src = 'PorcupineGelatinCC.png';

    spriteImageEyesOpen.onload = () => {
        imagesLoaded++;
        checkImagesLoaded();
    };
    spriteImageEyesClosed.onload = () => {
        imagesLoaded++;
        checkImagesLoaded();
    };
}

function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        // Once all images are loaded, start the game loop
        console.log("All images loaded. Starting game loop.");
        // Adjust player width/height based on actual image dimensions if needed
        // player.width = spriteImageEyesOpen.width;
        // player.height = spriteImageEyesOpen.height;
        gameLoop();
    }
}

// --- Game Loop ---
function gameLoop(timestamp) {
    update(timestamp); // Update game state
    draw(); // Draw everything to the canvas
    requestAnimationFrame(gameLoop); // Request the next frame
}

// --- Update Game State ---
function update(timestamp) {
    // Calculate delta time for consistent movement across different frame rates
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // --- Movement Logic ---
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        player.y += player.speed;
    }
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        player.x -= player.speed;
    }
    if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        player.x += player.speed;
    }

    // Keep player within canvas bounds
    player.x = Math.max(0, Math.min(player.x, GAME_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, GAME_HEIGHT - player.height));

    // --- Blinking Logic ---
    // If not currently blinking, accumulate time towards the next blink interval
    if (!player.isBlinking) {
        player.blinkTimer += deltaTime;
        if (player.blinkTimer >= player.blinkInterval) {
            player.isBlinking = true;
            player.blinkTimer = 0; // Reset timer to track blink duration
        }
    } else {
        // If currently blinking, accumulate time for the blink duration
        player.blinkTimer += deltaTime;
        if (player.blinkTimer >= player.blinkDuration) {
            player.isBlinking = false; // Blink is over
            player.blinkTimer = 0; // Reset timer for the next interval
        }
    }
}

// --- Draw Game Elements ---
let lastTimestamp = 0; // To calculate delta time

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw the player sprite
    let currentSpriteImage = player.isBlinking ? spriteImageEyesClosed : spriteImageEyesOpen;
    ctx.drawImage(currentSpriteImage, player.x, player.y, player.width, player.height);

    // Draw level text (for now)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${player.level}`, 10, 30);
}

// Start the game
initGame();