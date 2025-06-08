// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let GAME_WIDTH;
let GAME_HEIGHT;

let player = {
    x: 0, // Initial x position (will be set after dimensions are known)
    y: 0, // Initial y position (will be set after dimensions are known)
    width: 64, // Visual width for the sprite
    height: 64, // Visual height for the sprite
    playerHitboxWidth: 40, // Smaller hitbox width for the player
    playerHitboxHeight: 40, // Smaller hitbox height for the player
    speed: 5, // Pixels per frame
    level: 0, // Player's current level
    xp: 0, // Player's current experience points
    xpToNextLevel: 100, // XP required for the next level
    isBlinking: false, // State for blinking animation
    blinkTimer: 0,
    blinkDuration: 150, // Blink duration in milliseconds
    blinkInterval: 3000, // Time between blinks in milliseconds
    name: "Gelo-pine", // Default name, will be overwritten by user input

    // --- NEW Player Properties for Progression Systems ---
    baseLevel: 0, // Level of the player's base
    memoriesFound: [], // Array to store IDs of found memories
    unlockedElements: [], // Array to store unlocked elemental abilities
    guild: { // Player's guild object
        name: "",
        level: 0,
        reputation: 0,
        members: [],
        xp: 0, // Guild XP
        xpToNextLevel: 200 // Initial XP for guild level 1
    },
    inventory: {}, // Simple inventory for resources and crafted items
    legacy: null // Stores legacy data for New Game+
};

// Array to hold our collectible items (now also holds memories)
let items = [];

// Item properties
const ITEM_SIZE = 12; // Adjusted: Smaller size for the XP orb
const XP_PER_ORB = 25; // XP gained per orb
const MAX_ITEMS = 5; // Maximum number of XP orbs on screen at once

// Image objects for the sprite
const spriteImageEyesOpen = new Image();
const spriteImageEyesClosed = new Image();

// Flag to ensure images are loaded before drawing
let imagesLoaded = 0;
const totalImages = 2; // Only 2 sprite images now, no background image to load

// Keyboard input state
let keys = {};

// Array to store static grass tuft positions
let grassTufts = [];
const NUM_TUFTS = 200; // Number of tufts to generate
const TUFT_LENGTH = 10; // Max length of a tuft

// --- World Definitions ---
const worlds = [
    {
        name: "Grassy Plains",
        minPlayerLevel: 0, // Player starts here
        backgroundColor1: '#4CAF50', // Darker green
        backgroundColor2: '#66BB6A', // Lighter green
        backgroundColor3: '#81C784', // Even lighter green
        tuftColor: '#388E3C' // Darker green for tufts
    },
    {
        name: "Sandy Dunes",
        minPlayerLevel: 3, // Player needs to reach level 3 to enter this world
        backgroundColor1: '#FFEB3B', // Darker sand yellow
        backgroundColor2: '#FFC107', // Lighter sand orange
        backgroundColor3: '#FFD700', // Even lighter gold
        tuftColor: '#D32F2F' // Reddish brown for small desert plants/rocks
    },
    {
        name: "Azure Coast",
        minPlayerLevel: 6, // Player needs to reach level 6 to enter this world
        backgroundColor1: '#2196F3', // Deep blue water
        backgroundColor2: '#03A9F4', // Lighter blue water
        backgroundColor3: '#81D4FA', // Even lighter blue/sky
        tuftColor: '#FFFFFF' // White for foam or small shells/coral
    }
    // Add more worlds as you like!
];

let currentWorldIndex = 0; // Tracks the currently active world

// --- Transition Variables ---
let transitionState = 'idle'; // 'idle', 'fadingOut', 'displayingText', 'fadingIn'
let transitionTimer = 0;
const FADE_DURATION = 1000; // 1 second for fade in/out
const TEXT_DISPLAY_DURATION = 1500; // 1.5 seconds for "World X" text
let transitionWorldName = ""; // The name of the world being transitioned to

// --- In-Game Command Input Variables ---
let inGameCommandMode = false; // True when the command input box is active
let commandInputBuffer = ""; // Stores the typed command
const COMMAND_INPUT_MAX_LENGTH = 30; // Limit command length

// --- NEW SYSTEM VARIABLES ---

// --- Base Building Variables ---
const BASE_BUILDING_COSTS = [
    { level: 1, xp: 500, materials: { wood: 50 } },
    { level: 2, xp: 1500, materials: { wood: 100, stone: 50 } },
    { level: 3, xp: 3000, materials: { wood: 200, stone: 100, metal: 20 } }
];
let basePosition = { x: 50, y: 50, width: 100, height: 100 }; // Placeholder position for the base
// NOTE: Base position will need to be made dynamic relative to player/screen.

// --- Memory Weaving Variables ---
let memories = [
    { id: 'memory_001', found: false, x: 0, y: 0, size: 15, narrative: "A faint echo of laughter..." },
    { id: 'memory_002', found: false, x: 0, y: 0, size: 15, narrative: "The scent of ancient dust and forgotten dreams." },
    { id: 'memory_003', found: false, x: 0, y: 0, size: 15, narrative: "A glimpse of a towering, silent guardian." }
];
const MAX_MEMORIES = 3; // Max number of memories on screen at once
let currentNarrativeDisplay = ""; // Stores narrative text to display
let narrativeDisplayTimer = 0;
const NARRATIVE_DISPLAY_DURATION = 3000; // 3 seconds to display narrative

// --- Environmental Manipulation Variables ---
const ELEMENTAL_ABILITIES = [
    { name: "Wind Gust", minLevel: 1, effect: "Pushes enemies", cooldown: 5000 },
    { name: "Stone Wall", minLevel: 4, effect: "Creates temporary barrier", cooldown: 8000 },
    { name: "Healing Bloom", minLevel: 7, effect: "Heals player over time", cooldown: 10000 }
];
let activeElementalEffect = null; // Currently active short-term effect
let elementalCooldowns = {}; // Tracks cooldowns for abilities

// --- Guild System Variables ---
const GUILD_INITIAL_XP_TO_LEVEL = 200;
const GUILD_XP_MULTIPLIER = 1.8;
let guildLevelUpText = "";
let guildLevelUpTextTimer = 0;
const GUILD_TEXT_DURATION = 2000;

// --- Economy & Crafting Variables ---
const CRAFTING_RECIPES = {
    "wood_plank": { materials: { wood: 10 }, yields: { wood_plank: 1 }, time: 1000 },
    "basic_tool": { materials: { wood_plank: 5, metal: 2 }, yields: { basic_tool: 1 }, time: 2000 }
};
const RESOURCE_TYPES = ['wood', 'stone', 'metal'];
let craftingQueue = []; // For items being crafted (array of {recipeName, timeRemaining, yields})

// --- Cosmic Alignment Variables ---
const COSMIC_ALIGNMENTS = [
    { name: "Lunar Bloom", duration: 60000, effect: "Increased item spawn rate", triggers: { itemSpawnRate: 1.5 } },
    { name: "Solar Flare", duration: 45000, effect: "Player speed boost", triggers: { playerSpeedMultiplier: 1.2 } }
];
let activeCosmicAlignment = null;
let cosmicAlignmentTimer = 0;
const COSMIC_ALIGNMENT_CHECK_INTERVAL = 30000; // Check every 30 seconds to see if a new alignment should trigger
let lastCosmicAlignmentCheck = 0;

