window.onload = () => { // CRITICAL: Wait for all assets to load before running the script
    // --- 1. STATE MANAGEMENT ---
    let state = {
        pet: { happiness: 50, hunger: 50, energy: 50, status: 'idle' },
        timer: {
            isRunning: false, isBreak: false, intervalId: null,
            focusDuration: 25, // NEW: Default focus time in minutes
            timeRemaining: 25 * 60,
        },
        lastInteractionTime: Date.now()
    };
    const BREAK_TIME = 5 * 60;
    const STAT_DECAY_INTERVAL = 30000;

    // --- 2. DOM ELEMENT SELECTORS ---
    const petCanvas = document.getElementById('pet-canvas');
    const ctx = petCanvas.getContext('2d');
    const happinessBar = document.getElementById('happiness-bar');
    const hungerBar = document.getElementById('hunger-bar');
    const energyBar = document.getElementById('energy-bar');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const feedBtn = document.getElementById('feed-btn');
    const playBtn = document.getElementById('play-btn');
    const restBtn = document.getElementById('rest-btn');
    const talkBtn = document.getElementById('talk-btn');
    const thoughtBubble = document.getElementById('pet-thought-bubble');
    // NEW: Time adjustment selectors
    const timeDecreaseBtn = document.getElementById('time-decrease-btn');
    const timeIncreaseBtn = document.getElementById('time-increase-btn');
    const timeSettingDisplay = document.getElementById('time-setting-display');

    // --- 3. PET ANIMATION & DRAWING ---
    const petSprites = { idle: new Image(), happy: new Image(), sad: new Image() };
    // TODO: Create 256x64 sprite sheets (4 frames of 64x64) for each mood
    petSprites.idle.src = 'assets/images/idle-sheet.png';
    petSprites.happy.src = 'assets/images/happy-sheet.png';
    petSprites.sad.src = 'assets/images/sad-sheet.png';
    const FRAME_WIDTH = 64, FRAME_HEIGHT = 64;
    let currentFrame = 0, frameTicker = 0;

    function drawPet() {
        frameTicker++;
        if (frameTicker % 15 === 0) currentFrame = (currentFrame + 1) % 4;
        ctx.clearRect(0, 0, petCanvas.width, petCanvas.height);
        const currentSprite = petSprites[state.pet.status] || petSprites.idle;
        if (currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.drawImage(currentSprite, currentFrame * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, petCanvas.width, petCanvas.height);
        }
    }

    // --- 4. CORE GAME LOGIC ---
    function updateStats({ happiness = 0, hunger = 0, energy = 0 }) {
        state.pet.happiness = Math.max(0, Math.min(100, state.pet.happiness + happiness));
        state.pet.hunger = Math.max(0, Math.min(100, state.pet.hunger + hunger));
        state.pet.energy = Math.max(0, Math.min(100, state.pet.energy + energy));
        state.lastInteractionTime = Date.now();
        updatePetStatus();
        updateUI();
    }

    function updatePetStatus() {
        const { happiness, hunger, energy } = state.pet;
        if (happiness < 30 || hunger < 30 || energy < 20) state.pet.status = 'sad';
        else if (happiness > 70 && energy > 60) state.pet.status = 'happy';
        else state.pet.status = 'idle';
    }

    function handleStatDecay() {
        const timeSinceLastInteraction = Date.now() - state.lastInteractionTime;
        if (!state.timer.isRunning && timeSinceLastInteraction > STAT_DECAY_INTERVAL * 2) {
             updateStats({ happiness: -1, hunger: -1, energy: -1 });
        }
    }

    // --- 5. UI & INTERACTIONS ---
    function updateUI() {
        happinessBar.value = state.pet.happiness;
        hungerBar.value = state.pet.hunger;
        energyBar.value = state.pet.energy;
        timeSettingDisplay.textContent = `${state.timer.focusDuration} MIN`;

        const minutes = Math.floor(state.timer.timeRemaining / 60);
        const seconds = state.timer.timeRemaining % 60;
        
        const isInteractable = !state.timer.isRunning;
        feedBtn.disabled = !isInteractable;
        playBtn.disabled = !isInteractable;
        restBtn.disabled = !isInteractable;
        talkBtn.disabled = !isInteractable;
        timeDecreaseBtn.disabled = !isInteractable;
        timeIncreaseBtn.disabled = !isInteractable;

        if (state.timer.isRunning) {
            startTimerBtn.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            startTimerBtn.textContent = `START ${state.timer.focusDuration} MIN FOCUS`;
        }
    }
    
    const petMessages = ["You're doing great!", "Let's crush this task!", "Believe in yourself!", "I'm here for you!"];
    function talkToPet() {
        playSound('click');
        showThoughtBubble(petMessages[Math.floor(Math.random() * petMessages.length)], 3000);
    }

    function showThoughtBubble(text, duration) {
        thoughtBubble.textContent = text;
        thoughtBubble.classList.remove('hidden');
        if (duration) setTimeout(() => thoughtBubble.classList.add('hidden'), duration);
    }
    
    // NEW: Adjust focus duration
    function adjustTime(amount) {
        playSound('click');
        state.timer.focusDuration = Math.max(5, state.timer.focusDuration + amount); // Minimum 5 minutes
        updateUI();
    }

    // --- 6. POMODORO TIMER LOGIC ---
    function startTimer() {
        playSound('click');
        if (state.timer.isRunning) { // Stop the timer if it's running
            clearInterval(state.timer.intervalId);
            state.timer.isRunning = false;
            showThoughtBubble("Timer stopped.", 2000);
        } else { // Start a new focus session
            state.timer.isRunning = true;
            state.timer.isBreak = false;
            state.timer.timeRemaining = state.timer.focusDuration * 60;
            showThoughtBubble(`Focus for ${state.timer.focusDuration} mins!`, 3000);
            runTimer();
        }
        updateUI();
    }
    
    function runTimer() {
        clearInterval(state.timer.intervalId);
        state.timer.intervalId = setInterval(() => {
            state.timer.timeRemaining--;
            if (state.timer.timeRemaining < 0) {
                if (state.timer.isBreak) { // Break finishes
                    playSound('success');
                    showThoughtBubble("Break's over!", 3000);
                    showNotification("Break's over!", "Time to get back to it!");
                    clearInterval(state.timer.intervalId);
                    state.timer.isRunning = false;
                } else { // Focus session finishes
                    playSound('success');
                    updateStats({ happiness: 20, energy: -10 });
                    showNotification("Focus complete!", "Awesome job! Your pet is proud.");
                    state.timer.isBreak = true;
                    state.timer.timeRemaining = BREAK_TIME;
                    showThoughtBubble("Break time!", 3000);
                }
            }
            updateUI();
        }, 1000);
    }
    
    // --- 7. UTILITIES (Audio, Notifications, Persistence) ---
    function playSound(id) { const s = document.getElementById(`audio-${id}`); if(s) s.play().catch(e => {}); }
    function showNotification(t, b) { if(Notification.permission==='granted') new Notification(t, {body:b, icon:'assets/images/icon.png'}); }
    function saveState() { localStorage.setItem('focusTamaState', JSON.stringify(state)); }
    function loadState() {
        const saved = JSON.parse(localStorage.getItem('focusTamaState'));
        if (saved) {
            state = { ...state, ...saved, timer: { ...state.timer, ...saved.timer, isRunning: false, intervalId: null } };
        }
    }

    // --- 8. INITIALIZATION & EVENT LISTENERS ---
    loadState();
    updatePetStatus();
    updateUI();
    setInterval(handleStatDecay, STAT_DECAY_INTERVAL);
    setInterval(saveState, 5000); // Save state every 5 seconds
    Notification.requestPermission();
    (function gameLoop() {
        drawPet();
        requestAnimationFrame(gameLoop);
    })();

    startTimerBtn.addEventListener('click', startTimer);
    timeDecreaseBtn.addEventListener('click', () => adjustTime(-5));
    timeIncreaseBtn.addEventListener('click', () => adjustTime(5));
    feedBtn.addEventListener('click', () => { playSound('feed'); updateStats({ hunger: 25, happiness: 5 }); showThoughtBubble("Yum!", 2000); });
    playBtn.addEventListener('click', () => { playSound('click'); updateStats({ happiness: 20, energy: -15 }); showThoughtBubble("Fun!", 2000); });
    restBtn.addEventListener('click', () => { playSound('click'); updateStats({ energy: 30, happiness: 5 }); showThoughtBubble("Refreshed!", 2000); });
    talkBtn.addEventListener('click', talkToPet);
};window.onload = () => {
    // --- 1. CONFIG & CONSTANTS ---
    const API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // TODO: Add your OpenAI API key
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    const FOCUS_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
    const STAT_DECAY_INTERVAL = 30000;
    const EVOLUTION_THRESHOLD = 5; // Evolve after 5 completed focus sessions
    
    // Game data for feeding
    const FOOD_ITEMS = [
        { name: 'Apple', emoji: '🍎', description: 'A healthy, balanced snack.', happiness: 15, hunger: 15, energy: 5 },
        { name: 'Steak', emoji: '🥩', description: 'A full meal. Very satisfying!', happiness: 20, hunger: 40, energy: 10 },
        { name: 'Cake', emoji: '🍰', description: 'A super yummy treat!', happiness: 30, hunger: 5, energy: 15 },
        { name: 'Coffee', emoji: '☕', description: 'A huge energy boost!', happiness: 5, hunger: 5, energy: 40 }
    ];

    // --- 2. STATE MANAGEMENT ---
    let state = {
        pet: {
            happiness: 50,
            hunger: 50,
            energy: 50,
            status: 'idle', // 'idle', 'happy', 'sad'
            evolution: 0, // 0 = Stage 1, 1 = Stage 2
        },
        timer: {
            isRunning: false,
            isBreak: false,
            intervalId: null,
            timeRemaining: FOCUS_TIME,
        },
        focusSessionsCompleted: 0,
        lastInteractionTime: Date.now()
    };
    
    // --- 3. DOM ELEMENT SELECTORS ---
    const petCanvas = document.getElementById('pet-canvas');
    const ctx = petCanvas.getContext('2d');
    const happinessBar = document.getElementById('happiness-bar');
    const hungerBar = document.getElementById('hunger-bar');
    const energyBar = document.getElementById('energy-bar');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const feedBtn = document.getElementById('feed-btn');
    const talkBtn = document.getElementById('talk-btn');
    const thoughtBubble = document.getElementById('pet-thought-bubble');
    // Feeding Modal Elements
    const feedModal = document.getElementById('feed-modal');
    const foodSlider = document.getElementById('food-slider');
    const foodDescription = document.getElementById('food-description');
    let currentFoodIndex = 0;

    // --- 4. PET ANIMATION & DRAWING ---
    const petSprites = {
        base: { idle: new Image(), happy: new Image(), sad: new Image() },
        evo: { idle: new Image(), happy: new Image(), sad: new Image() }
    };
    // TODO: Ensure you have 6 sprite sheet files in 'assets/images/'
    petSprites.base.idle.src = 'assets/images/idle-sheet.png';
    petSprites.base.happy.src = 'assets/images/happy-sheet.png';
    petSprites.base.sad.src = 'assets/images/sad-sheet.png';
    petSprites.evo.idle.src = 'assets/images/puppy-evo-idle.png';
    petSprites.evo.happy.src = 'assets/images/puppy-evo-happy.png';
    petSprites.evo.sad.src = 'assets/images/puppy-evo-sad.png';
    
    const FRAME_WIDTH = 64, FRAME_HEIGHT = 64;
    let currentFrame = 0, frameTicker = 0;

    function drawPet() {
        frameTicker++;
        if (frameTicker % 15 === 0) currentFrame = (currentFrame + 1) % 4;
        ctx.clearRect(0, 0, petCanvas.width, petCanvas.height);
        
        const evolutionStage = state.pet.evolution === 0 ? 'base' : 'evo';
        const currentSpriteSet = petSprites[evolutionStage];
        const currentSprite = currentSpriteSet[state.pet.status] || currentSpriteSet.idle;
        
        if (currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.drawImage(currentSprite, currentFrame * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, petCanvas.width, petCanvas.height);
        }
    }

    // --- 5. CORE GAME LOGIC ---
    function updateStats({ happiness = 0, hunger = 0, energy = 0 }) {
        state.pet.happiness = Math.max(0, Math.min(100, state.pet.happiness + happiness));
        state.pet.hunger = Math.max(0, Math.min(100, state.pet.hunger + hunger));
        state.pet.energy = Math.max(0, Math.min(100, state.pet.energy + energy));
        state.lastInteractionTime = Date.now();
        updatePetStatus();
        updateUI();
    }

    function updatePetStatus() {
        const { happiness, hunger, energy } = state.pet;
        if (happiness < 30 || hunger < 30 || energy < 20) {
            if (state.pet.status !== 'sad') playSound('sad');
            state.pet.status = 'sad';
        } else if (happiness > 70 && energy > 60) {
            state.pet.status = 'happy';
        } else {
            state.pet.status = 'idle';
        }
    }

    function handleStatDecay() {
        if (!state.timer.isRunning) {
            updateStats({ happiness: -1, hunger: -2, energy: -1 }); // Hunger decays faster
        }
    }

    // --- 6. UI & INTERACTIONS ---
    function updateUI() {
        happinessBar.value = state.pet.happiness;
        hungerBar.value = state.pet.hunger;
        energyBar.value = state.pet.energy;

        const minutes = Math.floor(state.timer.timeRemaining / 60);
        const seconds = state.timer.timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const isInteractable = !state.timer.isRunning;
        feedBtn.disabled = !isInteractable;
        talkBtn.disabled = !isInteractable;
        startTimerBtn.textContent = state.timer.isRunning ? "STOP" : "START FOCUS";
    }
    
    function showThoughtBubble(text, duration = 3000) {
        thoughtBubble.textContent = text;
        thoughtBubble.classList.remove('hidden');
        if (duration) setTimeout(() => thoughtBubble.classList.add('hidden'), duration);
    }
    
    // --- 7. FEEDING MODAL LOGIC ---
    function populateSlider() {
        foodSlider.innerHTML = '';
        FOOD_ITEMS.forEach(item => {
            const foodDiv = document.createElement('div');
            foodDiv.className = 'food-item';
            foodDiv.innerHTML = `<div class="emoji">${item.emoji}</div><span>${item.name}</span>`;
            foodSlider.appendChild(foodDiv);
        });
    }

    function updateSliderPosition() {
        const itemWidth = foodSlider.children[0].offsetWidth;
        foodSlider.style.transform = `translateX(-${currentFoodIndex * itemWidth}px)`;
        foodDescription.textContent = FOOD_ITEMS[currentFoodIndex].description;
        showThoughtBubble(`Ooh, ${FOOD_ITEMS[currentFoodIndex].name}!`, 2000);
    }

    function openFeedModal() {
        playSound('click');
        currentFoodIndex = 0;
        updateSliderPosition();
        feedModal.classList.remove('hidden');
    }
    
    function handleConfirmFeed() {
        playSound('feed');
        const selectedFood = FOOD_ITEMS[currentFoodIndex];
        updateStats(selectedFood);
        showThoughtBubble(`Yum! Thanks for the ${selectedFood.name}!`, 3000);
        feedModal.classList.add('hidden');
    }

    // --- 8. AI INTERACTION ---
    async function talkToPet() {
        if (API_KEY === 'YOUR_OPENAI_API_KEY_HERE' || !API_KEY) {
            const messages = ["Let's do this!", "One task at a time.", "You're awesome!"];
            showThoughtBubble(messages[Math.floor(Math.random() * messages.length)]);
            return;
        }
        playSound('click'); talkBtn.disabled = true;
        showThoughtBubble('Thinking...', 4000);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { "role": "system", "content": "You are FocusTama, a cute, 90s-era pixel pet. Your personality is encouraging and fun, using slang like 'cool beans' or 'da bomb'. You give short, motivational advice about productivity, focus, and taking breaks. Keep responses under 25 words." },
                        { "role": "user", "content": "Give me a productivity tip!" }
                    ],
                    max_tokens: 40
                })
            });
            const data = await response.json();
            if(!response.ok) throw new Error(data.error.message);
            showThoughtBubble(data.choices[0].message.content.trim());
        } catch (error) {
            console.error("AI Error:", error);
            showThoughtBubble("Oops, brain freeze!", 3000);
        } finally {
            talkBtn.disabled = false;
        }
    }

    // --- 9. POMODORO TIMER LOGIC ---
    function handleTimer() {
        state.timer.isRunning ? stopTimer() : startFocusSession();
    }

    function startFocusSession() {
        state.timer.isRunning = true;
        state.timer.isBreak = false;
        state.timer.timeRemaining = FOCUS_TIME;
        showThoughtBubble("Focus time! Let's go!", 3000);
        runTimer();
    }

    function stopTimer() {
        clearInterval(state.timer.intervalId);
        state.timer.isRunning = false;
        showThoughtBubble("Timer stopped.", 2000);
        updateUI();
    }
    
    function runTimer() {
        clearInterval(state.timer.intervalId);
        state.timer.intervalId = setInterval(() => {
            state.timer.timeRemaining--;
            if (state.timer.timeRemaining < 0) {
                clearInterval(state.timer.intervalId);
                if (state.timer.isBreak) {
                    playSound('success');
                    showNotification("Break's over!", "Ready for the next round?");
                    stopTimer();
                } else {
                    playSound('success');
                    state.focusSessionsCompleted++;
                    updateStats({ happiness: 25, energy: -15 });
                    showNotification("Focus complete!", `Great work! That's ${state.focusSessionsCompleted} session(s) done!`);
                    
                    if (state.pet.evolution === 0 && state.focusSessionsCompleted >= EVOLUTION_THRESHOLD) {
                        state.pet.evolution = 1;
                        playSound('evolve'); // TODO: Add an 'evolve.wav' sound
                        showThoughtBubble("Whoa! I'm evolving!", 5000);
                    } else {
                        state.timer.isBreak = true;
                        state.timer.timeRemaining = BREAK_TIME;
                        runTimer();
                    }
                }
            }
            updateUI();
        }, 1000);
        updateUI();
    }
    
    // --- 10. UTILITIES (Audio, Notifications, Persistence) ---
    function playSound(id) { const s = document.getElementById(`audio-${id}`); if(s) s.play().catch(e => {}); }
    function showNotification(t,b) { if(Notification.permission === 'granted') new Notification(t, {body:b, icon:'assets/images/icon.png'}); }
    function saveState() { localStorage.setItem('focusTamaState', JSON.stringify(state)); }
    function loadState() {
        const saved = JSON.parse(localStorage.getItem('focusTamaState'));
        if (saved) {
            state = { ...state, ...saved, timer: { ...state.timer, isRunning: false, intervalId: null } };
        }
    }

    // --- 11. INITIALIZATION & EVENT LISTENERS ---
    function init() {
        loadState();
        populateSlider();
        updatePetStatus();
        updateUI();
        
        setInterval(handleStatDecay, STAT_DECAY_INTERVAL);
        setInterval(saveState, 5000);
        Notification.requestPermission();
        
        (function gameLoop() {
            drawPet();
            requestAnimationFrame(gameLoop);
        })();

        startTimerBtn.addEventListener('click', () => { playSound('click'); handleTimer(); });
        feedBtn.addEventListener('click', openFeedModal);
        talkBtn.addEventListener('click', talkToPet);
        
        // Modal Listeners
        document.getElementById('confirm-feed-btn').addEventListener('click', handleConfirmFeed);
        document.getElementById('cancel-feed-btn').addEventListener('click', () => { playSound('click'); feedModal.classList.add('hidden'); });
        document.getElementById('next-food-btn').addEventListener('click', () => { playSound('click'); currentFoodIndex = (currentFoodIndex + 1) % FOOD_ITEMS.length; updateSliderPosition(); });
        document.getElementById('prev-food-btn').addEventListener('click', () => { playSound('click'); currentFoodIndex = (currentFoodIndex - 1 + FOOD_ITEMS.length) % FOOD_ITEMS.length; updateSliderPosition(); });
    }
    
    init(); // Start the application
};
