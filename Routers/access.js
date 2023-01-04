const express = require('express');
const { refresh_token, get_presigned_url } = require('../Controllers/authorization');
const router = express.Router();

router.post("/refreshtoken", refresh_token);

router.get("/getpresignedurl", get_presigned_url);

module.exports = router