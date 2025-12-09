// Game State
const gameState = {
    playerScore: 0,
    cpuScore: 0,
    playerStreak: 0,
    cpuStreak: 0,
    playerChoices: [],
    cpuChoices: [],
    round: 0,
    soundEnabled: true,
    lastResult: null
};

// DOM Elements
const playerScoreElement = document.getElementById('playerScore');
const cpuScoreElement = document.getElementById('cpuScore');
const playerChoiceDisplay = document.getElementById('playerChoiceDisplay');
const cpuChoiceDisplay = document.getElementById('cpuChoiceDisplay');
const resultText = document.getElementById('resultText');
const streakCounter = document.getElementById('streakCounter');
const resetBtn = document.getElementById('resetBtn');
const soundBtn = document.getElementById('soundBtn');
const choiceButtons = document.querySelectorAll('.choice-btn');

// Icons mapping
const icons = {
    rock: 'fas fa-fist-raised',
    paper: 'fas fa-hand-paper',
    scissors: 'fas fa-hand-scissors',
    unknown: 'fas fa-question'
};

// Initialize game
function initGame() {
    updateScoreboard();
    updateStreakCounter();
    attachEventListeners();
    // Prevent zoom on double tap for mobile
    preventDoubleTapZoom();
}

// Attach event listeners
function attachEventListeners() {
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => handlePlayerChoice(btn.dataset.choice));
        // Add touch feedback for mobile
        btn.addEventListener('touchstart', () => {
            btn.classList.add('active');
        });
        btn.addEventListener('touchend', () => {
            btn.classList.remove('active');
        });
    });

    resetBtn.addEventListener('click', resetGame);
    soundBtn.addEventListener('click', toggleSound);
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            handlePlayerChoice('rock');
        } else if (e.key === 'p' || e.key === 'P') {
            handlePlayerChoice('paper');
        } else if (e.key === 's' || e.key === 'S') {
            handlePlayerChoice('scissors');
        } else if (e.key === 'Escape') {
            resetGame();
        }
    });
}

// Handle player choice
function handlePlayerChoice(choice) {
    // Prevent clicking during animation
    if (playerChoiceDisplay.classList.contains('thinking')) return;

    // Animate player choice
    animateChoice(playerChoiceDisplay, choice, 'player');
    
    // Show CPU thinking animation
    cpuChoiceDisplay.innerHTML = '<i class="fas fa-brain"></i>';
    cpuChoiceDisplay.classList.add('thinking');
    resultText.textContent = 'CPU thinking';
    resultText.className = 'result-text';

    // Disable choice buttons during CPU "thinking"
    choiceButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.6';
    });

    // CPU makes choice after a delay (simulating thinking)
    setTimeout(() => {
        const cpuChoice = getCpuChoice(choice);
        animateChoice(cpuChoiceDisplay, cpuChoice, 'cpu');
        
        // Determine result
        const result = determineWinner(choice, cpuChoice);
        displayResult(result, choice, cpuChoice);
        
        // Update game state
        updateGameState(result);
        
        // Re-enable choice buttons
        choiceButtons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        });
        
        // Add combo glow if streak is high
        updateComboGlow();
        
        // Update round counter for mobile users
        updateRoundInfo();
    }, 1000);
}

// Animate choice display
function animateChoice(element, choice, player) {
    element.classList.remove('win-glow', 'lose-glow');
    element.classList.add('pulse');
    
    // Replace icon with new choice
    setTimeout(() => {
        const iconClass = icons[choice];
        element.innerHTML = `<i class="${iconClass}"></i>`;
        element.classList.remove('pulse');
        element.classList.remove('thinking');
    }, 300);
}

// Smart CPU choice algorithm
function getCpuChoice(playerChoice) {
    gameState.playerChoices.push(playerChoice);
    
    // First few rounds are random
    if (gameState.round < 3) {
        return getRandomChoice();
    }
    
    // Analyze player patterns
    const playerPattern = analyzePlayerPattern();
    
    // If player is repeating, counter that move
    if (playerPattern && Math.random() > 0.4) {
        return getCounterChoice(playerPattern);
    }
    
    // If player is on a streak, try to break it
    if (gameState.playerStreak >= 2) {
        if (Math.random() > 0.5) {
            return getCounterChoice(playerChoice);
        }
    }
    
    // Sometimes make a random choice (30% chance)
    if (Math.random() < 0.3) {
        return getRandomChoice();
    }
    
    // Default: counter the player's most frequent choice
    const mostFrequent = getMostFrequentChoice(gameState.playerChoices);
    return mostFrequent ? getCounterChoice(mostFrequent) : getRandomChoice();
}

