const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
// For post, bring this in
const { check, validationResult } = require('express-validator');

// Bring in model
const User = require('../../models/User');

// ==================================================================
// @route    POST api/users
// @desc     Register user
// @access   Public
// ==================================================================

// Sending data
router.post(
  '/',
  // Using express-validator
  [
    // Check name
    check('name', 'Name is required').not().isEmpty(),
    // Check email
    check('email', 'Please include a valid email').isEmail(),
    // Check password
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({
      min: 6,
    }),
  ],
  // Using data (async)
  async (req, res) => {
    // Validate results
    const errors = validationResult(req);

    // Check above validation (If error, return response)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pulling things from req.body
    const { name, email, password } = req.body;

    try {
      // Check if user exists by email
      let user = await User.findOne({ email });

      // If user already exists, return error
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        // default size
        s: '200',
        // rating
        r: 'pg',
        // default
        d: 'mm',
      });

      // Create user using variable user
      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encrypt the password using bcrypt
      const salt = await bcrypt.genSalt(10);

      // Create hash and put in password
      user.password = await bcrypt.hash(password, salt);

      // Save user in database
      await user.save();

      // Create payload
      const payload = {
        // User object
        user: {
          id: user.id,
        },
      };

      // Sign token
      jwt.sign(
        // Pass in payload
        payload,
        // Get secret from config file
        config.get('jwtSecret'),
        // Set time to expire (3600 for hour)
        { expiresIn: 360000 },
        // Callback function
        (err, token) => {
          // If error, throw error
          if (err) throw err;
          // If token, send back token
          res.json({ token });
        }
      );

      // Catch error
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Export
module.exports = router;
