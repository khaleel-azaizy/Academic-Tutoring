import React, { useState, useEffect } from 'react';
import { GraduationCap, UserCheck, X, ArrowLeft, Plus, Search } from 'lucide-react';

const MessagesSidebar = ({ isOpen, onClose, user, roleAPI }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ message: '' });
  const [loading, setLoading] = useState(false);
  
  // New conversation state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherSearchResults, setTeacherSearchResults] = useState([]);
  const [searchingTeachers, setSearchingTeachers] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({ 
    teacherEmail: '', 
    message: '' 
  });

  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      let data;
      if (user.role === 'Teacher') {
        data = await roleAPI.getTeacherConversations();
        setConversations(data.conversations || []);
      } else if (user.role === 'Student') {
        data = await roleAPI.getStudentConversations();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      let data;
      if (user.role === 'Teacher') {
        data = await roleAPI.getTeacherConversation({ studentId: conversation.studentId });
        setMessages(data.messages || []);
      } else if (user.role === 'Student') {
        data = await roleAPI.getStudentConversation({ 
          teacherEmail: conversation.teacherEmail, 
          teacherId: conversation.teacherId 
        });
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageForm.message.trim() || !selectedConversation) return;

    try {
      if (user.role === 'Teacher') {
        await roleAPI.teacherReply({ 
          studentId: selectedConversation.studentId, 
          message: messageForm.message 
        });
      } else if (user.role === 'Student') {
        await roleAPI.contactTeacher({ 
          teacherEmail: selectedConversation.teacherEmail,
          teacherId: selectedConversation.teacherId,
          message: messageForm.message 
        });
      }
      
      setMessageForm({ message: '' });
      // Reload the conversation
      await loadConversation(selectedConversation);
      // Refresh conversations list
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConversationTitle = (conversation) => {
    if (user.role === 'Teacher') {
      return `${conversation.student?.firstName} ${conversation.student?.lastName}`;
    } else {
      return `${conversation.teacher?.firstName} ${conversation.teacher?.lastName}`;
    }
  };

  const getConversationSubtitle = (conversation) => {
    if (user.role === 'Teacher') {
      return conversation.student?.email;
    } else {
      return conversation.teacher?.email;
    }
  };

  // Search for teachers
  const searchTeachers = async () => {
    if (!teacherSearchQuery.trim()) return;
    
    try {
      setSearchingTeachers(true);
      const data = await roleAPI.searchTeachers(teacherSearchQuery);
      setTeacherSearchResults(data.teachers || []);
    } catch (error) {
      console.error('Failed to search teachers:', error);
      setTeacherSearchResults([]);
    } finally {
      setSearchingTeachers(false);
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    if (!newConversationForm.teacherEmail || !newConversationForm.message.trim()) return;

    try {
      await roleAPI.contactTeacher({
        teacherEmail: newConversationForm.teacherEmail,
        message: newConversationForm.message
      });
      
      // Reset form and close new conversation view
      setNewConversationForm({ teacherEmail: '', message: '' });
      setShowNewConversation(false);
      setTeacherSearchQuery('');
      setTeacherSearchResults([]);
      
      // Reload conversations to show the new one
      await loadConversations();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Select teacher from search results
  const selectTeacher = (teacher) => {
    setNewConversationForm({
      ...newConversationForm,
      teacherEmail: teacher.email
    });
    setTeacherSearchQuery(`${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    setTeacherSearchResults([]);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar */}
      <div className={`messages-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Messages</h3>
          <div className="header-actions">
            {user.role === 'Student' && !selectedConversation && !showNewConversation && (
              <button 
                className="new-conversation-btn" 
                onClick={() => setShowNewConversation(true)}
                title="Start new conversation"
              >
                <Plus size={18} />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          {!selectedConversation && !showNewConversation ? (
            // Conversations List
            <div className="conversations-list">
              {loading ? (
                <div className="loading">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="no-conversations">
                  <p>No conversations yet</p>
                  {user.role === 'Student' && (
                    <button 
                      className="start-conversation-btn"
                      onClick={() => setShowNewConversation(true)}
                    >
                      <Plus size={16} /> Start a conversation
                    </button>
                  )}
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.studentId || conversation.teacherId}
                    className="conversation-item"
                    onClick={() => loadConversation(conversation)}
                  >
                    <div className="conversation-avatar">
                      {user.role === 'Teacher' ? <GraduationCap size={20} /> : <UserCheck size={20} />}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        {getConversationTitle(conversation)}
                      </div>
                      <div className="conversation-email">
                        {getConversationSubtitle(conversation)}
                      </div>
                      <div className="conversation-preview">
                        {conversation.lastMessage}
                      </div>
                    </div>
                    <div className="conversation-meta">
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                      <span className="last-time">
                        {new Date(conversation.lastAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : showNewConversation ? (
            // New Conversation View
            <div className="new-conversation-view">
              <div className="new-conversation-header">
                <button className="back-btn" onClick={() => setShowNewConversation(false)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <h4>Start New Conversation</h4>
              </div>
              
              <div className="new-conversation-content">
                <div className="form-group">
                  <label>Search for Teacher</label>
                  <div className="search-teacher-input">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                      className="form-input"
                    />
                    <button 
                      className="search-btn" 
                      onClick={searchTeachers}
                      disabled={!teacherSearchQuery.trim() || searchingTeachers}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  
                  {teacherSearchResults.length > 0 && (
                    <div className="teacher-search-results">
                      {teacherSearchResults.map((teacher) => (
                        <div
                          key={teacher._id}
                          className="teacher-result-item"
                          onClick={() => selectTeacher(teacher)}
                        >
                          <div className="teacher-avatar">
                            <UserCheck size={20} />
                          </div>
                          <div className="teacher-info">
                            <div className="teacher-name">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="teacher-email">{teacher.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    placeholder="Type your message to start the conversation..."
                    value={newConversationForm.message}
                    onChange={(e) => setNewConversationForm({ ...newConversationForm, message: e.target.value })}
                    className="form-input"
                    rows={4}
                  />
                </div>
                
                <button
                  className="start-conversation-btn"
                  onClick={startNewConversation}
                  disabled={!newConversationForm.teacherEmail || !newConversationForm.message.trim()}
                >
                  Start Conversation
                </button>
              </div>
            </div>
          ) : (
            // Chat View
            <div className="chat-view">
              <div className="chat-header">
                <button className="back-btn" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <div className="chat-title">
                  <div className="chat-name">{getConversationTitle(selectedConversation)}</div>
                  <div className="chat-email">{getConversationSubtitle(selectedConversation)}</div>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">No messages yet</div>
                ) : (
                  messages.map((message) => {
                    const isMe = (user.role === 'Teacher' && message.fromTeacherId) || 
                                (user.role === 'Student' && message.fromStudentId);
                    return (
                      <div key={message._id} className={`message ${isMe ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          {message.message}
                        </div>
                        <div className="message-time">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  onKeyPress={handleKeyPress}
                  className="message-field"
                />
                <button onClick={sendMessage} className="send-btn" disabled={!messageForm.message.trim()}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessagesSidebar;
