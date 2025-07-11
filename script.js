document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & STATE ---
    const API_KEY = 'YOUR_OPENAI_API_KEY'; // IMPORTANT: Add your OpenAI API Key here
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    // Canvas and Animation settings
    const canvas = document.getElementById('pet-canvas');
    const ctx = canvas.getContext('2d');
    const FRAME_WIDTH = 64;
    const FRAME_HEIGHT = 64;
    const TOTAL_FRAMES = 4;
    let currentFrame = 0;
    let frameTicker = 0;
    const FRAME_RATE = 15; // Lower is slower

    let state = {
        pet: {
            happiness: 50,
            hunger: 50,
            status: 'idle', // idle, happy, sad
        },
        timer: {
            isRunning: false,
            intervalId: null,
            timeRemaining: 25 * 60,
        },
    };

    // --- 2. DOM ELEMENTS ---
    const happinessStatEl = document.getElementById('happiness-stat');
    const hungerStatEl = document.getElementById('hunger-stat');
    const timerDisplayEl = document.getElementById('timer-display');
    const startFocusBtn = document.getElementById('start-focus-btn');
    const breakBtn = document.getElementById('break-btn');
    const askPetBtn = document.getElementById('ask-pet-btn');
    const focusTimeInput = document.getElementById('focus-time-input');
    const petThoughtBubbleEl = document.getElementById('pet-thought-bubble');

    // Load Pet Sprites
    // Load Pet Sprites
    const petSprites = {
        idle: new Image(),
        happy: new Image(),
        sad: new Image(),
    };
    // CORRECTED PATHS
    petSprites.idle.src = 'assets/images/idle-sheet.png'; 
    petSprites.happy.src = 'assets/images/happy-sheet.png';
    petSprites.sad.src = 'assets/images/sad-sheet.png';

    // --- 3. CORE LOGIC ---

    function updateStats(happinessDelta, hungerDelta) {
        state.pet.happiness = Math.max(0, Math.min(100, state.pet.happiness + happinessDelta));
        state.pet.hunger = Math.max(0, Math.min(100, state.pet.hunger + hungerDelta));
        
        if (state.pet.happiness < 30 || state.pet.hunger < 30) {
            if (state.pet.status !== 'sad') playSound('sad');
            state.pet.status = 'sad';
        } else if (state.pet.happiness > 70) {
            state.pet.status = 'happy';
        } else {
            state.pet.status = 'idle';
        }
        
        saveState();
        updateUI();
    }
    
    function startFocusSession() {
        if (state.timer.isRunning) return;
        playSound('click');
        
        const focusMinutes = parseInt(focusTimeInput.value);
        if (isNaN(focusMinutes) || focusMinutes < 1) return;

        state.timer.isRunning = true;
        state.timer.timeRemaining = focusMinutes * 60;
        
        showThoughtBubble(`Let's focus for ${focusMinutes} minutes!`, 3000);

        state.timer.intervalId = setInterval(() => {
            state.timer.timeRemaining--;

            // Every minute, decrease stats
            if (state.timer.timeRemaining % 60 === 0) {
                updateStats(0, -5); // Gets hungrier over time
            }

            if (state.timer.timeRemaining <= 0) {
                clearInterval(state.timer.intervalId);
                state.timer.isRunning = false;
                updateStats(25, 0); // Big happiness boost for finishing!
                showNotification('Focus Complete!', 'Great work! Your pet is proud of you.');
                playSound('success');
                showThoughtBubble('Awesome session! You rock!', 4000);
            }
            updateUI();
        }, 1000);

        updateUI();
    }

    function takeBreak() {
        if (state.timer.isRunning) return;
        playSound('feed');
        updateStats(10, 30); // Feeding the pet
        showThoughtBubble('Yum! Thanks for the break!', 3000);
    }
    
    // --- 4. AI & UI ---

    async function askPet() {
        if (API_KEY === 'YOUR_OPENAI_API_KEY') {
            showThoughtBubble("My brain is offline! (No API Key)", 4000);
            return;
        }
        playSound('click');
        showThoughtBubble('Thinking...', 10000); // Show thinking bubble indefinitely until response
        askPetBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // Cheaper and faster for hackathons
                    messages: [
                        { "role": "system", "content": "You are FocusTama, a cute, 90s-era pixel pet who loves productivity. Your personality is like a Tamagotchi mixed with a helpful friend. You use fun, encouraging language, sometimes 90s slang like 'cool beans' or 'da bomb'. Keep your responses very short, under 25 words." },
                        { "role": "user", "content": "Tell me something encouraging or a fun fact." }
                    ],
                    max_tokens: 40
                })
            });
            const data = await response.json();
            const message = data.choices[0].message.content.trim();
            showThoughtBubble(message, 5000);
        } catch (error) {
            console.error("AI Error:", error);
            showThoughtBubble("Oops, I got a brain freeze!", 4000);
        } finally {
            askPetBtn.disabled = false;
        }
    }

    function showThoughtBubble(text, duration) {
        petThoughtBubbleEl.textContent = text;
        petThoughtBubbleEl.classList.remove('hidden');
        if (duration) {
            setTimeout(() => petThoughtBubbleEl.classList.add('hidden'), duration);
        }
    }

    function updateUI() {
        // Stats
        happinessStatEl.textContent = state.pet.happiness;
        hungerStatEl.textContent = state.pet.hunger;
        
        // Timer
        const minutes = Math.floor(state.timer.timeRemaining / 60);
        const seconds = state.timer.timeRemaining % 60;
        timerDisplayEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Buttons
        startFocusBtn.disabled = state.timer.isRunning;
        breakBtn.disabled = state.timer.isRunning;
        focusTimeInput.disabled = state.timer.isRunning;
    }

    // --- 5. ANIMATION & SOUND ---

    function gameLoop() {
        frameTicker++;
        if (frameTicker >= FRAME_RATE) {
            frameTicker = 0;
            currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentSprite = petSprites[state.pet.status];
        if (currentSprite.complete) { // Ensure image is loaded
            ctx.drawImage(
                currentSprite,
                currentFrame * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT, // Source rect
                (canvas.width - FRAME_WIDTH * 2) / 2, (canvas.height - FRAME_HEIGHT * 2) / 2, FRAME_WIDTH * 2, FRAME_HEIGHT * 2 // Destination rect (scaled up)
            );
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    function playSound(id) {
        const sound = document.getElementById(`audio-${id}`);
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    // --- 6. PERSISTENCE & NOTIFICATIONS ---

    function saveState() {
        localStorage.setItem('focusTamaState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('focusTamaState');
        if (savedState) {
            state = JSON.parse(savedState);
            // Reset timer state on load, but keep pet state
            state.timer.isRunning = false;
            clearInterval(state.timer.intervalId);
        }
    }
    
    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: 'images/icon.png' });
        }
    }

    function requestNotificationPermission() {
        if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }
    
    // --- INITIALIZE ---
    loadState();
    updateUI();
    requestNotificationPermission();
    gameLoop(); // Start the animation loop

    startFocusBtn.addEventListener('click', startFocusSession);
    breakBtn.addEventListener('click', takeBreak);
    askPetBtn.addEventListener('click', askPet);
});