const themeBtn = document.getElementById("themeToggle");
const currentTurn = document.getElementById("currentTurn");
const scoreO = document.getElementById("scoreO");
const scoreX = document.getElementById("scoreX");
const board = document.getElementById("board");
const cells = document.querySelectorAll(".cell");
const overlay = document.getElementById("overlay");
const overlayMsg = document.getElementById("overlayMsg");
const title = document.getElementById("overlayTitle");
const reset = document.getElementById("resetGame");
const score = document.getElementById("resetScore");
const playAgain = document.getElementById("playAgain");
const setting = document.querySelector(".controls");
const soundToggle = document.getElementById("soundToggle");
const clickSound = new Audio("click.ogg");
const winSound = new Audio("win.ogg");
const drawSound = new Audio("draw.ogg");
const bgMusic = new Audio("bg.aac");

bgMusic.loop = true;
bgMusic.volume = 0.3;

let bgMusicOn = true;
let bgStarted = false;
let turnO = true;
let firstTurn = true;
let scoreCountO = 0;
let scoreCountX = 0;

const winPatterns = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8],
];

// ✅ localStorage 
const loadTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        themeBtn.textContent = "⚫";
    } else {
        document.body.classList.remove("light-theme");
        themeBtn.textContent = "🔘";
    }
};

// ✅ localStorage 
const loadScore = () => {
    const savedScoreO = localStorage.getItem("scoreO");
    const savedScoreX = localStorage.getItem("scoreX");
    
    if (savedScoreO !== null) {
        scoreCountO = parseInt(savedScoreO);
        scoreO.innerText = scoreCountO;
    }
    
    if (savedScoreX !== null) {
        scoreCountX = parseInt(savedScoreX);
        scoreX.innerText = scoreCountX;
    }
};

// ✅ localStorage 
const saveScore = () => {
    localStorage.setItem("scoreO", scoreCountO);
    localStorage.setItem("scoreX", scoreCountX);
};

loadTheme();
loadScore();

// ✅ Sound Toggle Event
soundToggle.addEventListener("change", () => {
    bgMusicOn = soundToggle.checked;

    if (bgMusicOn && bgStarted) {
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    } else {
        bgMusic.pause();
    }
});

// ✅ Background Music 
document.body.addEventListener("click", () => {
    if (bgMusicOn && !bgStarted) {
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
        bgStarted = true;
    }
}, { once: true });

// ✅ Theme Toggle - localStorage 
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    
    if (document.body.classList.contains("light-theme")) {
        themeBtn.textContent = "⚫";
        localStorage.setItem("theme", "light"); 
    } else {
        themeBtn.textContent = "🔘";
        localStorage.setItem("theme", "dark"); 
    }
});

// ✅ Cell Click Event
cells.forEach((box) => {
    box.addEventListener("click", () => {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log("Click sound failed:", e));
        
        if (turnO) {
            box.innerText = "⭕";
            currentTurn.innerText = "❌";
            turnO = false;
        } else {
            box.innerText = "❌";
            currentTurn.innerText = "⭕";
            turnO = true;
        }
        
        box.disabled = true;
        const win = checkWin();
        
        if (!win) {
            const allFailed = [...cells].every(cell => cell.innerText !== "");
            if (allFailed) {
                overlay.classList.remove("hide");
                setting.classList.add("hide");
                currentTurn.innerText = "🤝";
                title.innerText = "Draw 🤝";
                overlayMsg.innerText = `❌ WIN ⭕`;
                
                drawSound.currentTime = 0;
                drawSound.play().catch(e => console.log("Draw sound failed:", e));
            }    
        }
    });
});

// ✅ Check Win Function
const checkWin = () => {
    for (let pattern of winPatterns) {
        let p1Val = cells[pattern[0]].innerText;
        let p2Val = cells[pattern[1]].innerText;
        let p3Val = cells[pattern[2]].innerText;
        
        if (p1Val !== "" && p2Val !== "" && p3Val !== "") {
            if (p1Val === p2Val && p2Val === p3Val) {
                overlay.classList.remove("hide");
                
                winSound.currentTime = 0;
                winSound.play().catch(e => console.log("Win sound failed:", e));
                
                setting.classList.add("hide");
                currentTurn.innerText = "🏆";
                title.innerText = "Winner!";
                overlayMsg.innerText = `${p1Val} wins the game`;
                
                if (p1Val === "⭕") {
                    scoreCountO++;
                    scoreO.innerText = scoreCountO;
                } else {
                    scoreCountX++;
                    scoreX.innerText = scoreCountX;
                }
                
                saveScore(); 
                
                return true;
            }
        }      
    }
    return false;
};

// ✅ Reset Game Function
const resetGame = () => {
    turnO = firstTurn;
    currentTurn.innerText = turnO ? "⭕" : "❌";
    for (let box of cells) {
        box.innerText = "";
        box.disabled = false;        
    }
};

// ✅ Reset Score Function - localStorage 
const resetScore = () => {
    scoreCountO = 0;
    scoreCountX = 0;
    scoreO.innerText = 0;
    scoreX.innerText = 0;
    
    localStorage.removeItem("scoreO"); 
    localStorage.removeItem("scoreX"); 
};

// ✅ Event Listeners
reset.addEventListener("click", resetGame);
score.addEventListener("click", resetScore);

playAgain.addEventListener("click", () => {
    overlay.classList.add("hide");
    setting.classList.remove("hide");
    firstTurn = !firstTurn;
    resetGame();   
});