// --- RESOURCE GATHERING VARIABLES (Trees) ---
let trees = []; // Array to hold tree objects
const NUM_TREES_PER_WORLD = 10; // Number of trees to spawn per world
const TREE_SIZE = 40; // Size of the tree sprite/hitbox
const TREE_HEALTH = 100; // Health of a tree before it's chopped
const PUNCH_DAMAGE = 10; // Damage dealt to a tree per punch (or interaction)
const WOOD_PER_TREE = 10; // Amount of wood gained per chopped tree
const TREE_RESPAWN_TIME = 5000; // Time in ms for a chopped tree to respawn

// --- GUI AND MENU VARIABLES ---
let showTeleportMenu = false; // Controls visibility of the teleport menu
let showInventoryGUI = false; // Controls visibility of the inventory GUI (initially false)
const INTERACTION_DISTANCE = 60; // How close player needs to be to interact with objects (e.g., trees)


// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    // If in command mode, capture character inputs
    if (inGameCommandMode) {
        if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s!_]/)) { // Allow letters, numbers, space, underscore, and '!'
            if (commandInputBuffer.length < COMMAND_INPUT_MAX_LENGTH) {
                commandInputBuffer += e.key;
            }
        } else if (e.key === 'Backspace') {
            commandInputBuffer = commandInputBuffer.slice(0, -1); // Remove last character
        } else if (e.key === 'Enter') {
            // Execute command
            if (commandInputBuffer.length > 0) {
                executeAdminCommand(commandInputBuffer);
            }
            // Reset and exit command mode regardless
            commandInputBuffer = "";
            inGameCommandMode = false;
        } else if (e.key === 'Escape') { // Allow Escape to cancel command mode
            commandInputBuffer = "";
            inGameCommandMode = false;
        }
        e.preventDefault(); // Prevent default browser actions (like scrolling with space, or typing in console)
    } else {
        // Normal game movement keys
        keys[e.key] = true;

        // Check for '/' to enter command mode
        if (e.key === '/') {
            inGameCommandMode = true;
            commandInputBuffer = "/"; // Start with the slash
            e.preventDefault(); // Prevent the '/' from being typed outside the game context or causing other issues
        }

        // Toggle Inventory GUI (e.g., 'i' key)
        if (e.key === 'i' || e.key === 'I') {
            toggleInventoryGUI();
        }

        // Toggle Teleport Menu (e.g., 't' key)
        if (e.key === 't' || e.key === 'T') {
            toggleTeleportMenu();
        }

        // Interaction key (e.g., 'e' key)
        if (e.key === 'e' || e.key === 'E') {
            // Check for interaction with trees
            trees.forEach(tree => {
                if (tree.health > 0 && isPlayerNear(tree, INTERACTION_DISTANCE)) {
                    chopTree(tree);
                }
            });
        }
    }
});

// For teleport menu clicks
canvas.addEventListener('click', (e) => {
    if (showTeleportMenu) {
        const menuX = GAME_WIDTH / 2 - 150;
        const menuY = GAME_HEIGHT / 2 - (worlds.length * 30 + 50) / 2; // Center based on number of worlds
        const optionHeight = 30;

        for (let i = 0; i < worlds.length; i++) {
            const world = worlds[i];
            const optionY = menuY + 50 + (i * optionHeight); // 50 for title and padding

            // Check if click is within an option
            if (e.offsetX > menuX && e.offsetX < menuX + 300 &&
                e.offsetY > optionY && e.offsetY < optionY + optionHeight) {

                // Only allow teleport if player level meets minimum or it's the current world
                if (player.level >= world.minPlayerLevel || i === currentWorldIndex) {
                    teleportToWorld(i);
                    toggleTeleportMenu(); // Close menu after teleport
                    break;
                } else {
                    console.log(`Cannot teleport to ${world.name}. Requires player level ${world.minPlayerLevel}.`);
                }
            }
        }
    }
});


window.addEventListener('keyup', (e) => {
    // Only release movement keys if not in command mode
    if (!inGameCommandMode) {
        keys[e.key] = false;
    }
});

// Handle window resizing
window.addEventListener('resize', () => {
    resizeGame();
});


// --- Game Initialization ---
function initGame() {
    // Set initial canvas dimensions based on current window size
    resizeGame();

    // Ask for sprite name
    let chosenName = prompt("What will you name your Gelo-pine?");
    if (chosenName && chosenName.trim() !== "") {
        player.name = chosenName.trim();
    } else {
        player.name = "Gelo-pine"; // Default name if no input or empty input
    }
    console.log(`Your Gelo-pine is named: ${player.name}`);

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

    // --- NEW SYSTEM INITIALIZATION ---
    // Load existing legacy if available (for New Game+)
    loadLegacy();

    // Initialize player inventory
    player.inventory = { wood: 0, stone: 0, metal: 0, basic_tool: 0, wood_plank: 0 }; // Starting resources

    // Initialize guild (name set during player name prompt)
    player.guild.level = 0;
    player.guild.reputation = 0;
    player.guild.xp = 0;
    player.guild.xpToNextLevel = GUILD_INITIAL_XP_TO_LEVEL;

    // Set initial memory positions (random, or could be fixed)
    memories.forEach(memory => {
        memory.x = getRandomInt(0, GAME_WIDTH - memory.size);
        memory.y = getRandomInt(0, GAME_HEIGHT - memory.size);
    });

    // Spawn initial trees for the current world
    spawnTrees();
}

// Function to resize the canvas and update game dimensions
function resizeGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;

    // Reposition player to center of new screen size if game hasn't started yet,
    // or just ensure boundaries if already playing.
    if (player.x === 0 && player.y === 0) { // This condition might be too strict if player starts at 0,0 intentionally
        player.x = GAME_WIDTH / 2 - player.width / 2;
        player.y = GAME_HEIGHT / 2 - player.height / 2;
    } else {
        player.x = Math.max(0, Math.min(player.x, GAME_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, GAME_HEIGHT - player.height));
    }

    // Re-generate grassTufts
    grassTufts = [];
    for (let i = 0; i < NUM_TUFTS; i++) {
        const x = getRandomInt(0, GAME_WIDTH);
        const y = getRandomInt(0, GAME_HEIGHT);
        const length = getRandomInt(5, TUFT_LENGTH); // TUFT_LENGTH is global
        grassTufts.push({ x: x, y: y, length: length });
    }

    // Filter items array
    items = items.filter(item => 
        item.x + item.size > 0 && item.x < GAME_WIDTH &&
        item.y + item.size > 0 && item.y < GAME_HEIGHT
    );

    // Filter trees array
    trees = trees.filter(tree =>
        tree.x + tree.width > 0 && tree.x < GAME_WIDTH &&
        tree.y + tree.height > 0 && tree.y < GAME_HEIGHT
    );

    // Adjust basePosition
    // Example: position base slightly offset from the center of the screen
    basePosition.x = GAME_WIDTH / 2 - basePosition.width / 2 + 50; // Example offset
    basePosition.y = GAME_HEIGHT / 2 - basePosition.height / 2 + 50; // Example offset
    
    // Clamp basePosition to ensure it's not off-screen if it's large
    basePosition.x = Math.max(0, Math.min(basePosition.x, GAME_WIDTH - basePosition.width));
    basePosition.y = Math.max(0, Math.min(basePosition.y, GAME_HEIGHT - basePosition.height));
}

