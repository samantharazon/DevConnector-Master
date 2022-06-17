const mongoose = require('mongoose');

// Create Profile schema
const ProfileSchema = new mongoose.Schema({
    
  // Reference to User model
  user: {
    // Connect to an id in the User model using mongoose
    type: mongoose.Schema.Types.ObjectId,
    // Reference to user model
    ref: 'user',
  },
  // Other fields
  company: {
    type: String,
  },
  website: {
    type: String,
  },
  location: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
  skills: {
    // Notice type is an array of strings
    type: [String],
    required: true,
  },
  bio: {
    type: String,
  },
  githubusername: {
    type: String,
  },
  // Experience is an array of other fields
  experience: [
    {
      title: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      location: {
        type: String,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        // Notice type is a boolean
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  // Education is an array of other fields
  education: [
    {
      school: {
        type: String,
        required: true,
      },
      degree: {
        type: String,
        required: true,
      },
      fieldofstudy: {
        type: String,
        required: true,
      },
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
      },
      current: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
      },
    },
  ],
  // Social is an object
  social: {
    youtube: {
      type: String,
    },
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    instagram: {
      type: String,
    },
  },
  // Date
  date: {
    type: Date,
    default: Date.now,
  },
});

// Export: set profile to new profile schema
module.exports = Profile = mongoose.model('profile', ProfileSchema);
