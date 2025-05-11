const axios = require('axios');
axios.defaults.timeout = 300000; // 5 minutes

function formatAzureSsml(language, voice, speed, gender, text) {
	return (
		`<speak version='1.0' xml:lang='${language}'>` +
		`<voice xml:lang='${language}' xml:gender='${gender}' name='${voice}'>` +
		`<prosody rate='${speed}'>${text}</prosody></voice></speak>`
	);
}

async function callAzureTTS(ssml, subscriptionKey) {
	const url = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
	try {
		const response = await axios.post(url, ssml, {
			headers: {
				'Ocp-Apim-Subscription-Key': subscriptionKey,
				'Content-Type': 'application/ssml+xml',
				'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm',
				'User-Agent': 'Avatar-Video-Maker',
			},
			responseType: 'arraybuffer',
			// Explicit timeout for Azure TTS
			timeout: 300000,
		});
		return response.data;
	} catch (err) {
		throw new Error('Azure TTS error: ' + (err.response?.data || err.message));
	}
}

module.exports = {
	formatAzureSsml,
	callAzureTTS,
};
