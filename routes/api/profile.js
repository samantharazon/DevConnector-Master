const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
// For post, bring this in
const { check, validationResult } = require('express-validator');

// Bring in models
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// ==================================================================
// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
// ==================================================================

router.get('/me', auth, async (req, res) => {
  try {
    // Call Profile Model, its user field, and get the user by id (which is in the token)
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    // Check if no profile
    if (!profile) {
      return res.status(400).json({ mgs: 'There is no profile for this user' });
    }

    // If profile exists, send profile
    res.json(profile);

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================================
// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
// ==================================================================

router.post(
  '/',
  // Using express-validator
  [
    // Middleware
    auth,
    [
      // Check Status
      check('status', 'Status is required').not().isEmpty(),
      // Check Skills
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  // Using data (async)
  async (req, res) => {
    // Validate results
    const errors = validationResult(req);

    // Check above validation (If error, return response)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pulling stuff out from the req.body
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};

    // Get correct user (using Profile Model)
    profileFields.user = req.user.id;

    // --------------------------------
    // Add fields
    // ---------------------------------

    // Add each field to profile
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    // Turn skills into array using .split (turns a string into an array). Then take in a comma
    //    Use .map so spaces don't matter
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // --------------------------------
    // Add fields for Social, which is an object
    // --------------------------------

    // Build social object
    profileFields.social = {};

    // Checks
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    // update profile
    try {
      // Find by user (req.user.id comes from the token)
      //    Note: Since we are using async await, when we use mongoose method .findOne, it returns a promise, so put keyword await
      let profile = await Profile.findOne({ user: req.user.id });

      // --------------------------------
      // If profile is found...
      // --------------------------------
      if (profile) {
        // Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        // Return profile
        return res.json(profile);
      }

      // --------------------------------
      // If profile is not found...
      // --------------------------------

      // Create profile
      profile = new Profile(profileFields);

      // Save profile
      await profile.save();

      // Return Profile
      res.json(profile);

      // --------------------------------
      // Catch error
      // --------------------------------
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// ==================================================================
// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
// ==================================================================

router.get('/', async (req, res) => {
  try {
    // Get all profiles
    //    Add name and avatar using .populate
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);

    // Send profiles
    res.json(profiles);

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================================
// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
// ==================================================================

router.get('/user/:user_id', async ({ params: { user_id } }, res) => {
  try {
    // Get profile from user ID
    const profile = await Profile.findOne({
      user: user_id,
    }).populate('user', ['name', 'avatar']);

    // Check if profile does not exist for the user
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    // Send profile
    return res.json(profile);

    // Catch error-
  } catch (err) {
    console.error(err.message);
    // Check error kind
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
});

// ==================================================================
// @route    DELETE api/profile
// @desc     Delete profile, user, & posts
// @access   Private
// ==================================================================

router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove users posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    // Return a message
    res.json({ msg: 'User deleted' });

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================================
// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
// ==================================================================

router.put(
  '/experience',
  [
    auth,
    // Using validations
    [
      // Check title
      check('title', 'Title is required').not().notEmpty(),
      // Check company
      check('company', 'Company is required').not().notEmpty(),
      // Check from
      check('from', 'From date is required and needs to be from the past')
        .not()
        .notEmpty(),
    ],
  ],

  // In function body
  async (req, res) => {
    // Create errors variable
    const errors = validationResult(req);

    // Check for errors
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get body data; the data that is coming in
    const { title, company, location, from, to, current, description } =
      req.body;

    // Create experience object
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      // Fetch profile that we want to add experience to (using ID that we get from token)
      const profile = await Profile.findOne({ user: req.user.id });

      // Pushing experience to profile
      //    Pushing to beginning of array by using .unshift (as opposed to pushing)
      profile.experience.unshift(newExp);

      // Save profile
      await profile.save();

      // Return response
      res.json(profile);

      // Catch error
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// ==================================================================
// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private
// ==================================================================

router.delete('/experience/:exp_id', auth, async (req, res) => {
  // --------------------------------
  // Try
  // --------------------------------
  try {
    // Fetch profile by user ID
    const profile = await Profile.findOne({ user: req.user.id });

    // Find correct experience to remove
    //    Get remove index
    //    Find the item id and its index (0, 1, 2, etc)
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    // Remove experience
    profile.experience.splice(removeIndex, 1);

    // Save profile
    await profile.save();

    // Return profile
    res.json(profile);

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================================
// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
// ==================================================================

router.put(
  '/education',
  [
    auth,
    // Using validations
    [
      // Check school
      check('school', 'School is required').not().notEmpty(),
      // Check degree
      check('degree', 'Degree is required').not().notEmpty(),
      // Check field of study
      check('fieldofstudy', 'Field of study is required').not().notEmpty(),
      // Check from
      check('from', 'From date is required and needs to be from the past')
        .not()
        .notEmpty(),
    ],
  ],

  // In function body
  async (req, res) => {
    // Create errors variable
    const errors = validationResult(req);

    // Check for errors
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get body data; the data that is coming in
    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    // Create education object
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    // --------------------------------
    // Try
    // --------------------------------
    try {
      // Fetch profile that we want to add experience to (using ID that we get from token)
      const profile = await Profile.findOne({ user: req.user.id });

      // Pushing education to profile
      //    Pushing to beginning of array by using .unshift (as opposed to pushing)
      profile.education.unshift(newEdu);

      // Save profile
      await profile.save();

      // Return response
      res.json(profile);

      // --------------------------------
      // Catch error
      // --------------------------------
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// ==================================================================
// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private
// ==================================================================

router.delete('/education/:edu_id', auth, async (req, res) => {
  // --------------------------------
  // Try
  // --------------------------------
  try {
    // Fetch profile by user ID
    const profile = await Profile.findOne({ user: req.user.id });

    // Find correct education to remove
    //    Get remove index
    //    Find the item id and its index (0, 1, 2, etc)
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Remove education
    profile.education.splice(removeIndex, 1);

    // Save profile
    await profile.save();

    // Return profile
    res.json(profile);

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==================================================================
// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
// ==================================================================

router.get('/github/:username', (req, res) => {
  try {
    // Construct options object with uri
    const options = {
      // Plug uri into requests
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&
      sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,

      // Specify method of request
      method: 'GET',

      // Add to the headers
      headers: { 'user-agent': 'node-js' },
    };

    // Create request
    request(options, (error, response, body) => {
      // Check for error
      if (error) console.error(error);

      // Check for 200 response
      if (response.statusCode != 200) {
        // Send status 404 not found
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      // If Github profile found, send body that's going to contain it
      res.json(JSON.parse(body));
    });

    // Catch error
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Export
module.exports = router;
