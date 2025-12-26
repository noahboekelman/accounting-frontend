"use client";

import React, { useState } from "react";
import styles from "./WelcomeView.module.css";

interface WelcomeViewProps {
  onSendMessage: (message: string) => void;
  companyName?: string;
}

export default function WelcomeView({ onSendMessage, companyName }: WelcomeViewProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const suggestions = [
    "Review my recent invoices",
    "Summarize this month's expenses",
    "Check for duplicate transactions",
    "Generate financial report",
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {companyName || "AI Accounting"}
        </h1>
        
        <form onSubmit={handleSubmit} className={styles.inputWrapper}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className={styles.input}
            autoFocus
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={!input.trim()}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              className={styles.sendIcon}
            >
              <path 
                d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" 
                fill="currentColor"
              />
            </svg>
          </button>
        </form>

        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={styles.suggestionButton}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
