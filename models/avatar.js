const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
	avatar_id: { type: String, required: true, unique: true },
	created_at: { type: Date, default: Date.now },
	parameters: { type: mongoose.Schema.Types.Mixed }, // Flexible parameters
	processed_path: { type: String },
	preprocessed: { type: Boolean },
});

module.exports = mongoose.model('Avatar', AvatarSchema);
