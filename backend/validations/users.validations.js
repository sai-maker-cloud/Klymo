const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).trim().required(),
    bio: Joi.string().max(250).required(),
    gender: Joi.string().valid('Male', 'Female').required(),
    image: Joi.object({url: Joi.string().uri().required()}).required(),
    intrests: Joi.string().valid('Male', 'Female','Any').default('Any')
})

module.exports = {userSchema};