// Function to generate a random number within a range
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to spawn a new XP orb
function spawnItem() {
    // Apply cosmic alignment spawn rate multiplier
    let spawnRateMultiplier = 1;
    if (activeCosmicAlignment && activeCosmicAlignment.triggers.itemSpawnRate) {
        spawnRateMultiplier = activeCosmicAlignment.triggers.itemSpawnRate;
    }

    // Adjust MAX_ITEMS based on multiplier (simple approximation)
    const currentMaxItems = Math.floor(MAX_ITEMS * spawnRateMultiplier);

    if (items.filter(item => item.type === 'xp_orb').length < currentMaxItems) {
        let x = getRandomInt(0, GAME_WIDTH - ITEM_SIZE);
        let y = getRandomInt(0, GAME_HEIGHT - ITEM_SIZE);
        items.push({ x: x, y: y, size: ITEM_SIZE, type: 'xp_orb' }); // Add type for differentiation
    }
}

// Function to spawn memories
function spawnMemories() {
    const unfoundMemories = memories.filter(m => !m.found);
    if (unfoundMemories.length > 0 && items.filter(item => item.type === 'memory').length < MAX_MEMORIES) {
        const memoryToSpawn = unfoundMemories[getRandomInt(0, unfoundMemories.length - 1)];
        // Ensure we don't add the same memory to the items array if it's already there
        if (!items.some(item => item.id === memoryToSpawn.id)) {
            let x = getRandomInt(0, GAME_WIDTH - memoryToSpawn.size);
            let y = getRandomInt(0, GAME_HEIGHT - memoryToSpawn.size);
            items.push({ ...memoryToSpawn, x: x, y: y, type: 'memory' });
        }
    }
}

function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        console.log("All images loaded. Starting game loop.");
        // Initial spawn of items and memories
        for (let i = 0; i < MAX_ITEMS; i++) {
            spawnItem();
        }
        spawnMemories();
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
let lastTimestamp = 0; // Global variable to calculate delta time

function update(timestamp) {
    let deltaTime = 0; // Initialize deltaTime for this frame

    // Calculate delta time for consistent movement across different frame rates
    // This was the fix from the previous session.
    if (timestamp) { 
        if (lastTimestamp === 0) { 
            lastTimestamp = timestamp; 
        } else {
            deltaTime = timestamp - lastTimestamp;
        }
        lastTimestamp = timestamp; 
    }

    // --- Cosmic Alignment Timer Update ---
    cosmicAlignmentTimer += deltaTime;
    lastCosmicAlignmentCheck += deltaTime;

    // Check for new cosmic alignment every interval
    if (lastCosmicAlignmentCheck >= COSMIC_ALIGNMENT_CHECK_INTERVAL) {
        lastCosmicAlignmentCheck = 0;
        triggerCosmicAlignment();
    }

    // Apply active cosmic alignment effects
    if (activeCosmicAlignment) {
        if (cosmicAlignmentTimer >= activeCosmicAlignment.duration) {
            console.log(`Cosmic Alignment "${activeCosmicAlignment.name}" has ended.`);
            activeCosmicAlignment = null; // End the alignment
            cosmicAlignmentTimer = 0;
        } else {
            // Effects are applied during relevant update steps (e.g., player speed in movement)
            // No direct effect application here unless it's a continuous one.
        }
    }

    // --- Transition State Management ---
    if (transitionState !== 'idle') {
        transitionTimer += deltaTime;

        switch (transitionState) {
            case 'fadingOut':
                if (transitionTimer >= FADE_DURATION) {
                    transitionState = 'displayingText';
                    transitionTimer = 0; // Reset timer for text display
                    // After fading out, clear items and spawn new ones for the new world
                    items = []; // Clear all items
                    for (let i = 0; i < MAX_ITEMS; i++) {
                        spawnItem(); // Spawn new XP orbs
                    }
                    spawnMemories(); // Spawn new memories
                    trees = []; // Clear current trees
                    spawnTrees(); // Spawn new trees for the new world
                    // Optional: reposition player to center of new world
                    player.x = GAME_WIDTH / 2 - player.width / 2;
                    player.y = GAME_HEIGHT / 2 - player.height / 2;
                }
                break;
            case 'displayingText':
                if (transitionTimer >= TEXT_DISPLAY_DURATION) {
                    transitionState = 'fadingIn';
                    transitionTimer = 0; // Reset timer for fade in
                }
                break;
            case 'fadingIn':
                if (transitionTimer >= FADE_DURATION) {
                    transitionState = 'idle'; // Transition complete
                    transitionTimer = 0;
                    console.log(`Transition to ${transitionWorldName} complete.`);
                }
                break;
        }
        // When transitioning, skip regular game updates
        return; // IMPORTANT: Stop updating game logic during transition
    }

    // --- Narrative Display Timer ---
    if (currentNarrativeDisplay) {
        narrativeDisplayTimer += deltaTime;
        if (narrativeDisplayTimer >= NARRATIVE_DISPLAY_DURATION) {
            currentNarrativeDisplay = "";
            narrativeDisplayTimer = 0;
        }
    }

    // --- Guild Level Up Text Timer ---
    if (guildLevelUpText) {
        guildLevelUpTextTimer += deltaTime;
        if (guildLevelUpTextTimer >= GUILD_TEXT_DURATION) {
            guildLevelUpText = "";
            guildLevelUpTextTimer = 0;
        }
    }

    // --- Movement Logic ---
    // Only allow movement if not in command input mode, teleport menu, or inventory GUI
    if (!inGameCommandMode && !showTeleportMenu && !showInventoryGUI) {
        let moveAmount = player.speed * (deltaTime / (1000 / 60)); // Base speed on 60 FPS

        // Apply cosmic alignment speed multiplier
        if (activeCosmicAlignment && activeCosmicAlignment.triggers.playerSpeedMultiplier) {
            moveAmount *= activeCosmicAlignment.triggers.playerSpeedMultiplier;
        }

        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            player.y -= moveAmount;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            player.y += moveAmount;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            player.x -= moveAmount;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            player.x += moveAmount;
        }

        // Keep player within canvas bounds
        player.x = Math.max(0, Math.min(player.x, GAME_WIDTH - player.width));
        player.y = Math.max(0, Math.min(player.y, GAME_HEIGHT - player.height));

        // Calculate player's hitbox position
        const playerHitboxX = player.x + (player.width - player.playerHitboxWidth) / 2;
        const playerHitboxY = player.y + (player.height - player.playerHitboxHeight) / 2;

        // Handle item and memory collection
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];

            // Basic AABB (Axis-Aligned Bounding Box) collision detection
            if (playerHitboxX < item.x + item.size &&
                playerHitboxX + player.playerHitboxWidth > item.x &&
                playerHitboxY < item.y + item.size &&
                playerHitboxY + player.playerHitboxHeight > item.y) {
                // Collision detected!

                if (item.type === 'xp_orb') {
                    player.xp += XP_PER_ORB;
                    items.splice(i, 1);

                    // Check for level up
                    if (player.xp >= player.xpToNextLevel) {
                        levelUpPlayer(); // Centralized player level up logic
                    }
                } else if (item.type === 'memory') {
                    collectMemory(item.id);
                    items.splice(i, 1);
                }
                // Add more item types here later (e.g., resources)
            }
        }

        // Spawn new XP orbs periodically if below max
        if (items.filter(item => item.type === 'xp_orb').length < MAX_ITEMS) {
            spawnItem();
        }
        // Spawn new memories periodically if below max
        spawnMemories(); // This function already handles max check and unfound memories

        // --- Blinking Logic ---
        if (!player.isBlinking) {
            player.blinkTimer += deltaTime;
            if (player.blinkTimer >= player.blinkInterval) {
                player.isBlinking = true;
                player.blinkTimer = 0;
            }
        } else {
            player.blinkTimer += deltaTime;
            if (player.blinkTimer >= player.blinkDuration) {
                player.isBlinking = false;
                player.blinkTimer = 0;
            }
        }
    }

    // --- Update Crafting Queue ---
    updateCraftingQueue(deltaTime);

    // --- Update Elemental Ability Cooldowns ---
    for (const abilityName in elementalCooldowns) {
        elementalCooldowns[abilityName] -= deltaTime;
        if (elementalCooldowns[abilityName] <= 0) {
            delete elementalCooldowns[abilityName];
        }
    }

    // --- Update Tree Respawn Timers ---
    trees.forEach(tree => {
        if (tree.health <= 0) { // If tree is chopped
            tree.respawnTimer -= deltaTime;
            if (tree.respawnTimer <= 0) {
                tree.health = TREE_HEALTH; // Respawn the tree
                tree.respawnTimer = 0; // Reset timer
                console.log("A tree has respawned!");
            }
        }
    });
}

