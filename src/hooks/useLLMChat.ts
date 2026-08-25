import { useState, useCallback } from "react";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

export function useLLMChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content: "Hi! I'm the SurplusLink Assistant. How can I help you today?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // ==========================================
    // Replace the block below with your actual
    // LLM API integration (OpenAI, Gemini, etc.)
    // ==========================================
    try {
      // Simulated network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm a placeholder for your LLM. You said: "${text}". Connect your real API in useLLMChat.ts!`,
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Error sending message to LLM:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the server.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
  };
}
