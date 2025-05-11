var express = require('express');
var router = express.Router();
var axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
var AvatarModel = require('../models/avatar');
var ProcessingStatusModel = require('../models/processingStatus');
const { uploadFile } = require('../utility/web-utility');
const { formatAzureSsml, callAzureTTS } = require('../utility/general');

router.get('/all', async function (req, res, next) {
	const avatars = await AvatarModel.find();
	return res.json({ avatars });
});

router.get('/list-ready', async function (req, res, next) {
	const avatars = await AvatarModel.find({ preprocessed: true });
	// only return avatar_id
	const avatarIds = avatars.map((avatar) => avatar.avatar_id);
	return res.json({ avatarIds });
});

router.get('/video', async function (req, res, next) {
	const { avatar_id } = req.query;
	const videoPath = './videos/' + avatar_id + '.mp4';
	if (!fs.existsSync(videoPath)) {
		return res.status(404).json({ success: false, message: 'Video not found.' });
	}
	res.sendFile(path.resolve(videoPath));
});

router.post('/train', uploadFile, async function (req, res, next) {
	const { avatar_id } = req.body;

	if (!req.files || !req.files.video) {
		console.log('[DEBUG] No video file uploaded');
		return res.status(400).json({ success: false, message: 'Missing video file.' });
	}
	const file = req.files.video;
	console.log('[DEBUG] Received /train request', { avatar_id, file: file.name });

	try {
		const existing = await AvatarModel.findOne({ avatar_id });
		console.log('[DEBUG] Checked for existing avatar_id:', existing ? 'Found' : 'Not found');
		if (existing) {
			console.log('[DEBUG] Avatar ID already exists:', avatar_id);
			return res.status(409).json({ success: false, message: 'Avatar ID already exists.' });
		}
		// Forward to Python API
		const form = new FormData();
		if (avatar_id) {
			form.append('avatar_id', avatar_id);
		}
		form.append('video', fs.createReadStream(file.filepath));
		console.log('[DEBUG] Sending request to Python API');
		const pythonApiResponse = await axios.post(
			'http://' + process.env.LIP_SERVER_HOST + ':' + process.env.LIP_SERVER_PORT + '/preprocess',
			form,
			{
				headers: form.getHeaders(),
				timeout: 300000,
				responseType: 'arraybuffer',
			}
		);
		console.log('[DEBUG] Python API response', pythonApiResponse.data);

		// Ensure the videos directory exists
		const videosDir = path.join(__dirname, '../videos');
		if (!fs.existsSync(videosDir)) {
			fs.mkdirSync(videosDir, { recursive: true });
		}
		// delete the video file if it exists
		const videoPath = path.join(videosDir, pythonApiResponse.data.avatar_id + '.mp4');
		if (fs.existsSync(videoPath)) {
			fs.unlinkSync(videoPath);
		}
		fs.copyFileSync(file.filepath, videoPath);

		return res.json({ success: true, response: pythonApiResponse.data });
	} catch (err) {
		console.log('[DEBUG] Error in /train:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
});

router.get('/train-status', async function (req, res, next) {
	const { avatar_id } = req.query;
	if (!avatar_id) {
		return res.status(400).json({ success: false, message: 'Missing avatar_id.' });
	}
	const status = await ProcessingStatusModel.findOne({ avatar_id });
	return res.json(status);
});

router.post('/speak', async function (req, res, next) {
	const { avatar_id, text, language, voice, speed, gender, ssml } = req.body;
	if (!avatar_id || (!text && !ssml)) {
		return res.status(400).json({ success: false, message: 'Missing required parameters.' });
	}
	// Check if the avatar_id exists
	const avatar = await AvatarModel.findOne({ avatar_id });
	if (!avatar || !avatar.preprocessed) {
		return res.status(404).json({ success: false, message: 'Avatar not found.' });
	}

	try {
		// Use provided SSML or generate it
		const ssmlToUse =
			ssml ||
			formatAzureSsml(
				language || 'en-US',
				voice || 'en-US-JennyNeural',
				speed || '1.0',
				gender || 'Female',
				text
			);
		// Call Azure TTS
		const audioBuffer = await callAzureTTS(ssmlToUse, process.env.AZURE_SUBSCRIPTION_KEY);
		console.log('[DEBUG] Azure TTS audio buffer length', audioBuffer.length);

		// create temp folder if it doesn't exist
		const tempDir = path.join(__dirname, '../temp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
		// buffer to file with random name
		const audioPath =
			'./temp/audio_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15) + '.wav';

		// Pass the audio to the Python API (if needed, you can save/send the buffer as a file)
		// For now, just return the audio

		// Forward to Python API
		const form = new FormData();
		if (avatar_id) {
			form.append('avatar_id', avatar_id);
		}

		fs.writeFileSync(audioPath, audioBuffer);
		form.append('audio', fs.createReadStream(audioPath));
		console.log('[DEBUG] Sending request to Python API');
		const pythonApiResponse = await axios.post(
			'http://' + process.env.LIP_SERVER_HOST + ':' + process.env.LIP_SERVER_PORT + '/inference',
			form,
			{
				headers: form.getHeaders(),
				timeout: 300000,
				responseType: 'arraybuffer',
			}
		);
		// delete audio file
		fs.unlinkSync(audioPath);

		// get video and directlysteam to response
		const data = pythonApiResponse.data;
		// Save video to file with random name
		res.setHeader('Content-Type', 'video/mp4');
		res.send(data);
	} catch (err) {
		console.log('[DEBUG] Error in /speak:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
});

module.exports = router;