// Helper function for player level up
function levelUpPlayer() {
    player.level++;
    player.xp -= player.xpToNextLevel;
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
    player.speed += 0.5;
    console.log(`Leveled Up! Now Level ${player.level}. Speed: ${player.speed}`);
    checkWorldTransition();
}

// Function to handle world transitions
function checkWorldTransition() {
    // Check if the player's level meets the requirement for the next world
    // Ensure we don't go out of bounds of the worlds array
    if (currentWorldIndex + 1 < worlds.length &&
        player.level >= worlds[currentWorldIndex + 1].minPlayerLevel) {

        // Initiate the transition animation
        transitionState = 'fadingOut';
        transitionTimer = 0; // Reset timer for the new animation

        // IMPORTANT: We increment currentWorldIndex here so that
        // the new world's name is available for the transition text.
        // The game elements (background, items) will update when fadingIn completes
        // and draw calls return to normal.
        currentWorldIndex++;
        transitionWorldName = worlds[currentWorldIndex].name; // Store the name for display

        console.log(`Initiating transition to ${transitionWorldName}!`);

        // Items are cleared and re-spawned in the update() function's fadingOut phase
        // to ensure they only appear after the old world is fully faded.
    }
}


// --- Draw Game Elements ---
function draw() {
    // Generate Grassy Background (now dynamic based on currentWorldIndex)
    drawGrassyBackground();

    // Draw trees (only if they have health)
    trees.forEach(tree => {
        if (tree.health > 0) {
            ctx.fillStyle = 'darkgreen'; // Tree canopy
            ctx.beginPath();
            ctx.arc(tree.x + TREE_SIZE / 2, tree.y + TREE_SIZE / 2 - TREE_SIZE / 4, TREE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'brown'; // Tree trunk
            ctx.fillRect(tree.x + TREE_SIZE / 2 - 5, tree.y + TREE_SIZE / 2, 10, TREE_SIZE / 2);

            // Optional: Draw tree health bar (simple red line)
            const healthBarWidth = (tree.health / TREE_HEALTH) * TREE_SIZE;
            ctx.fillStyle = 'red';
            ctx.fillRect(tree.x, tree.y - 10, healthBarWidth, 5);
        }
    });

    // Draw the base placeholder (Architect of the Realm)
    drawBase();

    // Draw the player sprite
    let currentSpriteImage = player.isBlinking ? spriteImageEyesClosed : spriteImageEyesOpen;
    ctx.drawImage(currentSpriteImage, player.x, player.y, player.width, player.height);

    // --- Draw the player's name ---
    const nameText = player.name;
    const nameFontSize = 14; // Even smaller font size
    ctx.font = `${nameFontSize}px Arial`;
    ctx.textAlign = 'center';

    const textWidth = ctx.measureText(nameText).width;
    const padding = 6; // Padding around the text
    const borderRadius = 8; // Radius for rounded corners

    // Calculate position for the rounded rectangle background
    const rectWidth = textWidth + (padding * 2);
    const rectHeight = nameFontSize + (padding * 2);
    const rectX = player.x + player.width / 2 - rectWidth / 2;
    const rectY = player.y - rectHeight - 5; // Move up by more, e.g., 5 pixels above the sprite's top

    // Draw semi-transparent black rounded rectangle for the nametag background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Black with 50% opacity
    roundRect(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius, true, false);

    // Draw the name text
    ctx.fillStyle = 'white'; // Text color
    ctx.fillText(nameText, player.x + player.width / 2, rectY + rectHeight / 2 + nameFontSize / 2 - 2); // Vertically center text in rect
    ctx.textAlign = 'left'; // Reset text alignment for other text elements


    // Draw all items (XP Orbs and Memories)
    items.forEach(item => {
        if (item.type === 'xp_orb') {
            ctx.fillStyle = 'gold';
            ctx.beginPath();
            ctx.arc(item.x + item.size / 2, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else if (item.type === 'memory') {
            ctx.fillStyle = 'purple'; // Memories will be simple purple squares for now
            ctx.fillRect(item.x, item.y, item.size, item.size);
            // Could draw a more complex shape or image here later
        }
    });

    // Draw level and XP text (Top-left)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${player.level} (${worlds[currentWorldIndex].name})`, 10, 30); // Added world name to display
    ctx.fillText(`XP: ${player.xp} / ${player.xpToNextLevel}`, 10, 60);

    // Draw Guild Level and XP (Guild of Influence)
    ctx.fillText(`Guild Level: ${player.guild.level}`, 10, 90);
    ctx.fillText(`Guild XP: ${player.guild.xp} / ${player.guild.xpToNextLevel}`, 10, 120);


    // --- Draw Transition Overlay ---
    if (transitionState !== 'idle') {
        let alpha = 0;
        let displayText = "";

        switch (transitionState) {
            case 'fadingOut':
                alpha = transitionTimer / FADE_DURATION; // Goes from 0 (transparent) to 1 (opaque)
                break;
            case 'displayingText':
                alpha = 1; // Fully black
                displayText = transitionWorldName;
                break;
            case 'fadingIn':
                alpha = 1 - (transitionTimer / FADE_DURATION); // Goes from 1 (opaque) to 0 (transparent)
                displayText = transitionWorldName; // Keep displaying text during fade in
                break;
        }

        // Draw the black overlay on top of everything
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw the text if in displayingText or fadingIn phase
        if (displayText) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial'; // Large, bold font for world name
            ctx.textAlign = 'center';
            ctx.fillText(displayText, GAME_WIDTH / 2, GAME_HEIGHT / 2);
            ctx.textAlign = 'left'; // Reset for other UI elements
        }
    }

    // --- Draw In-Game Command Input (NEW) ---
    if (inGameCommandMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
        ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40); // Input bar at the bottom

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        // Add a blinking cursor effect
        ctx.fillText(commandInputBuffer + (Math.floor(Date.now() / 500) % 2 === 0 ? '_' : ''), 10, GAME_HEIGHT - 12);
    }

    // --- Draw Narrative text (Memory Weaving) ---
    if (currentNarrativeDisplay) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const narrativeBoxHeight = 80;
        ctx.fillRect(0, GAME_HEIGHT / 2 - narrativeBoxHeight / 2, GAME_WIDTH, narrativeBoxHeight);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentNarrativeDisplay, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.textAlign = 'left';
    }

    // --- Draw Guild Level Up text (Guild of Influence) ---
    if (guildLevelUpText) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const guildTextBoxHeight = 50;
        ctx.fillRect(0, GAME_HEIGHT / 2 + 50, GAME_WIDTH, guildTextBoxHeight); // Position below narrative box
        ctx.fillStyle = 'yellow';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(guildLevelUpText, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50 + guildTextBoxHeight / 2 + 10);
        ctx.textAlign = 'left';
    }

    // --- Draw Active Cosmic Alignment text (Cosmic Alignment) ---
    if (activeCosmicAlignment) {
        const remainingTime = Math.ceil((activeCosmicAlignment.duration - cosmicAlignmentTimer) / 1000);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow tint for alignment notification
        ctx.fillRect(GAME_WIDTH - 200, 10, 190, 60);
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`Alignment: ${activeCosmicAlignment.name}`, GAME_WIDTH - 190, 30);
        ctx.fillText(`Time Left: ${remainingTime}s`, GAME_WIDTH - 190, 55);
    }

    // --- Draw Crafting Queue (Dynamic Economy & Crafting) ---
    if (craftingQueue.length > 0) {
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`Crafting: ${craftingQueue[0].recipeName} (${Math.ceil(craftingQueue[0].timeRemaining / 1000)}s)`, GAME_WIDTH - 250, GAME_HEIGHT - 100);
    }

    // --- Draw Inventory GUI ---
    if (showInventoryGUI) {
        drawInventoryGUI();
    }

    // --- Draw Teleport Menu ---
    if (showTeleportMenu) {
        drawTeleportMenu();
    }
}

