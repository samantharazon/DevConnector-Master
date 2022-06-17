const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// ==================================================================
// @route    GET api/auth
// @desc     Test route
// @access   Public
// ==================================================================

// Getting protected data
router.get('/', auth, async (req, res) => {
	// Call to database using try catch
	try {
		// Find user by id
		const user = await User.findById(req.user.id).select('-password');
		// Send user data
		res.json(user);

		// catch error
	} catch (err) {
		// Return error
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
// ==================================================================

// Sending data
router.post(
	'/',
	[
		// Check email
		check('email', 'Please include a valid email').isEmail(),
		// Check password
		check('password', 'Password is required').exists(),
	],

	// Using data
	async (req, res) => {
		// Validating results
		const errors = validationResult(req);

		// Checking above validation
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// Pulling things from req.body
		const { email, password } = req.body;

		try {
			// Check if user exists by email
			let user = await User.findOne({ email });

			// Check if there is not a user
			if (!user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid Credentials' }] });
			}

			// Check password matches with bcrypt
			const isMatch = await bcrypt.compare(password, user.password);

			// Check if no match
			if (!isMatch) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid Credentials' }] });
			}

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
