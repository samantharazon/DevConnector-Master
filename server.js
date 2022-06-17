const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

app.get('/', (req, res) => res.send('API Running'));

// Init middleware
app.use(express.json({ extended: false }));

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// Initialize and listen for port
const PORT = process.env.PORT || 9000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
