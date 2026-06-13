const aiService = require('../services/ai.service');

exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message required' });
    const reply = await aiService.assistantChat(message, history);
    res.json({ success: true, data: { reply } });
  } catch (err) { next(err); }
};