// Helper function to draw a rounded rectangle
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var key in defaultRadius) {
            radius[key] = radius[key] || defaultRadius[key];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}


// Function to draw the generated grassy background (now dynamic)
function drawGrassyBackground() {
    const currentWorld = worlds[currentWorldIndex];

    // Base layer
    ctx.fillStyle = currentWorld.backgroundColor1;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Mid layer
    ctx.fillStyle = currentWorld.backgroundColor2;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.95);

    // Top layer
    ctx.fillStyle = currentWorld.backgroundColor3;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.90);

    // Draw static grass tufts (now using tuftColor from current world)
    ctx.strokeStyle = currentWorld.tuftColor;
    ctx.lineWidth = 1;

    // Loop through the pre-generated grassTufts array
    grassTufts.forEach(tuft => {
        ctx.beginPath();
        ctx.moveTo(tuft.x, tuft.y);
        ctx.lineTo(tuft.x, tuft.y + tuft.length);
        ctx.stroke();
    });
}

// --- NEW SYSTEM FUNCTIONS ---

// --- Base Building & Terraforming (Architect of the Realm) ---
function drawBase() {
    if (player.baseLevel > 0) {
        ctx.fillStyle = 'brown'; // Simple brown rectangle for the base
        ctx.fillRect(basePosition.x, basePosition.y, basePosition.width, basePosition.height);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`Base Level: ${player.baseLevel}`, basePosition.x + 10, basePosition.y + 20);
        // You could add more complex drawing here based on baseLevel
    }
}

function upgradeBase() {
    const nextLevel = player.baseLevel + 1;
    if (nextLevel > BASE_BUILDING_COSTS.length) {
        console.log("Base is at max level!");
        return;
    }
    // The cost for the NEXT level is at the current baseLevel index
    const cost = BASE_BUILDING_COSTS[player.baseLevel];
    if (player.xp < cost.xp) {
        console.warn(`Not enough XP to upgrade base. Need ${cost.xp} XP.`);
        return;
    }
    for (const material in cost.materials) {
        if (player.inventory[material] === undefined || player.inventory[material] < cost.materials[material]) {
            console.warn(`Not enough ${material} to upgrade base. Need ${cost.materials[material]}. You have ${player.inventory[material] || 0}.`);
            return;
        }
    }

    player.xp -= cost.xp;
    for (const material in cost.materials) {
        player.inventory[material] -= cost.materials[material];
    }
    player.baseLevel = nextLevel;
    console.log(`Base upgraded to Level ${player.baseLevel}!`);
    // Example: Make the base bigger as it levels up
    basePosition.width += 20;
    basePosition.height += 20;
    basePosition.x -= 10; // Adjust position to keep it centered
    basePosition.y -= 10;
}

// --- Memory Weaving (Narrative Progression) ---
function collectMemory(memoryId) {
    const memory = memories.find(m => m.id === memoryId);
    if (memory && !memory.found) {
        memory.found = true;
        player.memoriesFound.push(memoryId);
        currentNarrativeDisplay = memory.narrative; // Set narrative to display
        narrativeDisplayTimer = 0; // Reset timer for display duration
        console.log(`Memory Found: "${memory.narrative}"`);

        // Example: Check if all memories in a set are found to unlock new content
        const allMemoriesCollected = memories.every(m => m.found);
        if (allMemoriesCollected) {
            console.log("All current memories collected! A new narrative branch might unfold...");
            // Potentially add more memories to the 'memories' array,
            // unlock new areas, or trigger special events.
        }
    }
}

// --- Master of the Elements (Environmental Manipulation) ---
function unlockElementalAbility(abilityName) {
    const ability = ELEMENTAL_ABILITIES.find(a => a.name === abilityName);
    if (ability && !player.unlockedElements.includes(abilityName)) {
        if (player.level >= ability.minLevel) {
            player.unlockedElements.push(abilityName);
            console.log(`Unlocked elemental ability: ${abilityName}!`);
        } else {
            console.warn(`Cannot unlock ${abilityName}. Requires player level ${ability.minLevel}.`);
        }
    } else {
        console.warn(`${abilityName} already unlocked or does not exist.`);
    }
}

