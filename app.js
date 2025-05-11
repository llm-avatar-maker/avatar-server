var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');
const timeout = require('connect-timeout');

var avatarRouter = require('./routes/avatar');

var app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => {
	console.error('MongoDB connection error:', err);
});
mongoose.connection.once('open', () => {
	console.log('Connected to MongoDB');
});

app.use(timeout('300s'));
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/avatar', avatarRouter);

// catch 404 and forward to error handler
app.use(function (req, res) {
	res.status(404).send('Not Found');
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send('Error');
});

module.exports = app;
