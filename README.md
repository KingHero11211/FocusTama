# FocusTama 🐾 - Your Retro Productivity Pet

**FocusTama is a web-based, AI-powered virtual pet designed to make productivity fun and help combat burnout.** Inspired by the classic 90s Tamagotchi, you care for a pixel-art pet by completing real-world tasks and taking healthy breaks. Your pet's mood, health, and growth are a direct reflection of your focus and wellness habits.

This project was built for the **"Blast from the Past: With a Modern Twist"** theme, reviving the beloved virtual pet concept with modern web technologies, including a dynamic UI, browser notifications, and a conversational AI companion powered by Google's Gemini.

**[▶️ Live Demo Link Here]** <!-- TODO: Add your live demo link (e.g., from GitHub Pages or Netlify) -->

<img width="1908" height="976" alt="Image" src="https://github.com/user-attachments/assets/9001aba8-3a62-4e7c-88fb-244f5c05d634" />

### Focus Streak Graph
A GitHub-style contribution graph visualizes your productivity over the last 70 days.

![Graph View](https://github.com/user-attachments/assets/111a8d2b-0652-4045-946d-8c29f82406e5)

---

## ✨ Core Features

*   **Interactive Virtual Pet:** Care for a cute pixel-art puppy. Its happiness, hunger, and energy levels change in real-time based on your actions.
*   **Integrated Task Management:** A built-in to-do list allows you to add tasks. The Pomodoro-style timer can only be started when a task is selected, directly linking your focus sessions to tangible goals.
*   **Gamified Productivity Loop:**
    *   **Focus:** Completing a focus session rewards your pet, boosting its happiness.
    *   **Breaks:** After a focus session, you're prompted to take a break. Caring for your pet (feeding it) during this time helps it recover.
    *   **Consequences:** Neglecting your pet for too long will cause its stats to drop and its mood to worsen, encouraging consistent engagement and healthy habits.
*   **Pet Evolution:** Your pet visually evolves into a cooler form after you successfully complete 5 focus sessions, providing a long-term goal and a powerful reward for your dedication.
*   **Conversational AI Companion:** Chat with your pet! It uses the Google Gemini API to provide unique, encouraging, and context-aware responses, making it feel like a true companion.
*   **Dynamic Day/Night Cycle:** The app's entire visual theme smoothly transitions between day, dusk, and night based on your local time. Your pet will even go to sleep at night, pausing stat decay.
*   **Focus Streak Graph:** A GitHub-style contribution graph visualizes your productivity over the last 70 days, motivating you to maintain a consistent routine.
*   **Persistent State:** Your pet's state, tasks, and progress are automatically saved to your browser's `localStorage`, so your companion is always there when you return.
*   **Retro UI & Sound:** A carefully crafted interface with pixel art, a CRT scanline effect, and 8-bit sound effects delivers a powerful dose of 90s nostalgia.

---

## 🛠️ Technology Stack

This project was built from the ground up with a focus on clean, framework-free code.

*   **Frontend:** Pure HTML5, CSS3, and JavaScript (ES6+).
*   **Graphics:** HTML `<canvas>` for smooth, sprite-based animations.
*   **Styling:** CSS variables for easy theming (like the day/night cycle) and Flexbox/Grid for responsive layouts.
*   **AI:** [Google AI Studio (Gemini API)](https://aistudio.google.com/) for natural language conversation.
*   **Storage:** Browser `localStorage` for all state persistence.
*   **Notifications:** Web Notifications API for reminders.
*   **Audio:** HTML5 `<audio>` for sound effects.

---

## 📂 File Structure

The project is organized into a clean and intuitive structure:
focustama/
│
├── 📄 index.html # The main HTML file containing the app structure.
├── 📄 style.css # All styles for the UI, device, and animations.
├── 📄 script.js # The core application logic, state, and game loops.
├── 📄 config.js # Holds the secret API key (ignored by Git).
├── 📄 README.md # You are here!
├── 📄 .gitignore # Tells Git to ignore sensitive files like config.js.
│
└── 📁 assets/
├── 📁 audio/
│ ├── 🔊 click.mp3
│ ├── 🔊 success.mp3
│ ├── 🔊 feed.mp3
│ ├── 🔊 sad.mp3
│ └── 🔊 evolve.mp3
│
└── 📁 images/
├── 🖼️ icon.png
├── 🖼️ puppy-idle.png
├── 🖼️ puppy-happy.png
├── 🖼️ puppy-sad.png
├── 🖼️ puppy-evo-idle.png
├── 🖼️ puppy-evo-happy.png
└── 🖼️ puppy-evo-sad.png

---

## 🚀 Getting Started

To run FocusTama on your local machine, follow these simple steps.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge).
*   A code editor (like VS Code).
*   The **Live Server** extension for VS Code is highly recommended to avoid potential CORS issues with the AI API.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/focustama.git
    cd focustama
    ```

2.  **Create your configuration file:**
    *   In the root of the project, create a new file named `config.js`.
    *   This file will hold your secret API key and is ignored by Git (see `.gitignore`).

3.  **Get your Google AI API Key:**
    *   Visit [aistudio.google.com](https://aistudio.google.com/).
    *   Log in and click **"Get API key"** -> **"+ Create API key in new project"**.
    *   Copy the generated key.

4.  **Add your API Key to `config.js`:**
    *   Open `config.js` and add the following line, pasting your key inside the quotes:
    ```javascript
    const GOOGLE_API_KEY = 'PASTE_YOUR_GOOGLE_AI_API_KEY_HERE';
    ```

5.  **Run the application:**
    *   If you have the **Live Server** extension in VS Code, simply right-click `index.html` and choose "Open with Live Server".
    *   Otherwise, you can open `index.html` directly in your browser.

Your FocusTama should now be running locally!

---

## 💡 Future Development

While this version is feature-complete, here are some exciting ideas for future expansion:
*   **Focus Shop:** Earn a currency from completed tasks to buy accessories (hats, scarves) or new backgrounds for your pet.
*   **More Mini-Games:** Add more ways to "Play" with your pet to increase happiness.
*   **Weekly Goals & Achievements:** Implement a system for weekly challenges (e.g., "Complete 10 focus sessions") to encourage long-term consistency.
*   **Browser Extension:** A companion extension to show your pet's status at a glance and gently remind you to stay off distracting sites during a focus session.

---

Thank you for checking out FocusTama! I hope it helps you stay focused and brings a smile to your face.
