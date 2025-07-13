// Wrap the entire application in an Immediately Invoked Function Expression (IIFE)
// and a `window.onload` event to ensure everything runs after the page is ready
// and to avoid polluting the global scope.
window.onload = () => {
    // --- 1. CONFIG & CONSTANTS ---
    const API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // TODO: Add your OpenAI API key
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    const EVOLUTION_THRESHOLD = 5;
    const STAT_DECAY_INTERVAL = 30000;
    const FOOD_ITEMS = [
        { name: 'Apple', emoji: '🍎', description: 'A healthy, balanced snack.', happiness: 15, hunger: 15, energy: 5 },
        { name: 'Steak', emoji: '🥩', description: 'A full meal. Very satisfying!', happiness: 20, hunger: 40, energy: 10 },
        { name: 'Cake', emoji: '🍰', description: 'A super yummy treat!', happiness: 30, hunger: 5, energy: 15 },
        { name: 'Coffee', emoji: '☕', description: 'A huge energy boost!', happiness: 5, hunger: 5, energy: 40 }
    ];

    // --- 2. STATE MANAGEMENT ---
    let state = {};
    function getDefaultState() {
        return {
            pet: { happiness: 50, hunger: 50, energy: 50, status: 'idle', evolution: 0, isSleeping: false },
            timer: { isRunning: false, isBreak: false, intervalId: null, timeRemaining: 25 * 60, activeTaskId: null },
            tasks: [],
            focusSessionsCompleted: 0,
            settings: { focusDuration: 25, breakDuration: 5, sound: true },
            lastInteractionTime: Date.now()
        };
    }

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
    const taskSelect = document.getElementById('task-select');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const feedModal = document.getElementById('feed-modal');
    const foodSlider = document.getElementById('food-slider');
    const foodDescription = document.getElementById('food-description');
    const settingsModal = document.getElementById('settings-modal');
    const settingFocusTime = document.getElementById('setting-focus-time');
    const settingBreakTime = document.getElementById('setting-break-time');
    const settingSoundToggle = document.getElementById('setting-sound-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    const confirmFeedBtn = document.getElementById('confirm-feed-btn');
    const cancelFeedBtn = document.getElementById('cancel-feed-btn');
    const prevFoodBtn = document.getElementById('prev-food-btn');
    const nextFoodBtn = document.getElementById('next-food-btn');

    // --- 4. PET ANIMATION & DRAWING ---
    const petSprites = {
        base: { idle: new Image(), happy: new Image(), sad: new Image() },
        evo: { idle: new Image(), happy: new Image(), sad: new Image() }
    };

    let spritesLoaded = 0;
    
    const FRAME_WIDTH = 64, FRAME_HEIGHT = 64;
    let currentFrame = 0, frameTicker = 0;

    function drawPet() {
        if (!state.pet) return; // Guard clause against running before state is initialized
        frameTicker++;
        if (frameTicker % 15 === 0) {
            currentFrame = (currentFrame + 1) % 4;
        }
        ctx.clearRect(0, 0, petCanvas.width, petCanvas.height);
        const evolutionStage = state.pet.evolution === 0 ? 'base' : 'evo';
        const currentSpriteSet = petSprites[evolutionStage];
        let currentSprite = currentSpriteSet[state.pet.status] || currentSpriteSet.idle;
        if (state.pet.isSleeping) {
            currentSprite = currentSpriteSet.sad; // Use 'sad' animation for sleeping
        }
        if (currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.drawImage(currentSprite, currentFrame * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, petCanvas.width, petCanvas.height);
        }
    }

        // This is the function that was missing.
    function loadSprites() {
        const spritePaths = {
            base: { idle: 'assets/images/puppy-idle.png', happy: 'assets/images/puppy-happy.png', sad: 'assets/images/puppy-sad.png' },
            evo: { idle: 'assets/images/puppy-evo-idle.png', happy: 'assets/images/puppy-evo-happy.png', sad: 'assets/images/puppy-evo-sad.png' }
        };
        let totalSprites = 0;
        for (const stage in spritePaths) {
            for (const mood in spritePaths[stage]) {
                totalSprites++;
                petSprites[stage][mood].src = spritePaths[stage][mood];
                petSprites[stage][mood].onload = () => {
                    spritesLoaded++;
                    if (spritesLoaded === totalSprites) {
                        init(); // Start the app only when all images are loaded
                    }
                };
                petSprites[stage][mood].onerror = () => {
                    console.error(`Failed to load sprite: ${spritePaths[stage][mood]}`);
                    spritesLoaded++;
                    if (spritesLoaded === totalSprites) {
                        init(); // Also init on error to not block app
                    }
                };
            }
        }
    }

    // --- 5. CORE LOGIC ---
    function updateStats({ happiness = 0, hunger = 0, energy = 0 }) {
        if (state.pet.isSleeping && happiness <= 0 && hunger <= 0 && energy <= 0) return;
        state.pet.happiness = Math.max(0, Math.min(100, state.pet.happiness + happiness));
        state.pet.hunger = Math.max(0, Math.min(100, state.pet.hunger + hunger));
        state.pet.energy = Math.max(0, Math.min(100, state.pet.energy + energy));
        state.lastInteractionTime = Date.now();
        updatePetStatus();
        updateUI();
    }

    function updatePetStatus() {
        if (state.pet.isSleeping) return;
        const oldStatus = state.pet.status;
        if (state.pet.happiness < 30 || state.pet.hunger < 30 || state.pet.energy < 20) {
            state.pet.status = 'sad';
            if (oldStatus !== 'sad') {
                triggerContextualThought(state.pet.hunger < 30 ? 'hungry' : 'bored');
            }
        } else if (state.pet.happiness > 70 && state.pet.energy > 60) {
            state.pet.status = 'happy';
        } else {
            state.pet.status = 'idle';
        }
    }

    function handleStatDecay() {
        if (!state.timer.isRunning && !state.pet.isSleeping) {
            updateStats({ happiness: -1, hunger: -2, energy: -1 });
        }
    }

    // --- 6. UI & INTERACTIONS ---
    function updateUI() {
        if (!state.pet) return;
        happinessBar.value = state.pet.happiness;
        hungerBar.value = state.pet.hunger;
        energyBar.value = state.pet.energy;
        const minutes = Math.floor(state.timer.timeRemaining / 60);
        const seconds = state.timer.timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const isInteractable = !state.timer.isRunning;
        feedBtn.disabled = !isInteractable;
        talkBtn.disabled = !isInteractable;
        taskInput.disabled = !isInteractable;
        taskForm.querySelector('button').disabled = !isInteractable;
        settingsBtn.disabled = !isInteractable;
        const hasTasks = state.tasks.some(task => !task.completed);
        const taskSelected = taskSelect.value !== "";
        startTimerBtn.disabled = !isInteractable || !hasTasks || !taskSelected;
        if (isInteractable) {
            startTimerBtn.textContent = hasTasks && taskSelected ? "START FOCUS" : (hasTasks ? "SELECT A TASK" : "ADD A TASK");
        } else {
            startTimerBtn.textContent = state.timer.isBreak ? "ENJOY YOUR BREAK" : "FOCUS IN PROGRESS...";
        }
    }

    function showThoughtBubble(text, duration = 3000) {
        thoughtBubble.textContent = text;
        thoughtBubble.classList.remove('hidden');
        if (duration) {
            setTimeout(() => thoughtBubble.classList.add('hidden'), duration);
        }
    }

    // --- 7. DAY/NIGHT & CONTEXTUAL EVENTS ---
    function updateDayNightCycle() {
        const hour = new Date().getHours();
        const body = document.body;
        const device = document.getElementById('device');
        const sky = document.getElementById('sky-gradient');
        let newBg, newDevice, newSky, newText;

        if (hour >= 6 && hour < 18) { newBg = 'var(--day-bg)'; newDevice = 'var(--day-device)'; newSky = '#87CEEB'; newText = 'var(--day-text)'; } 
        else if (hour >= 18 && hour < 20) { newBg = 'var(--dusk-bg)'; newDevice = 'var(--dusk-device)'; newSky = '#483D8B'; newText = 'var(--dusk-text)'; } 
        else { newBg = 'var(--night-bg)'; newDevice = 'var(--night-device)'; newSky = '#1a1a2e'; newText = 'var(--night-text)'; }
        
        body.style.backgroundColor = newBg;
        device.style.backgroundColor = newDevice;
        device.style.color = newText;
        sky.style.backgroundColor = newSky;

        const wasSleeping = state.pet.isSleeping;
        state.pet.isSleeping = (hour >= 22 || hour < 6);
        if (state.pet.isSleeping && !wasSleeping) {
            triggerContextualThought('sleep');
        } else if (!state.pet.isSleeping && wasSleeping) {
            triggerContextualThought('wake');
        }
    }
    const contextualThoughts = {
        sleep: "Zzzz... time to rest.",
        wake: "Good morning! Let's be productive!",
        hungry: "My tummy is rumbling...",
        bored: "I'm feeling down...",
        taskComplete: (taskText) => `Finished "${taskText}"! Great job!`,
    };
    function triggerContextualThought(event, data) {
        let message = typeof contextualThoughts[event] === 'function' ? contextualThoughts[event](data) : contextualThoughts[event];
        showThoughtBubble(message, 4000);
    }

    // --- 8. TASK MANAGEMENT ---
    function renderTasks() {
        if (!state.tasks) return;
        const uncompletedTasks = state.tasks.filter(t => !t.completed);
        const currentSelection = taskSelect.value;
        taskSelect.innerHTML = uncompletedTasks.length > 0 ? '<option value="">-- SELECT A TASK --</option>' : '<option value="">-- ADD A TASK BELOW --</option>';
        uncompletedTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.text;
            taskSelect.appendChild(option);
        });
        if (uncompletedTasks.some(t => t.id == currentSelection)) {
            taskSelect.value = currentSelection;
        }
        updateUI();
    }

    function addTask(e) {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (text) {
            const newTask = { id: Date.now(), text, completed: false };
            state.tasks.push(newTask);
            taskInput.value = '';
            renderTasks();
            taskSelect.value = newTask.id;
            updateUI();
        }
    }

    function completeTask(taskId) {
        const task = state.tasks.find(t => t.id == taskId);
        if (task) {
            task.completed = true;
            updateStats({ happiness: 30, energy: -5 });
            triggerContextualThought('taskComplete', task.text);
            renderTasks();
        }
    }

    // --- 9. MODAL LOGIC (FEEDING & SETTINGS) ---
    let currentFoodIndex = 0;
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
        if (foodSlider.children.length === 0) return;
        const itemWidth = foodSlider.children[0].offsetWidth;
        foodSlider.style.transform = `translateX(-${currentFoodIndex * itemWidth}px)`;
        foodDescription.textContent = FOOD_ITEMS[currentFoodIndex].description;
    }

    function openFeedModal() {
        if (!state.timer.isRunning) {
            playSound('click');
            feedModal.classList.remove('hidden');
            updateSliderPosition();
        }
    }

    function handleConfirmFeed() {
        playSound('feed');
        const food = FOOD_ITEMS[currentFoodIndex];
        updateStats(food);
        showThoughtBubble(`Yum! Thanks for the ${food.name}!`, 3000);
        feedModal.classList.add('hidden');
    }

    function openSettingsModal() {
        settingFocusTime.value = state.settings.focusDuration;
        settingBreakTime.value = state.settings.breakDuration;
        settingSoundToggle.textContent = state.settings.sound ? 'ON' : 'OFF';
        settingsModal.classList.remove('hidden');
    }

    function saveSettings() {
        state.settings.focusDuration = parseInt(settingFocusTime.value) || 25;
        state.settings.breakDuration = parseInt(settingBreakTime.value) || 5;
        if (!state.timer.isRunning) {
            state.timer.timeRemaining = state.settings.focusDuration * 60;
        }
        settingsModal.classList.add('hidden');
        updateUI();
    }

    function resetProgress() {
        if (confirm('Are you sure? This will reset your pet and all tasks!')) {
            localStorage.removeItem('focusTamaState');
            init(true); // Re-initialize with default state
        }
    }

    // --- 10. AI INTERACTION ---
    async function talkToPet() {
        if (!API_KEY || API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
            const messages = ["Let's do this!", "One task at a time.", "You're awesome!"];
            showThoughtBubble(messages[Math.floor(Math.random() * messages.length)]);
            return;
        }
        playSound('click');
        talkBtn.disabled = true;
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
            if (!response.ok) throw new Error(data.error ? data.error.message : "Unknown API Error");
            showThoughtBubble(data.choices[0].message.content.trim());
        } catch (error) {
            console.error("AI Error:", error);
            showThoughtBubble("Oops, brain freeze!", 3000);
        } finally {
            if (!state.timer.isRunning) talkBtn.disabled = false;
        }
    }

    // --- 11. POMODORO TIMER ---
    function handleTimer() {
        state.timer.isRunning ? stopTimer() : startFocusSession();
    }

    function startFocusSession() {
        const taskId = taskSelect.value;
        if (!taskId) {
            showThoughtBubble("Please select a task first!", 2000);
            return;
        }
        state.timer.activeTaskId = taskId;
        state.timer.isRunning = true;
        state.timer.isBreak = false;
        state.timer.timeRemaining = state.settings.focusDuration * 60;
        showThoughtBubble(`Focus on "${taskSelect.options[taskSelect.selectedIndex].text}"!`, 3000);
        runTimer();
    }

    function stopTimer() {
        clearInterval(state.timer.intervalId);
        state.timer.isRunning = false;
        showThoughtBubble("Timer paused.", 2000);
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
                    completeTask(state.timer.activeTaskId);
                    if (state.pet.evolution === 0 && state.focusSessionsCompleted >= EVOLUTION_THRESHOLD) {
                        state.pet.evolution = 1;
                        playSound('evolve');
                        applyScreenShake();
                        showThoughtBubble("Whoa! I'm evolving!", 5000);
                    }
                    state.timer.isBreak = true;
                    state.timer.timeRemaining = state.settings.breakDuration * 60;
                    showNotification("Focus complete!", "Time for a well-deserved break.");
                    runTimer();
                }
            } else {
                updateUI();
            }
        }, 1000);
        updateUI();
    }

    // --- 12. UTILITIES ---
    function playSound(id) {
        if (state.settings.sound) {
            const sound = document.getElementById(`audio-${id}`);
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {});
            }
        }
    }

    function showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: 'assets/images/icon.png', silent: true });
        }
    }

    function saveState() {
        localStorage.setItem('focusTamaState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('focusTamaState');
        // Merge saved state with default state to prevent errors if new properties are added
        const defaultState = getDefaultState();
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Deep merge to handle nested objects like pet and settings
            state = {
                ...defaultState,
                ...parsedState,
                pet: { ...defaultState.pet, ...parsedState.pet },
                settings: { ...defaultState.settings, ...parsedState.settings },
                tasks: parsedState.tasks || defaultState.tasks,
            };
        } else {
            state = defaultState;
        }
    }

    function applyScreenShake() {
        document.getElementById('screen').classList.add('shake');
        setTimeout(() => document.getElementById('screen').classList.remove('shake'), 300);
    }

    // --- 13. INITIALIZATION ---
    function init(isReset = false) {
        if (isReset) {
            state = getDefaultState();
        }
        
        // This is the correct order:
        // 1. Set up the state
        // 2. Populate UI elements that depend on state
        // 3. Set up recurring processes
        // 4. Request one-time permissions
        
        renderTasks();
        populateSlider();
        updateDayNightCycle();
        updateUI();
        
        // Clear old intervals before setting new ones to prevent duplicates on reset
        if (window.decayInterval) clearInterval(window.decayInterval);
        if (window.saveInterval) clearInterval(window.saveInterval);
        if (window.dayNightInterval) clearInterval(window.dayNightInterval);

        window.dayNightInterval = setInterval(updateDayNightCycle, 60000);
        window.decayInterval = setInterval(handleStatDecay, STAT_DECAY_INTERVAL);
        window.saveInterval = setInterval(saveState, 5000);
        
        Notification.requestPermission();
    }

    function attachEventListeners() {
        // This function is now called only once to prevent duplicate listeners
        if (window.listenersAttached) return;

        startTimerBtn.addEventListener('click', () => { playSound('click'); handleTimer(); });
        taskForm.addEventListener('submit', addTask);
        taskSelect.addEventListener('change', updateUI);
        feedBtn.addEventListener('click', openFeedModal);
        talkBtn.addEventListener('click', talkToPet);

        // Modal Listeners
        confirmFeedBtn.addEventListener('click', handleConfirmFeed);
        cancelFeedBtn.addEventListener('click', () => { playSound('click'); feedModal.classList.add('hidden'); });
        nextFoodBtn.addEventListener('click', () => { playSound('click'); currentFoodIndex = (currentFoodIndex + 1) % FOOD_ITEMS.length; updateSliderPosition(); });
        prevFoodBtn.addEventListener('click', () => { playSound('click'); currentFoodIndex = (currentFoodIndex - 1 + FOOD_ITEMS.length) % FOOD_ITEMS.length; updateSliderPosition(); });

        // Settings Listeners
        settingsBtn.addEventListener('click', () => { playSound('click'); openSettingsModal(); });
        saveSettingsBtn.addEventListener('click', () => { playSound('click'); saveSettings(); });
        cancelSettingsBtn.addEventListener('click', () => { playSound('click'); settingsModal.classList.add('hidden'); });
        resetProgressBtn.addEventListener('click', () => { playSound('sad'); resetProgress(); });
        settingSoundToggle.addEventListener('click', () => {
            state.settings.sound = !state.settings.sound;
            settingSoundToggle.textContent = state.settings.sound ? 'ON' : 'OFF';
            playSound('click');
        });
        window.listenersAttached = true;
    }
    
    // --- APP ENTRY POINT ---
    // 1. Load the user's saved state or a default state
    loadState();
    // 2. Attach all event listeners to the DOM elements
    attachEventListeners();
    // 3. Load all image assets
    loadSprites(); // This will call the main init() function when all sprites are loaded
    // 4. Start the animation loop immediately (it has a guard clause)
    (function gameLoop() {
        drawPet();
        requestAnimationFrame(gameLoop);
    })();
};