function useElementalAbility(abilityName) {
    if (!player.unlockedElements.includes(abilityName)) {
        console.warn(`You haven't unlocked the "${abilityName}" ability.`);
        return;
    }
    if (elementalCooldowns[abilityName] > 0) {
        console.warn(`${abilityName} is on cooldown. Remaining: ${Math.ceil(elementalCooldowns[abilityName] / 1000)}s`);
        return;
    }

    const ability = ELEMENTAL_ABILITIES.find(a => a.name === abilityName);
    if (ability) {
        console.log(`Using ${abilityName}: ${ability.effect}`);
        elementalCooldowns[abilityName] = ability.cooldown; // Set cooldown

        // Implement actual effects here based on the ability
        if (abilityName === "Wind Gust") {
            console.log("Wind Gust activated! Player speed temporarily increased.");
            player.speed *= 2; // Temporary speed boost
            setTimeout(() => {
                player.speed /= 2;
                console.log("Wind Gust effect ended, speed normalized.");
            }, 1000); // Effect lasts 1 second
        } else if (abilityName === "Healing Bloom") {
            console.log("Healing Bloom activated! Restoring XP over time.");
            let healAmountRemaining = 50; // Total XP to heal
            let healIntervalId = setInterval(() => {
                if (healAmountRemaining > 0) {
                    player.xp += 10; // Heal 10 XP at a time
                    healAmountRemaining -= 10;
                    console.log(`Healing Bloom: +10 XP. Remaining heal: ${healAmountRemaining} XP.`);
                    // Also check for level up if XP goes above xpToNextLevel
                    if (player.xp >= player.xpToNextLevel) {
                        levelUpPlayer();
                    }
                } else {
                    clearInterval(healIntervalId); // Stop interval when healing is complete
                    console.log("Healing Bloom ended.");
                }
            }, 500); // Heal every 0.5 seconds
        }
        // Add more complex effects for other abilities
    }
}

// --- Guild of Influence (Faction System) ---
function addGuildXP(amount) {
    if (amount <= 0) {
        console.warn("Guild XP amount must be positive.");
        return;
    }
    player.guild.xp += amount;
    console.log(`Added ${amount} Guild XP. Current Guild XP: ${player.guild.xp} / ${player.guild.xpToNextLevel}`);

    if (player.guild.xp >= player.guild.xpToNextLevel) {
        player.guild.level++;
        player.guild.xp -= player.guild.xpToNextLevel; // Carry over excess XP
        player.guild.xpToNextLevel = Math.floor(player.guild.xpToNextLevel * GUILD_XP_MULTIPLIER);
        guildLevelUpText = `Your Guild leveled up to Level ${player.guild.level}!`;
        guildLevelUpTextTimer = 0; // Reset timer to display text
        console.log(`Guild Leveled Up! Now Level ${player.guild.level}. Next XP: ${player.guild.xpToNextLevel}`);
        // Unlock new guild features, recruit additional members, etc.
    }
}

function recruitGuildMember(memberName) {
    // A simple limit based on guild level. You might have a more complex system.
    if (player.guild.members.length >= player.guild.level + 1) {
        console.warn("Your guild is full! Upgrade your guild to recruit more members.");
        return;
    }
    if (!player.guild.members.includes(memberName)) {
        player.guild.members.push(memberName);
        console.log(`${memberName} has joined your guild! Current members: ${player.guild.members.length}`);
        addGuildXP(50); // Grant XP for recruiting
    } else {
        console.warn(`${memberName} is already in your guild.`);
    }
}

// --- Dynamic Economy & Crafting Chains ---
function collectResource(resourceType, amount) {
    if (RESOURCE_TYPES.includes(resourceType.toLowerCase())) {
        player.inventory[resourceType.toLowerCase()] += amount;
        console.log(`Collected ${amount} ${resourceType}. Current ${resourceType}: ${player.inventory[resourceType.toLowerCase()]}`);
    } else {
        console.warn(`Unknown resource type: ${resourceType}`);
    }
}

function craftItem(recipeName) {
    const recipe = CRAFTING_RECIPES[recipeName];
    if (!recipe) {
        console.warn(`Unknown crafting recipe: ${recipeName}.`);
        console.log("Available recipes:", Object.keys(CRAFTING_RECIPES).join(', '));
        return;
    }

    // Check if player has enough materials
    for (const material in recipe.materials) {
        if (player.inventory[material] === undefined || player.inventory[material] < recipe.materials[material]) {
            console.warn(`Not enough ${material} to craft ${recipeName}. Need ${recipe.materials[material]}. You have ${player.inventory[material] || 0}.`);
            return;
        }
    }

    // Deduct materials
    for (const material in recipe.materials) {
        player.inventory[material] -= recipe.materials[material];
    }

    // Add to crafting queue
    craftingQueue.push({
        recipeName: recipeName,
        timeRemaining: recipe.time,
        yields: recipe.yields
    });
    console.log(`Started crafting ${recipeName}. Crafting queue length: ${craftingQueue.length}`);
}

function updateCraftingQueue(deltaTime) {
    if (craftingQueue.length > 0) {
        craftingQueue[0].timeRemaining -= deltaTime;
        if (craftingQueue[0].timeRemaining <= 0) {
            const completedItem = craftingQueue.shift(); // Remove from queue
            for (const item in completedItem.yields) {
                player.inventory[item] = (player.inventory[item] || 0) + completedItem.yields[item];
            }
            console.log(`Finished crafting ${completedItem.recipeName}. You gained: `, completedItem.yields);
        }
    }
}

// --- Legacy System (New Game+) ---
function saveLegacy() {
    // Define what data constitutes a "legacy" for the next playthrough
    const legacyData = {
        uniqueSkill: "Master Crafter", // Example: A skill gained in the last playthrough
        startingItem: "Ancient Compass", // Example: A special item
        bonusStat: "speed", // Example: A stat to boost in the next game
        // You could add player.unlockedElements, player.memoriesFound (if you want them to persist)
        // or any other progression milestone
    };
    try {
        localStorage.setItem('gameLegacy', JSON.stringify(legacyData));
        console.log("Legacy saved for New Game+!");
        // Optional: display a message to the player that legacy was saved
    } catch (e) {
        console.error("Failed to save legacy:", e);
        alert("Failed to save game legacy. Please ensure your browser allows local storage.");
    }
}

function loadLegacy() {
    try {
        const storedLegacy = localStorage.getItem('gameLegacy');
        if (storedLegacy) {
            player.legacy = JSON.parse(storedLegacy);
            console.log("Legacy loaded:", player.legacy);
            // Apply legacy effects to the *new* game character
            if (player.legacy.bonusStat === "speed") {
                player.speed += 1;
                console.log("Applying legacy speed bonus!");
            }
            // Add other legacy applications here
            if (player.legacy.uniqueSkill === "Master Crafter") {
                console.log("Starting with Master Crafter legacy - crafting times reduced by 10%.");
                // This would require modifying crafting logic, e.g., in craftItem or updateCraftingQueue
                // For now, it's just a console message.
            }
        }
    } catch (e) {
        console.error("Failed to load legacy:", e);
        player.legacy = null; // Clear invalid legacy to prevent issues
    }
}

