/**
 * AI Tutor Service
 * 
 * Provides AI-powered tutoring functionality using OpenAI's GPT models.
 * Handles chat responses, study plan generation, quiz creation, and concept explanations.
 * 
 * Features:
 * - Subject-specific tutoring prompts
 * - Grade-appropriate responses
 * - Study plan generation
 * - Quiz creation
 * - Concept explanations
 * - Lazy initialization to prevent startup crashes
 * 
 * @file aiTutorService.js
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

const OpenAI = require('openai');

// OpenAI client instance (lazy initialization to prevent startup crashes)
let openai = null;

/**
 * Get OpenAI client instance
 * Initializes the client only when needed and if API key is available
 * 
 * @returns {OpenAI|null} OpenAI client instance or null if not configured
 */
function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Subject-specific tutoring prompts and configurations
 * Each subject has tailored system prompts and token limits for optimal responses
 */
const SUBJECT_PROMPTS = {
  math: {
    system: "You are a helpful math tutor. Explain mathematical concepts clearly with step-by-step solutions. Use examples and encourage the student to think through problems.",
    maxTokens: 800
  },
  science: {
    system: "You are a knowledgeable science tutor. Explain scientific concepts in an engaging way with real-world examples. Encourage curiosity and critical thinking.",
    maxTokens: 800
  },
  english: {
    system: "You are an English language tutor. Help with grammar, writing, literature analysis, and vocabulary. Provide constructive feedback and encourage good writing practices.",
    maxTokens: 800
  },
  history: {
    system: "You are a history tutor. Make historical events engaging and help students understand cause-and-effect relationships. Encourage critical thinking about historical sources.",
    maxTokens: 800
  },
  general: {
    system: "You are a helpful academic tutor. Provide clear, educational responses appropriate for the student's grade level. Always encourage learning and critical thinking.",
    maxTokens: 600
  }
};

// Grade-appropriate response levels
const GRADE_LEVELS = {
  'Grade 1': 'elementary',
  'Grade 2': 'elementary', 
  'Grade 3': 'elementary',
  'Grade 4': 'elementary',
  'Grade 5': 'elementary',
  'Grade 6': 'middle',
  'Grade 7': 'middle',
  'Grade 8': 'middle',
  'Grade 9': 'high',
  'Grade 10': 'high',
  'Grade 11': 'high',
  'Grade 12': 'high'
};

class AITutorService {
  
