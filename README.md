# 🎨 Design Process
This is the design process and also the prototype of this editor.

A modern, fun, and user-friendly web-based **Polyline Editor** for drawing, editing, and experimenting with polylines. Built with a vibrant pink theme, thoughtful interactions, and helpful creative prompts.

Live Demo: [https://v0-polyline-editor-theta.vercel.app/](https://v0-polyline-editor-theta.vercel.app/)

---

## ✨ Features
- Intuitive polyline drawing and editing tools
- Smooth real-time interaction on canvas
- Vibrant pink-themed modern UI with emojis for emotional engagement
- **Floating Ideas Window** – Get creative prompts and suggestions to spark your designs
- Responsive and accessible interface
- All core editing functions implemented (add points, move, delete, etc.)

This is a **work in progress** but fully functional for the required polyline operations.

---

## 🎯 Design Process

### 1. Research & Inspiration
The design journey began with exploring existing polyline editors on the web. I discovered the clean and minimal **[Polyline Editor Lab](https://polyline-editor-lab.vercel.app/)**, which served as the primary reference for core functionality and interaction patterns.

While the original tool was very functional and keyboard-driven, it felt quite technical and neutral. I wanted to create something more approachable, joyful, and beginner-friendly.

### 2. Theme & Emotional Design
Inspired by several playful pink-themed designs I saw online, I chose a **bright, energetic pink aesthetic** to make the interface feel lively and inviting. 

After Dr. Humera's lecture on design and emotion in HCI, I intentionally added **emojis** throughout the interface. This small touch helps convey personality, reduces cognitive load, and creates a more positive user experience — aligning with the idea of making interfaces feel more human and less mechanical.

### 3. Enhancing Learnability & User Support
To bridge the **"different languages"** described in Alan Dix's Interaction Framework (user goals ↔ input actions ↔ system processing ↔ output feedback), I added a **floating ideas window**. 

This panel provides gentle suggestions and creative prompts (e.g., "Try drawing a star", "Create a flowing wave", etc.). It helps users:
- Understand possible actions quickly (**predictability**)
- Get started without feeling stuck (**learnability** & **familiarity**)
- Feel supported throughout their creative process (**robustness**)

This directly supports Dix’s principles of **synthesizability** (clear feedback on what happened) and **generalizability** (users can apply ideas to new creations).

### 4. Implementation
I brought the visual design and interactions to life using **v0.app** (by Vercel), which allowed rapid prototyping from natural language descriptions and iterative refinements. 

The result is a clean, consistent interface that maintains **consistency** across similar actions and provides immediate visual feedback — reducing the **Gulf of Execution** and **Gulf of Evaluation**.

Key HCI principles applied from Dix et al.:
- **Learnability**: Predictability, familiarity, and consistency through clear icons, emojis, and the ideas panel
- **Flexibility**: Multiple ways to interact (canvas tools + suggestions)
- **Robustness**: Helpful prompts and visible system state
- **Visibility of system status** and **match between system and real world** (creative tool should feel like drawing on paper, not fighting with software)

### 5. Iteration & Future Work
This is an evolving project. Next steps include:
- Adding more advanced editing tools
- Export options (SVG, PNG)
- Undo/redo functionality
- Dark mode toggle
- Further accessibility improvements

---

## 🛠️ Tech Stack
- Built with modern web technologies
- UI generated & refined with v0.app
- Deployed on Vercel

---

## 📌 Why This Design?
I wanted to move beyond a purely functional tool and create an experience that feels **creative, encouraging, and fun**. By combining a solid reference, emotional design elements (pink + emojis), and thoughtful user support (floating ideas window), the editor now speaks a friendlier "language" to the user.

Feedback and contributions are always welcome! Feel free to open issues or pull requests.

---

Made with ❤️ and pink vibes  
*Inspired by HCI principles from Alan Dix et al. and Dr. Humera's lectures on emotional design.*