// Get random choice
function getRandomChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * 3)];
}

// Analyze player pattern
function analyzePlayerPattern() {
    const choices = gameState.playerChoices;
    if (choices.length < 3) return null;
    
    // Check if player is repeating same choice
    const lastThree = choices.slice(-3);
    if (lastThree.every(c => c === lastThree[0])) {
        return lastThree[0];
    }
    
    // Check for simple patterns like rock-paper-scissors rotation
    const pattern = detectRotationPattern(choices.slice(-5));
    return pattern;
}

// Detect rotation pattern (e.g., rock -> paper -> scissors -> rock)
function detectRotationPattern(choices) {
    if (choices.length < 3) return null;
    
    const sequence = ['rock', 'paper', 'scissors'];
    for (let i = 0; i < choices.length - 1; i++) {
        const currentIdx = sequence.indexOf(choices[i]);
        const nextIdx = sequence.indexOf(choices[i + 1]);
        
        // Check if it's following the sequence
        if ((currentIdx + 1) % 3 !== nextIdx) {
            return null;
        }
    }
    
    // Predict next in sequence
    const lastIdx = sequence.indexOf(choices[choices.length - 1]);
    return sequence[(lastIdx + 1) % 3];
}

// Get most frequent choice
function getMostFrequentChoice(choices) {
    if (choices.length === 0) return null;
    
    const frequency = {};
    choices.forEach(choice => {
        frequency[choice] = (frequency[choice] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostFrequent = null;
    
    for (const [choice, count] of Object.entries(frequency)) {
        if (count > maxCount) {
            maxCount = count;
            mostFrequent = choice;
        }
    }
    
    return mostFrequent;
}

// Get counter choice
function getCounterChoice(choice) {
    const counters = {
        rock: 'paper',
        paper: 'scissors',
        scissors: 'rock'
    };
    return counters[choice];
}

// Determine winner
function determineWinner(player, cpu) {
    if (player === cpu) return 'draw';
    
    const winConditions = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
    };
    
    return winConditions[player] === cpu ? 'win' : 'lose';
}

// Display result with animation
function displayResult(result, playerChoice, cpuChoice) {
    let message = '';
    let resultClass = '';
    
    switch(result) {
        case 'win':
            message = `You win! ${capitalize(playerChoice)} beats ${cpuChoice}`;
            resultClass = 'result-win';
            playerChoiceDisplay.classList.add('win-glow');
            cpuChoiceDisplay.classList.add('lose-glow');
            playSound('win');
            break;
        case 'lose':
            message = `You lose! ${capitalize(cpuChoice)} beats ${playerChoice}`;
            resultClass = 'result-lose';
            playerChoiceDisplay.classList.add('lose-glow');
            cpuChoiceDisplay.classList.add('win-glow');
            playSound('lose');
            break;
        case 'draw':
            message = `It's a draw! Both chose ${playerChoice}`;
            resultClass = 'result-draw';
            playSound('draw');
            break;
    }
    
    // Truncate message for mobile
    if (window.innerWidth < 480) {
        const shortMessage = {
            'win': `Win! ${capitalize(playerChoice)} > ${cpuChoice}`,
            'lose': `Lose! ${capitalize(cpuChoice)} > ${playerChoice}`,
            'draw': `Draw! Both: ${playerChoice}`
        };
        message = shortMessage[result] || message;
    }
    
    resultText.textContent = message;
    resultText.className = 'result-text fade-in ' + resultClass;
    resultText.classList.add('typewriter');
    
    // Remove typewriter class after animation completes
    setTimeout(() => {
        resultText.classList.remove('typewriter');
    }, 1000);
}

// Update game state
function updateGameState(result) {
    gameState.round++;
    gameState.lastResult = result;
    
    switch(result) {
        case 'win':
            gameState.playerScore++;
            gameState.playerStreak++;
            gameState.cpuStreak = 0;
            break;
        case 'lose':
            gameState.cpuScore++;
            gameState.cpuStreak++;
            gameState.playerStreak = 0;
            break;
        case 'draw':
            // Streaks reset on draw
            gameState.playerStreak = 0;
            gameState.cpuStreak = 0;
            break;
    }
    
    updateScoreboard();
    updateStreakCounter();
}

// Update scoreboard with animation - FIXED VERSION
function updateScoreboard() {
    // Directly update without animation loop issue
    playerScoreElement.textContent = gameState.playerScore;
    cpuScoreElement.textContent = gameState.cpuScore;
    
    // Add pulse animation
    playerScoreElement.classList.add('pulse');
    cpuScoreElement.classList.add('pulse');
    
    setTimeout(() => {
        playerScoreElement.classList.remove('pulse');
        cpuScoreElement.classList.remove('pulse');
    }, 300);
}

// Update streak counter
function updateStreakCounter() {
    const streak = gameState.playerStreak > 0 ? gameState.playerStreak : gameState.cpuStreak;
    const player = gameState.playerStreak > 0 ? 'Player' : 'CPU';
    
    streakCounter.innerHTML = `Current streak: <span>${streak} ${player} ${streak === 1 ? 'win' : 'wins'}</span>`;
}

// Update round info for mobile
function updateRoundInfo() {
    if (window.innerWidth < 768) {
        // Could add a small round indicator if needed
        console.log(`Round: ${gameState.round}`);
    }
}

// Update combo glow effect
function updateComboGlow() {
    // Remove combo glow from all buttons
    choiceButtons.forEach(btn => btn.classList.remove('combo-glow'));
    
    // Add combo glow if player has a streak of 3 or more
    if (gameState.playerStreak >= 3) {
        choiceButtons.forEach(btn => btn.classList.add('combo-glow'));
    }
}

// Play sound (simulated - no external files)
function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    // Create audio context for simple beep sounds
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different sounds
        switch(type) {
            case 'win':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                break;
            case 'lose':
                oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime); // F4
                break;
            case 'draw':
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                break;
            case 'reset':
                oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
                break;
            default:
                oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
        }
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio not supported or blocked');
    }
}

