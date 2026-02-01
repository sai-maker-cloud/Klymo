const Joi = require('joi');

const messageSchema = Joi.object({
    senderId: Joi.string().required().messages({'string.empty': 'Sender ID is required'}),
    roomId: Joi.string().required().messages({'string.empty': 'Room ID is required'}),
    text: Joi.string().min(1).max(500).required().trim(),
    type: Joi.string().default('text'),
})

module.exports = {messageSchema};