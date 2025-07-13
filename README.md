# FocusTama 🐾 - Your Retro Productivity Pet

**FocusTama is a web-based, AI-powered virtual pet designed to make productivity fun and help combat burnout.** Inspired by the classic 90s Tamagotchi, you care for a pixel-art pet by completing real-world tasks and taking healthy breaks. Your pet's mood, health, and growth are a direct reflection of your focus and wellness habits.

This project was built for the **"Blast from the Past: With a Modern Twist"** theme, reviving the beloved virtual pet concept with modern web technologies, including a dynamic UI, browser notifications, and a conversational AI companion powered by Google's Gemini.

**[▶️ Live Demo Link Here]** <!-- TODO: Add your live demo link (e.g., from GitHub Pages or Netlify) -->

<img width="1908" height="976" alt="Image" src="https://github.com/user-attachments/assets/9001aba8-3a62-4e7c-88fb-244f5c05d634" />
<!-- TODO: Add a screenshot of your app to the repository and update the path above! -->

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
