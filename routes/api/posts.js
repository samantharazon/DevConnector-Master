const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

// bring in models
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// ==================================================================
// @route    POST api/posts
// @desc     Create a post
// @access   Private
// ==================================================================

router.post(
	'/',
	[
		// express validator
		auth,
		[check('text', 'Text is required').not().isEmpty()],
	],
	async (req, res) => {
		// check for errors
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			// get the user.
			//    How? enter token --> sends user ID -->  place in req.user.id
			//    dont send the password
			const user = await User.findById(req.user.id).select('-password');

			// create a new post
			const newPost = new Post({
				// using the text that comes from the body
				text: req.body.text,
				// rest comes from user
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			});

			// create post
			const post = await newPost.save();

			// send post
			res.json(post);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// ==================================================================
// @route    GET api/posts
// @desc     Get all posts
// @access   Private
// ==================================================================

// add auth since its private
router.get('/', auth, async (req, res) => {
	try {
		// finding all posts and sorting by most recent
		const posts = await Post.find().sort({ date: -1 });
		// return posts
		res.json(posts);

		// catch error
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    GET api/posts/:id
// @desc     Get post by id
// @access   Private
// ==================================================================

// add auth since its private
router.get('/:id', auth, async (req, res) => {
	try {
		// finding post by id. "req.params.id" allows us to get id from url
		const post = await Post.findById(req.params.id);

		// check if there is a post with that id
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		// return post
		res.json(post);

		// catch error
	} catch (err) {
		console.error(err.message);

		// check if a valid object id was passed in. if its equal to ObjectId, it's not a formatted ObjectId.
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
// ==================================================================

// add auth since its private
router.delete('/:id', auth, async (req, res) => {
	try {
		// finding post by id. "req.params.id" allows us to get id from url
		const post = await Post.findById(req.params.id);

		// handle if post doesn't exist
		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		}

		// check user
		//    make sure user deleting post is owner of post
		//    NOTE: req.user.id is a string. post.user is an object. SO add toString
		//    If user is not equal to user id, return error
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		// delete post
		await post.remove();

		// return message
		res.json({ msg: 'Post removed' });

		// catch error
	} catch (err) {
		console.error(err.message);

		// check if a valid object id was passed in. if its equal to ObjectId, it's not a formatted ObjectId.
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}

		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
// ==================================================================

router.put('/like/:id', auth, async (req, res) => {
	try {
		// fetch the post by id
		const post = await Post.findById(req.params.id);

		// check if the post has already been liked by this user
		//    compare current iteration (current user) to user logged in
		//    turn into string to match user id that's in request.userid
		//    req.user.id is the logged in user
		//    if length is greater than 0, post has already been liked
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length > 0
		) {
			return res.status(400).json({ msg: 'Post already liked' });
		}

		// add like
		//    if user hasn't already liked it, take that post and likes and add on to it
		//    unshift puts like at the beginning
		//    we add the like from "user: req.user.id"
		post.likes.unshift({ user: req.user.id });

		// save like back to the database
		await post.save();

		// respond with the likes of the post
		res.json(post.likes);

		// catch error
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    PUT api/posts/unlike/:id
// @desc     Remove like from a post
// @access   Private
// ==================================================================

router.put('/unlike/:id', auth, async (req, res) => {
	try {
		// fetch the post by id
		const post = await Post.findById(req.params.id);

		// check if the post has already been liked by this user
		//    why? we can't remove like on post that hasn't been liked
		//    compare current iteration (current user) to user logged in
		//    turn into string to match user id that's in request.userid
		//    req.user.id is the logged in user
		//    if length is equal to 0, we haven't liked the post yet
		if (
			post.likes.filter((like) => like.user.toString() === req.user.id)
				.length === 0
		) {
			return res.status(400).json({ msg: 'Post has not yet been liked' });
		}

		// get like to be removed
		//    get remove index
		//    for each like, return like.user and make it a string
		const removeIndex = post.likes
			.map((like) => like.user.toString())
			.indexOf(req.user.id);

		// splice like out of array
		//    take in that removeIndex, and just remove one
		post.likes.splice(removeIndex, 1);

		// save like back to the database
		await post.save();

		// respond with the likes of the post
		res.json(post.likes);

		// catch error
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// ==================================================================
// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
// ==================================================================

router.post(
	'/comment/:id',
	[
		// express validator
		auth,
		[check('text', 'Text is required').not().isEmpty()],
	],
	async (req, res) => {
		// check for errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			// get the user.
			//    How? enter token --> sends user ID -->  place in req.user.id
			//    dont send the password
			const user = await User.findById(req.user.id).select('-password');

			// get the post by id
			const post = await Post.findById(req.params.id);

			// create a new post
			const newComment = {
				// using the text that comes from the body
				text: req.body.text,
				// rest comes from user
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			// add comment to post comments
			//      unshift to add to beginning
			post.comments.unshift(newComment);

			// save comment
			await post.save();

			// send back all the comments
			res.json(post.comments);

			// catch error
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// ==================================================================
// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment on a post
// @access   Private
// ==================================================================

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
	try {
		// get the post by id
		const post = await Post.findById(req.params.id);

		// pull out comment from the post
		//    for each comment, test if the comment id is equal to the requested comment id
		//    this will give us the comment if it exists or false
		const comment = post.comments.find(
			(comment) => comment.id === req.params.comment_id
		);

		// make sure comment exists
		//    if comment does not exist, return error
		if (!comment) {
			return res.status(404).json({ msg: 'Comment does not exist' });
		}

		// check user is owner of comment (before deleting it)
		//    if comment's user is not equal to logged in user, return error
		if (comment.user.toString() != req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}

		// if everything is ok, move along...

		// get comment to be removed
		//    get remove index
		//    for each comment, return comment.user and make it a string
		const removeIndex = post.comments
			.map((comment) => comment.user.toString())
			.indexOf(req.user.id);

		// splice comment out of array
		//    take in that removeIndex, and just remove one
		post.comments.splice(removeIndex, 1);

		// save comment back to the database
		await post.save();

		// respond with the comments of the post
		res.json(post.comments);

		// catch error
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// Export
module.exports = router;
