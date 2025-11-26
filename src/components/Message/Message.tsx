"use client";

import React from "react";
import styles from "./Message.module.css";

type ChatMessage = {
  id: string;
  author: "user" | "agent";
  text: string;
  timestamp: string;
};

export default function Message({ message }: { message: ChatMessage }) {
  const isUser = message.author === "user";
  return (
    <div className={`${styles.row} ${isUser ? styles.user : styles.agent}`}>
      <div className={styles.bubble}>
        <div className={styles.text}>{message.text}</div>
        <div className={styles.ts}>{new Date(message.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