function startNewGamePlus() {
    // This function would typically be called from a main menu after a game completes.
    // For in-game command, it resets the current game.
    saveLegacy(); // Ensure current progress is saved as a legacy before resetting

    console.log("Starting New Game+ with legacy...");

    // Reset most game variables to initial state, but keep the legacy
    player.level = 0;
    player.xp = 0;
    player.xpToNextLevel = 100;
    player.speed = 5; // Will be modified by loadLegacy if applicable
    player.isBlinking = false;
    player.blinkTimer = 0;

    // Reset new system states
    player.baseLevel = 0;
    player.memoriesFound = [];
    // Reset memories array to their initial unfound state for the new game
    memories.forEach(m => m.found = false);
    player.unlockedElements = [];
    elementalCooldowns = {};
    player.guild = { name: `${player.name}'s Guild`, level: 0, reputation: 0, xp: 0, xpToNextLevel: GUILD_INITIAL_XP_TO_LEVEL };
    player.inventory = { wood: 0, stone: 0, metal: 0, basic_tool: 0, wood_plank: 0 };
    craftingQueue = [];
    activeCosmicAlignment = null;
    cosmicAlignmentTimer = 0;
    lastCosmicAlignmentCheck = 0;
    trees = []; // Clear trees for new game plus
    spawnTrees(); // Resapwn trees for new game

    // Reset game state for visuals/items
    items = [];
    currentWorldIndex = 0;
    transitionState = 'idle';
    commandInputBuffer = '';
    inGameCommandMode = false;
    currentNarrativeDisplay = '';
    narrativeDisplayTimer = 0;
    guildLevelUpText = '';
    guildLevelUpTextTimer = 0;
    lastTimestamp = 0; // Reset delta time calculation
    showTeleportMenu = false;
    showInventoryGUI = true; // Default to showing inventory

    // Re-initialize the game to apply initial settings and load the legacy
    // initGame(); // initGame already called when starting
}


// --- Cosmic Alignment (Timed Events & World Shifts) ---
function triggerCosmicAlignment() {
    // Only trigger if no alignment is currently active
    if (activeCosmicAlignment === null) {
        const availableAlignments = COSMIC_ALIGNMENTS.filter(a => true); // All alignments are always available for now
        if (availableAlignments.length > 0) {
            activeCosmicAlignment = availableAlignments[getRandomInt(0, availableAlignments.length - 1)];
            cosmicAlignmentTimer = 0; // Reset timer for the new alignment
            console.log(`A new Cosmic Alignment has begun: %c${activeCosmicAlignment.name}! %cEffect: ${activeCosmicAlignment.effect}`, 'color: cyan; font-weight: bold;', 'color: unset;');
            // Effects like `itemSpawnRate` would need to influence the spawnItem interval,
            // or enemy spawn rates, which are not yet implemented. For now, it's just a log.
        }
    } else {
        console.log(`Cosmic Alignment "${activeCosmicAlignment.name}" is still active. Time left: ${Math.ceil((activeCosmicAlignment.duration - cosmicAlignmentTimer) / 1000)}s`);
    }
}

// --- RESOURCE GATHERING FUNCTIONS (Trees) ---
function spawnTrees() {
    trees = []; // Clear existing trees for the new world
    for (let i = 0; i < NUM_TREES_PER_WORLD; i++) {
        let x = getRandomInt(0, GAME_WIDTH - TREE_SIZE);
        let y = getRandomInt(0, GAME_HEIGHT - TREE_SIZE);
        // Ensure trees don't spawn too close to the player's initial spawn point or base (if active)
        // This is a basic check; more robust collision avoidance would be needed for complex maps.
        let validPosition = false;
        let attempts = 0;
        const minDistanceToPlayer = 200; // Keep trees a bit away from player start
        while (!validPosition && attempts < 100) {
            x = getRandomInt(0, GAME_WIDTH - TREE_SIZE);
            y = getRandomInt(0, GAME_HEIGHT - TREE_SIZE);
            const dist = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
            if (dist > minDistanceToPlayer) {
                validPosition = true;
            }
            attempts++;
        }

        trees.push({ x: x, y: y, width: TREE_SIZE, height: TREE_SIZE, health: TREE_HEALTH, respawnTimer: 0 });
    }
    console.log(`Spawned ${trees.length} trees for ${worlds[currentWorldIndex].name}.`);
}

function isPlayerNear(obj, distance) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;

    const dx = playerCenterX - objCenterX;
    const dy = playerCenterY - objCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < distance;
}

function chopTree(tree) {
    if (tree.health <= 0) return; // Already chopped

    tree.health -= PUNCH_DAMAGE;
    console.log(`Tree hit! Health: ${tree.health}`);

    if (tree.health <= 0) {
        console.log("Tree chopped down!");
        collectResource('wood', WOOD_PER_TREE); // Give player wood
        tree.respawnTimer = TREE_RESPAWN_TIME; // Start respawn timer
    }
}

// --- INVENTORY GUI FUNCTIONS ---
function drawInventoryGUI() {
    const guiWidth = 200;
    const guiHeight = 180; // Adjusted height for more items
    const guiX = GAME_WIDTH - guiWidth - 10; // 10px from right edge
    const guiY = GAME_HEIGHT - guiHeight - 10; // 10px from bottom edge
    const padding = 15;
    const lineHeight = 25;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black
    roundRect(ctx, guiX, guiY, guiWidth, guiHeight, 10, true, false);

    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("Inventory", guiX + padding, guiY + padding + 15); // Title

    let yOffset = guiY + padding + 40;
    for (const item in player.inventory) {
        // Capitalize first letter for display
        const displayName = item.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        ctx.fillText(`${displayName}: ${player.inventory[item]}`, guiX + padding, yOffset);
        yOffset += lineHeight;
    }
}

function toggleInventoryGUI() {
    showInventoryGUI = !showInventoryGUI;
    if (showInventoryGUI) {
        console.log("Inventory GUI shown.");
    } else {
        console.log("Inventory GUI hidden.");
    }
}

// --- TELEPORT MENU FUNCTIONS ---
function drawTeleportMenu() {
    const menuWidth = 300;
    const menuHeight = (worlds.length * 30) + 100; // 30 per option + header/padding
    const menuX = GAME_WIDTH / 2 - menuWidth / 2;
    const menuY = GAME_HEIGHT / 2 - menuHeight / 2;
    const padding = 20;
    const optionHeight = 30;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Darker, more opaque background
    roundRect(ctx, menuX, menuY, menuWidth, menuHeight, 15, true, false);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Select World", GAME_WIDTH / 2, menuY + padding + 20);

    ctx.font = '18px Arial';
    let yOffset = menuY + padding + 50;
    for (let i = 0; i < worlds.length; i++) {
        const world = worlds[i];
        let textColor = 'white';
        let worldPrefix = `[${i}] `;
        if (player.level < world.minPlayerLevel) {
            textColor = 'grey'; // Indicate locked worlds
            worldPrefix += `(Lv ${world.minPlayerLevel}+) `;
        } else if (i === currentWorldIndex) {
            textColor = 'lime'; // Current world
            worldPrefix += `(Current) `;
        }

        ctx.fillStyle = textColor;
        // Draw a selectable area for each world
        const optionRectX = menuX + 10;
        const optionRectY = yOffset - optionHeight / 2 + 5; // Adjust for text baseline
        const optionRectWidth = menuWidth - 20;
        const optionRectHeight = optionHeight;

        // Visual feedback for current world (optional, but good UX)
        if (i === currentWorldIndex) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Light green highlight
            roundRect(ctx, optionRectX, optionRectY, optionRectWidth, optionRectHeight, 5, true, false);
            ctx.fillStyle = textColor; // Restore text color
        }


        ctx.fillText(`${worldPrefix}${world.name}`, GAME_WIDTH / 2, yOffset);
        yOffset += optionHeight;
    }
    ctx.textAlign = 'left'; // Reset
}

