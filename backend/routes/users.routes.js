const express = require('express');
const UserRouter = express.Router();
const {userSchema} = require("../validations/users.validations");
const {validate} = require("../middlewares/validate.middleware");

UserRouter.post('/register',validate(userSchema));

module.exports = {UserRouter};