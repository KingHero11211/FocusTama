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
    
    // NEW: Expanded food data and slider state
    const foodItems = [
        { name: 'Milk', emoji: '🥛', description: 'Good for strong bones.', happiness: 10, hunger: 20 },
        { name: 'a Fruit', emoji: '🍎', description: 'A healthy, balanced snack.', happiness: 15, hunger: 15 },
        { name: 'Chocolate', emoji: '🍫', description: 'A delicious burst of happiness!', happiness: 30, hunger: 5 },
        { name: 'a Meal', emoji: '🍔', description: 'A full meal. Very satisfying!', happiness: 20, hunger: 40 },
        { name: 'a Drink', emoji: '🥤', description: 'Quenches thirst slightly.', happiness: 5, hunger: 25 },
        { name: 'a Treat', emoji: '🍰', description: 'Super yummy, but not very filling!', happiness: 25, hunger: 10 },
        { name: 'Veggies', emoji: '🥦', description: 'Super healthy, but not a favorite.', happiness: 5, hunger: 30 }
    ];
    let currentFoodIndex = 0;


    // --- 2. DOM ELEMENTS ---
    const happinessStatEl = document.getElementById('happiness-stat');
    const hungerStatEl = document.getElementById('hunger-stat');
    const timerDisplayEl = document.getElementById('timer-display');
    const startFocusBtn = document.getElementById('start-focus-btn');
    const feedPetBtn = document.getElementById('feed-pet-btn');
    const askPetBtn = document.getElementById('ask-pet-btn');
    const focusTimeInput = document.getElementById('focus-time-input');
    const petThoughtBubbleEl = document.getElementById('pet-thought-bubble');
    
    // Modal and Slider elements
    const feedModalEl = document.getElementById('feed-modal');
    const confirmFeedBtn = document.getElementById('confirm-feed-btn');
    const cancelFeedBtn = document.getElementById('cancel-feed-btn');
    const foodSliderEl = document.getElementById('food-slider');
    const foodDescriptionEl = document.getElementById('food-description');
    const prevFoodBtn = document.getElementById('prev-food-btn');
    const nextFoodBtn = document.getElementById('next-food-btn');

    // Load Pet Sprites
    const petSprites = {
        idle: new Image(),
        happy: new Image(),
        sad: new Image(),
    };
    // Ensure your sprite sheets are in an 'assets/images' folder
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

    // --- 4. FEEDING MODAL & SLIDER LOGIC ---

    function populateSlider() {
        foodSliderEl.innerHTML = ''; // Clear existing items
        foodItems.forEach(item => {
            const foodDiv = document.createElement('div');
            foodDiv.className = 'food-item';
            foodDiv.innerHTML = `<div class="emoji">${item.emoji}</div><span>${item.name}</span>`;
            foodSliderEl.appendChild(foodDiv);
        });
    }
    
    function updateSliderPosition() {
        if (foodSliderEl.children.length === 0) return;
        const itemWidth = foodSliderEl.children[0].offsetWidth;
        foodSliderEl.style.transform = `translateX(-${currentFoodIndex * itemWidth}px)`;
        foodDescriptionEl.textContent = foodItems[currentFoodIndex].description;
    }

    function openFeedModal() {
        if (state.timer.isRunning) return;
        playSound('click');
        feedModalEl.classList.remove('hidden');
    }
    
    function closeFeedModal() {
        feedModalEl.classList.add('hidden');
    }

    function handleConfirmFeed() {
        playSound('feed');
        const selectedFood = foodItems[currentFoodIndex];
        updateStats(selectedFood.happiness, selectedFood.hunger);
        showThoughtBubble(`Yum! Thanks for the ${selectedFood.name}!`, 3000);
        closeFeedModal();
    }
    
    // --- 5. AI & UI ---

    async function askPet() {
        if (API_KEY === 'YOUR_OPENAI_API_KEY' || API_KEY === '') {
            showThoughtBubble("My brain is offline! (No API Key)", 4000);
            return;
        }
        playSound('click');
        showThoughtBubble('Thinking...', 10000); 
        askPetBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
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
        const isInteractable = !state.timer.isRunning;
        startFocusBtn.disabled = !isInteractable;
        feedPetBtn.disabled = !isInteractable;
        askPetBtn.disabled = !isInteractable;
        focusTimeInput.disabled = !isInteractable;
    }

    // --- 6. ANIMATION & SOUND ---

    function gameLoop() {
        frameTicker++;
        if (frameTicker >= FRAME_RATE) {
            frameTicker = 0;
            currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const currentSprite = petSprites[state.pet.status];
        if (currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.drawImage(
                currentSprite,
                currentFrame * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT,
                (canvas.width - FRAME_WIDTH * 2) / 2, (canvas.height - FRAME_HEIGHT * 2) / 2, FRAME_WIDTH * 2, FRAME_HEIGHT * 2
            );
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    function playSound(id) {
        const sound = document.getElementById(`audio-${id}`);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.log(`Audio play failed for ${id}: ${error}`));
        }
    }

    // --- 7. PERSISTENCE & NOTIFICATIONS ---

    function saveState() {
        localStorage.setItem('focusTamaState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('focusTamaState');
        if (savedState) {
            state = JSON.parse(savedState);
            state.timer.isRunning = false;
            if(state.timer.intervalId) clearInterval(state.timer.intervalId);
        }
    }
    
    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: 'assets/images/icon.png' });
        }
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    
    // --- INITIALIZE & EVENT LISTENERS ---
    loadState();
    populateSlider();
    updateUI();
    updateSliderPosition();
    requestNotificationPermission();
    gameLoop();

    startFocusBtn.addEventListener('click', startFocusSession);
    feedPetBtn.addEventListener('click', openFeedModal);
    askPetBtn.addEventListener('click', askPet);
    
    // Listeners for the modal
    confirmFeedBtn.addEventListener('click', handleConfirmFeed);
    cancelFeedBtn.addEventListener('click', closeFeedModal);
    nextFoodBtn.addEventListener('click', () => {
        currentFoodIndex = (currentFoodIndex + 1) % foodItems.length;
        playSound('click');
        updateSliderPosition();
    });
    prevFoodBtn.addEventListener('click', () => {
        currentFoodIndex = (currentFoodIndex - 1 + foodItems.length) % foodItems.length;
        playSound('click');
        updateSliderPosition();
    });
});
