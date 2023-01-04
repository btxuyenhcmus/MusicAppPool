const express = require('express');
const { confirm_email, register, login, signout } = require('../Controllers/authenticate');
const router = express.Router();

router.post("/confirm", confirm_email);

router.post("/register", register);

router.post("/login", login);

router.post("/signout", signout);

module.exports = router;