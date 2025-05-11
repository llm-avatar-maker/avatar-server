const mongoose = require('mongoose');

const ProcessingStatusSchema = new mongoose.Schema({
	avatar_id: { type: String, required: true, unique: true },
	status: { type: String, required: true },
	start_time: { type: Date },
	finish_time: { type: Date },
});

module.exports = mongoose.model('ProcessingStatus', ProcessingStatusSchema);
