const express = require('express');
const router = express.Router();
const {ChatRouter} = require("./chats.routes");
const {UserRouter} = require("./users.routes");

router.use('/users',UserRouter);
router.use('/chats',ChatRouter);

module.exports = {router};