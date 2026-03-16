import { CodeState } from "./types";

export const INITIAL_CODE: CodeState = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DIRTNAPP Project</title>
</head>
<body>
    <div class="container">
        <h1>Welcome to DIRTNAPP</h1>
        <p>Start building something amazing with AI assistance.</p>
        <button id="magic-btn">Click for Magic</button>
    </div>
</body>
</html>`,
  css: `body {
    font-family: 'Inter', sans-serif;
    background: #0f172a;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.container {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 1rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

button:hover {
    background: #2563eb;
    transform: translateY(-2px);
}`,
  js: `document.getElementById('magic-btn').addEventListener('click', () => {
    alert('Magic happened!');
    document.body.style.background = 'linear-gradient(45deg, #1e293b, #334155)';
});`,
  php: `<?php
/**
 * WordPress Theme/Plugin Template
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>`,
  react: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 text-center bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">React App</h1>
      <p className="text-slate-400 mb-8">Building with React in DIRTNAPP.</p>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <p className="text-2xl font-mono mb-4">{count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full font-bold transition-all active:scale-95"
        >
          Increment
        </button>
      </div>
    </div>
  );
}`,
  md: `# Welcome to DIRTNAPP

This is a markdown file. You can use it for documentation, notes, or README files.

## Features
- **Live Preview**: See your changes instantly.
- **AI Assistant**: Generate code with Gemini.
- **Multi-language**: HTML, CSS, JS, React, PHP, and Markdown.

Enjoy building!`
};
