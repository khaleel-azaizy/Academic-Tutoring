/**
 * AI Chat Component
 * 
 * Interactive AI tutoring interface that provides personalized educational assistance.
 * Integrates with OpenAI to offer subject-specific tutoring, study plans, and quizzes.
 * 
 * Features:
 * - Real-time AI chat interface
 * - Subject-specific tutoring (Math, Science, English, History)
 * - Quick action buttons for common requests
 * - Study plan generation
 * - Quiz creation
 * - Concept explanations
 * - Auto-scroll and focus management
 * - Message history and timestamps
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user data for personalization
 * @returns {JSX.Element} AI chat interface component
 */

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/AIChat.css';

const AIChat = ({ user }) => {
  // Chat state management
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: `Hello ${user.firstName}! I'm your AI tutor assistant. I can help you with homework, explain concepts, generate study plans, and create practice quizzes. What would you like to learn about today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState(''); // Current input message
  const [selectedSubject, setSelectedSubject] = useState('general'); // Selected subject for tutoring
  const [isLoading, setIsLoading] = useState(false); // Loading state for AI responses
  const [availableSubjects, setAvailableSubjects] = useState(['general']); // Available subjects
  const [showQuickActions, setShowQuickActions] = useState(true); // Show/hide quick action buttons
  
  // Refs for DOM manipulation
  const messagesEndRef = useRef(null); // Reference to scroll to bottom
  const inputRef = useRef(null); // Reference to input field for focus

  // Available subjects
  const subjectOptions = [
    { value: 'general', label: 'General' },
    { value: 'math', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' }
  ];

  // Quick action buttons
  const quickActions = [
    { label: 'Explain a concept', action: 'explain' },
    { label: 'Generate quiz', action: 'quiz' },
    { label: 'Create study plan', action: 'study-plan' },
    { label: 'Help with homework', action: 'homework' }
  ];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('http://localhost:4000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          subject: selectedSubject,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          tokensUsed: data.tokensUsed
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }

    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please make sure the AI service is configured and try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    const prompts = {
      'explain': 'Can you explain a concept in ' + subjectOptions.find(s => s.value === selectedSubject)?.label + '?',
      'quiz': 'Can you generate a practice quiz for ' + subjectOptions.find(s => s.value === selectedSubject)?.label + '?',
      'study-plan': 'Can you help me create a study plan?',
      'homework': 'I need help with my homework in ' + subjectOptions.find(s => s.value === selectedSubject)?.label
    };

    sendMessage(prompts[action]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <h2>AI Tutor Assistant</h2>
          <div className="subject-selector">
            <label>Subject:</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="subject-select"
            >
              {subjectOptions.map(subject => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="header-right">
          {user.grade && (
            <div className="user-info">
              <span>Grade: {user.grade}</span>
            </div>
          )}
          <button 
            className="toggle-options-btn"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            {showQuickActions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {showQuickActions && (
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.action)}
              disabled={isLoading}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              <div className="message-text">
                {message.content.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div className="message-meta">
                <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                {message.tokensUsed && (
                  <span className="tokens">Tokens: {message.tokensUsed}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="message-content">
              <div className="loading-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            className="message-input"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default AIChat;