  // Main chat function for student questions
  async getChatResponse(message, subject = 'general', userGrade = null, conversationHistory = []) {
    try {
      // Check if OpenAI is configured
      const client = getOpenAIClient();
      if (!client) {
        return {
          success: false,
          error: 'AI service is not configured. Please contact administrator.',
          type: 'not_configured'
        };
      }

      // Validate inputs
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      // Get subject-specific prompt
      const subjectConfig = SUBJECT_PROMPTS[subject.toLowerCase()] || SUBJECT_PROMPTS.general;
      
      // Adjust language complexity based on grade
      const gradeLevel = userGrade ? GRADE_LEVELS[userGrade] || 'general' : 'general';
      let systemPrompt = subjectConfig.system;
      
      if (gradeLevel === 'elementary') {
        systemPrompt += " Use simple language and basic examples appropriate for elementary school students.";
      } else if (gradeLevel === 'middle') {
        systemPrompt += " Use clear language with moderate complexity appropriate for middle school students.";
      } else if (gradeLevel === 'high') {
        systemPrompt += " Use appropriate academic language for high school students.";
      }

      // Add safety guidelines
      systemPrompt += " Always provide helpful, educational, and age-appropriate responses. Never provide inappropriate content or direct answers to test questions - instead guide the student to understand the concept.";

      // Build conversation messages
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // Call OpenAI API
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo', // You can change to 'gpt-4' for better quality
        messages: messages,
        max_tokens: subjectConfig.maxTokens,
        temperature: 0.7, // Balance between creativity and consistency
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0].message.content;
      
      return {
        success: true,
        response: response,
        subject: subject,
        tokensUsed: completion.usage.total_tokens,
        model: 'gpt-3.5-turbo'
      };

    } catch (error) {
      console.error('AI Tutor Error:', error);
      
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: 'AI service temporarily unavailable. Please try again later.',
          type: 'quota_exceeded'
        };
      }
      
      if (error.code === 'invalid_api_key') {
        return {
          success: false,
          error: 'AI service configuration error. Please contact support.',
          type: 'api_error'
        };
      }

      return {
        success: false,
        error: 'Unable to process your question right now. Please try again.',
        type: 'general_error'
      };
    }
  }

  // Generate study plan for a student
  async generateStudyPlan(grade, subjects, weakAreas = [], timeAvailable = '1 hour') {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          success: false,
          error: 'AI service is not configured. Please contact administrator.'
        };
      }

      const prompt = `Create a personalized study plan for a ${grade} student.
      
      Subjects to focus on: ${subjects.join(', ')}
      Areas needing improvement: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'General review'}
      Available study time per day: ${timeAvailable}
      
      Please provide:
      1. A weekly study schedule
      2. Specific topics to focus on each day
      3. Recommended study methods
      4. Goals for each subject
      
      Make it practical and achievable for a student of this grade level.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an educational consultant creating personalized study plans for students.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.6
      });

      return {
        success: true,
        studyPlan: completion.choices[0].message.content,
        tokensUsed: completion.usage.total_tokens
      };

    } catch (error) {
      console.error('Study Plan Generation Error:', error);
      return {
        success: false,
        error: 'Unable to generate study plan. Please try again later.'
      };
    }
  }

  // Generate practice questions for a topic
  async generateQuiz(subject, topic, grade, questionCount = 5) {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          success: false,
          error: 'AI service is not configured. Please contact administrator.'
        };
      }

      const gradeLevel = GRADE_LEVELS[grade] || 'general';
      
      const prompt = `Generate ${questionCount} practice questions for ${subject} on the topic of "${topic}" appropriate for ${grade} students.
      
      For each question, provide:
      1. The question
      2. Multiple choice options (A, B, C, D) if applicable, or leave space for written answers
      3. The correct answer
      4. A brief explanation of why this is correct
      
      Make sure questions are at appropriate difficulty level for ${gradeLevel} school students.
      Format as a clear, numbered list.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an experienced teacher creating educational quiz questions.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.8
      });

      return {
        success: true,
        quiz: completion.choices[0].message.content,
        subject: subject,
        topic: topic,
        grade: grade,
        tokensUsed: completion.usage.total_tokens
      };

    } catch (error) {
      console.error('Quiz Generation Error:', error);
      return {
        success: false,
        error: 'Unable to generate quiz questions. Please try again later.'
      };
    }
  }

  // Explain a concept in simple terms
  async explainConcept(concept, subject, grade) {
    try {
      const client = getOpenAIClient();
      if (!client) {
        return {
          success: false,
          error: 'AI service is not configured. Please contact administrator.'
        };
      }

      const gradeLevel = GRADE_LEVELS[grade] || 'general';
      
      const prompt = `Explain the concept of "${concept}" in ${subject} to a ${grade} student.
      
      Please:
      1. Start with a simple definition
      2. Use age-appropriate examples
      3. Break down complex parts step by step
      4. Include a real-world application if possible
      5. End with a simple summary
      
      Make it engaging and easy to understand for a ${gradeLevel} school student.`;

      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a patient and skilled tutor who excels at explaining complex concepts in simple terms.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      return {
        success: true,
        explanation: completion.choices[0].message.content,
        concept: concept,
        subject: subject,
        grade: grade,
        tokensUsed: completion.usage.total_tokens
      };

    } catch (error) {
      console.error('Concept Explanation Error:', error);
      return {
        success: false,
        error: 'Unable to explain concept. Please try again later.'
      };
    }
  }

  // Check if OpenAI API is configured
  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }

  // Get available subjects
  getAvailableSubjects() {
    return Object.keys(SUBJECT_PROMPTS);
  }
}

module.exports = new AITutorService();