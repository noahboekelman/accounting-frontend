"use client";

import React from "react";
import Chat from "@components/Chat";
import WelcomeView from "@components/WelcomeView";
import styles from "./ChatArea.module.css";

interface ChatAreaProps {
  hasActiveChat: boolean;
  onSendMessage: (message: string) => void;
  companyName?: string;
}

export default function ChatArea({ hasActiveChat, onSendMessage, companyName }: ChatAreaProps) {
  if (!hasActiveChat) {
    return (
      <div className={styles.container}>
        <WelcomeView onSendMessage={onSendMessage} companyName={companyName} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Chat />
    </div>
  );
}