function toggleTeleportMenu() {
    showTeleportMenu = !showTeleportMenu;
    if (showTeleportMenu) {
        console.log("Teleport Menu shown. Click on a world to teleport.");
    } else {
        console.log("Teleport Menu hidden.");
    }
}

function teleportToWorld(index) {
    if (index < 0 || index >= worlds.length) {
        console.warn("Invalid world index for teleport.");
        return;
    }

    const targetWorld = worlds[index];
    if (player.level < targetWorld.minPlayerLevel) {
        console.warn(`Cannot teleport to ${targetWorld.name}. Requires player level ${targetWorld.minPlayerLevel}.`);
        return;
    }

    if (index === currentWorldIndex) {
        console.log(`Already in ${targetWorld.name}.`);
        return;
    }

    // Set the current world index directly for the transition to pick up
    currentWorldIndex = index;
    transitionWorldName = targetWorld.name; // Set for transition display

    // Initiate the transition animation
    transitionState = 'fadingOut';
    transitionTimer = 0; // Reset timer for the new animation

    console.log(`Teleporting to ${targetWorld.name}!`);
    // The update loop's transition logic will handle clearing/spawning items/trees
}


// --- Admin Command Execution (now also handles in-game input) ---
function executeAdminCommand(commandString) {
    // Remove the leading '/' if present for simpler parsing from in-game commands
    const cleanCommandString = commandString.startsWith('/') ? commandString.substring(1) : commandString;

    const parts = cleanCommandString.trim().split(/\s+/); // Split by one or more spaces
    const command = parts[0].toLowerCase();
    const args = parts.slice(1); // Keep arguments as strings initially, convert later if needed

    console.log(`Processing command: %c${commandString}`, 'font-weight: bold; color: yellow;'); // Added styling for clarity

    switch (command) {
        case 'level':
            if (args.length > 0 && !isNaN(Number(args[0]))) {
                setPlayerLevel(Number(args[0]));
            } else {
                console.warn("Usage: /level <number>");
            }
            break;
        case 'xp':
            if (args.length > 0 && !isNaN(Number(args[0]))) {
                addPlayerXP(Number(args[0]));
            } else {
                console.warn("Usage: /xp <amount>");
            }
            break;
        case 'world':
            if (args.length > 0 && !isNaN(Number(args[0]))) {
                // Now uses the new teleportToWorld function
                teleportToWorld(Number(args[0]));
            } else {
                console.warn("Usage: /world <index>");
            }
            break;
        case 'baseupgrade': // Architect of the Realm
            upgradeBase();
            break;
        case 'findmemory': // Memory Weaving
            if (args.length > 0) {
                // Command allows finding memory by ID (e.g., /findmemory memory_001)
                collectMemory(args[0]);
            } else {
                console.warn("Usage: /findmemory <memory_id>");
                console.log("Available unfound memories:", memories.filter(m => !m.found).map(m => m.id).join(', '));
            }
            break;
        case 'unlockelement': // Master of the Elements
            if (args.length > 0) {
                // Join args back as ability names can have spaces (e.g., "Wind Gust")
                unlockElementalAbility(args.join(' '));
            } else {
                console.warn("Usage: /unlockelement <ability_name>");
                console.log("Known elemental abilities:", ELEMENTAL_ABILITIES.map(a => a.name).join(', '));
            }
            break;
        case 'useelement': // Master of the Elements
            if (args.length > 0) {
                useElementalAbility(args.join(' '));
            } else {
                console.warn("Usage: /useelement <ability_name>");
                console.log("Unlocked elemental abilities:", player.unlockedElements.join(', '));
            }
            break;
        case 'guildxp': // Guild of Influence
            if (args.length > 0 && !isNaN(Number(args[0]))) {
                addGuildXP(Number(args[0]));
            } else {
                console.warn("Usage: /guildxp <amount>");
            }
            break;
        case 'recruit': // Guild of Influence
            if (args.length > 0) {
                recruitGuildMember(args.join(' ')); // Member names can have spaces
            } else {
                console.warn("Usage: /recruit <member_name>");
            }
            break;
        case 'collect': // Dynamic Economy & Crafting
            if (args.length === 2 && !isNaN(Number(args[1]))) {
                collectResource(args[0].toLowerCase(), Number(args[1]));
            } else {
                console.warn("Usage: /collect <resource_type> <amount>");
                console.log("Available resource types:", RESOURCE_TYPES.join(', '));
            }
            break;
        case 'craft': // Dynamic Economy & Crafting
            if (args.length > 0) {
                // Recipe names are defined in snake_case (e.g., "wood_plank")
                craftItem(args.join('_').toLowerCase());
            } else {
                console.warn("Usage: /craft <recipe_name>");
                console.log("Available recipes:", Object.keys(CRAFTING_RECIPES).join(', '));
            }
            break;
        case 'savelegacy': // Legacy System
            saveLegacy();
            break;
        case 'newgameplus': // Legacy System
            // This command will save the current game state as a legacy, then reset and restart.
            startNewGamePlus();
            break;
        case 'cosmicalignment': // Cosmic Alignment
            triggerCosmicAlignment();
            break;
        case 'toggleinventory': // GUI command
            toggleInventoryGUI();
            break;
        case 'toggleteleport': // GUI command
            toggleTeleportMenu();
            break;
        case 'cleartrees': // Debugging trees
            trees = [];
            console.log("All trees cleared.");
            break;
        case 'spawntrees': // Debugging trees
            spawnTrees();
            break;
        default:
            console.warn(`Unknown command: /${command}. Try: /level, /xp, /world, /baseupgrade, /findmemory, /unlockelement, /useelement, /guildxp, /recruit, /collect, /craft, /savelegacy, /newgameplus, /cosmicalignment, /toggleinventory, /toggleteleport, /cleartrees, /spawntrees.`);
            break;
    }
}

// --- Admin Command Handlers (Existing, potentially modified) ---
function setPlayerLevel(level) {
    if (level < 0) {
        console.warn("Level cannot be negative.");
        return;
    }
    player.level = level;
    // Reset XP to 0 when setting level to ensure consistent state
    player.xp = 0;
    // Recalculate XP needed for next level based on the new level
    player.xpToNextLevel = 100 + (level * 50); // Adjust this formula if your XP needs are different
    console.log(`Player level set to: %c${player.level}`, 'color: lightblue; font-weight: bold;');
    // Manually trigger world transition check after level change
    checkWorldTransition();
}

function addPlayerXP(amount) {
    if (amount <= 0) {
        console.warn("XP amount must be positive.");
        return;
    }
    player.xp += amount;
    console.log(`Added %c${amount}%c XP. Current XP: %c${player.xp}`, 'color: lime; font-weight: bold;', 'color: unset;', 'color: lightgreen; font-weight: bold;');
    // Since adding XP can cause a level up, run the existing check
    // This will also trigger world transitions if a level up occurs.
    if (player.xp >= player.xpToNextLevel) { // Check for level up immediately
        // Simulate level up process
        levelUpPlayer(); // Use the centralized function
    }
}

// The 'setWorld' function is now replaced by 'teleportToWorld' for consistency
// with the new teleport menu. The old command is remapped in executeAdminCommand.


// Start the game
initGame();

// Keep the console command exposure, as it's still useful for direct debugging
// and doesn't interfere with the in-game command system.
window.cmd = executeAdminCommand;
