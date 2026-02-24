const express = require('express');
const router = express.Router();
const { sendNewChatNotification, sendNewQuestionNotification, sendChatSummaryEmail } = require('../services/emailService');
const { addCustomerQuestion, updateQuestionReadStatus, deleteCustomerQuestion } = require('../services/googleSheets');
const Question = require('../models/Question');
const Chat = require('../models/Chat');

// ==================== CHAT API ====================

// POST /api/notifications/chat - create new chat request from customer
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, customerName } = req.body;
    
    // Check if chat already exists
    let chat = await Chat.findOne({ sessionId });
    if (chat) {
      return res.json({ success: true, chat });
    }
    
    // Create new chat
    chat = await Chat.create({
      sessionId,
      customerName: customerName || '고객',
      status: 'pending',
      messages: []
    });
    
    // Send email notification
    sendNewChatNotification({ sessionId, customerName }).catch(() => {});
    
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/notifications/chats - get all chats (for employee dashboard)
router.get('/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ lastUpdate: -1 });
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/notifications/chat/:sessionId - get single chat by sessionId
router.get('/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      return res.json({ success: true, chat: null });
    }
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/chat/:sessionId/accept - employee accepts chat
router.patch('/chat/:sessionId/accept', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { employeeName } = req.body;
    
    const chat = await Chat.findOneAndUpdate(
      { sessionId },
      { 
        status: 'active', 
        acceptedBy: employeeName,
        acceptedAt: new Date()
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error accepting chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/chat/:sessionId/end - end chat
router.patch('/chat/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endedBy } = req.body;
    
    const chat = await Chat.findOneAndUpdate(
      { sessionId },
      { 
        status: 'ended',
        endedBy: endedBy || '',
        endedAt: new Date()
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    // Send chat summary email
    sendChatSummaryEmail({
      customerName: chat.customerName,
      messages: chat.messages,
      acceptedAt: chat.acceptedAt,
      endedAt: chat.endedAt,
      endedBy: chat.endedBy
    }).catch(() => {});
    
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error ending chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/chat/:sessionId/message - send message
router.post('/chat/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, sender, employeeName } = req.body;
    
    const message = {
      text,
      sender,
      employeeName: employeeName || '',
      read: false,
      timestamp: new Date()
    };
    
    const chat = await Chat.findOneAndUpdate(
      { sessionId },
      { 
        $push: { messages: message },
        lastUpdate: new Date()
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    res.json({ success: true, chat, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/chat/:sessionId/read - mark messages as read
router.patch('/chat/:sessionId/read', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sender } = req.body; // Mark messages from this sender as read
    
    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    // Mark all messages from the specified sender as read
    chat.messages.forEach(msg => {
      if (msg.sender === sender) {
        msg.read = true;
      }
    });
    
    await chat.save();
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notifications/chat/:sessionId - delete chat (cancel pending request)
router.delete('/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await Chat.findOneAndDelete({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== END CHAT API ====================

// POST /api/notifications/question - new question from customer
router.post('/question', async (req, res) => {
  try {
    const { phone, question, ipAddress } = req.body;
    
    // 1. Save to MongoDB
    const savedQuestion = await Question.create({
      phone,
      question,
      ipAddress: ipAddress || '',
      read: false
    });
    
    // 2. Save to Google Sheets (with MongoDB ID for reference)
    addCustomerQuestion({
      phone,
      question,
      ipAddress,
      mongoId: savedQuestion._id.toString()
    }).catch(err => console.error('Google Sheets error:', err));
    
    // 3. Send email notification
    sendNewQuestionNotification({ phone, question }).catch(() => {});
    
    res.json({ success: true, question: savedQuestion });
  } catch (error) {
    console.error('Error saving question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/notifications/questions - get all questions (for employee dashboard)
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/questions/:id/read - mark question as read/unread
router.patch('/questions/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;
    
    // Update in MongoDB
    const question = await Question.findByIdAndUpdate(id, { read }, { new: true });
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    
    // Update in Google Sheets
    updateQuestionReadStatus(id, read).catch(err => console.error('Google Sheets error:', err));
    
    res.json({ success: true, question });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notifications/questions/:id - delete a question
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete from MongoDB
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    
    // Delete from Google Sheets
    deleteCustomerQuestion(id).catch(err => console.error('Google Sheets error:', err));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/notifications/chat-summary - send chat summary when ended
router.post('/chat-summary', async (req, res) => {
  const { customerName, messages, acceptedAt, endedAt, endedBy } = req.body;
  sendChatSummaryEmail({ customerName, messages, acceptedAt, endedAt, endedBy }).catch(() => {});
  res.json({ success: true });
});

module.exports = router;
