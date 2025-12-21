'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { streamFaqChat, FaqChatChunk } from '@/lib/faqChatClient';
import styles from './PublicChat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FAQ_QUESTIONS = [
  "What makes your AI accounting software top-tier?",
  "How can AI help streamline my accounting workflow?",
  "What's included in your pricing plans?",
  "How do you ensure my financial data stays secure?",
];

export default function PublicChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showFAQs, setShowFAQs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<{ cancel: () => void } | null>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return;

    // Hide FAQs after first message
    setShowFAQs(false);

    // Add user message
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Prepare for assistant response
    let assistantContent = '';
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = await streamFaqChat(
        message,
        conversationId,
        (chunk: FaqChatChunk) => {
          assistantContent += chunk.content;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantContent
            };
            return newMessages;
          });

          // Store conversation ID if provided
          if (chunk.metadata?.conversation_id && !conversationId) {
            setConversationId(chunk.metadata.conversation_id);
          }
        },
        (error) => {
          console.error('Streaming error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: 'Sorry, I encountered an error. Please try again.'
            };
            return newMessages;
          });
        }
      );

      cancelRef.current = stream;
    } catch (error) {
      console.error('Failed to start stream:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I could not connect to the chat service. Please try again later.'
        };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
      cancelRef.current = null;
    }
  };

  const handleFAQClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className={styles.publicChatContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💼</span>
          <span className={styles.logoText}>Accounting</span>
        </div>
        <button 
          onClick={() => router.push('/login')}
          className={styles.signInButton}
        >
          Sign In
        </button>
      </header>

      <div className={styles.chatContent}>
        {messages.length === 0 && (
          <div className={styles.welcomeSection}>
            <h1 className={styles.welcomeTitle}>
              Hi! How can we help you today?
            </h1>
            <p className={styles.welcomeSubtitle}>
              Ask us anything about our accounting services
            </p>
          </div>
        )}

        {showFAQs && messages.length === 0 && (
          <div className={styles.faqSection}>
            <p className={styles.faqTitle}>Popular Questions</p>
            <div className={styles.faqGrid}>
              {FAQ_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleFAQClick(question)}
                  className={styles.faqButton}
                  disabled={isStreaming}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
            >
              {message.content}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className={styles.typingIndicator}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className={styles.inputContainer}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className={styles.input}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={styles.sendButton}
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