// Toggle sound
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    
    if (gameState.soundEnabled) {
        soundBtn.classList.remove('off');
        soundBtn.classList.add('on');
        soundBtn.innerHTML = '<i class="fas fa-volume-up sound-on"></i> <span class="btn-text">Sound On</span>';
        // Play test sound
        playSound('win');
    } else {
        soundBtn.classList.remove('on');
        soundBtn.classList.add('off');
        soundBtn.innerHTML = '<i class="fas fa-volume-mute sound-off"></i> <span class="btn-text">Sound Off</span>';
    }
}

// Reset game
function resetGame() {
    gameState.playerScore = 0;
    gameState.cpuScore = 0;
    gameState.playerStreak = 0;
    gameState.cpuStreak = 0;
    gameState.playerChoices = [];
    gameState.cpuChoices = [];
    gameState.round = 0;
    gameState.lastResult = null;
    
    updateScoreboard();
    updateStreakCounter();
    
    // Reset displays
    playerChoiceDisplay.innerHTML = '<i class="fas fa-question"></i>';
    cpuChoiceDisplay.innerHTML = '<i class="fas fa-question"></i>';
    playerChoiceDisplay.className = 'choice-display player-choice';
    cpuChoiceDisplay.className = 'choice-display cpu-choice';
    
    // Reset result text
    resultText.textContent = 'Make your move to begin';
    resultText.className = 'result-text';
    
    // Remove combo glow
    choiceButtons.forEach(btn => btn.classList.remove('combo-glow'));
    
    // Play reset sound
    playSound('reset');
}

// Utility function
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Prevent double-tap zoom on mobile
function preventDoubleTapZoom() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', initGame);

// Handle orientation change
window.addEventListener('resize', () => {
    // Update UI if needed on resize
    if (window.innerWidth < 480) {
        // Update any mobile-specific UI changes
    }
});