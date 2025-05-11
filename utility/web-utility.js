const os = require('os');
const path = require('path');
const fs = require('fs');

const Busboy = require('busboy');

const responseCode = {
	101: 'Undefined',
	102: 'Login Time Out',
	103: 'Parameter Not Set',
	104: 'Failed',
	105: 'Parameter Invalid',
	106: 'Permission Denied',
	107: 'Reached Maximum',
	108: 'Api Not Exist',
	109: 'Username Or Password Incorrect',
	110: 'Current Password Incorrect',
	111: 'Record Already Exist',
	112: 'Record Not Found',
	113: 'Invalid Input',
	114: 'Invalid Upload Process',
	115: 'Wave File Not Found',
	116: 'Peak Json File Not Found',
	117: 'Invalid query from search filter',
	118: 'File Error Found',
	119: 'Exceed Duration Limit',
	120: 'Not Enough Time Limit',
	121: 'Error! Transcription cannot be updated',
	122: 'Account Disabled',
	136: 'Reached Maximum Concurrent User',
	137: 'Expired Concurrent License',
	200: 'Success',
};

function responsejson(code, in_message) {
	let message;
	if (in_message) {
		message = in_message;
	} else if (responseCode[code]) {
		message = responseCode[code];
	} else {
		message = 'Others';
	}
	return {
		responseCode: code,
		message: message,
	};
}

const uploadFile = (req, res, next) => {
	const busboy = Busboy({ headers: req.headers });
	const tmpdir = os.tmpdir();

	// This object will accumulate all the fields, keyed by their name
	const fields = {};

	// This object will accumulate all the uploaded files, keyed by their name.
	const files = {};

	// This code will process each non-file field in the form.
	busboy.on('field', (name, val) => {
		/**
		 *  TODO(developer): Process submitted field values here
		 */
		// console.log(`Field [${name}]: value: %j`, val);
		fields[name] = val;
	});

	const fileWrites = [];

	// This code will process each file uploaded.
	busboy.on('file', (fieldname, file, info) => {
		const { filename, encoding, mimeType } = info;
		// Note: os.tmpdir() points to an in-memory file system on GCF
		// Thus, any files in it must fit in the instance's memory.
		// console.log(`Processed file ${filename}`);
		const filepath = path.join(tmpdir, filename);

		files[fieldname] = {
			filename,
			filepath,
			encoding,
			mimeType,
		};

		const writeStream = fs.createWriteStream(filepath);
		file.pipe(writeStream);

		// File was processed by Busboy; wait for it to be written.
		// Note: GCF may not persist saved files across invocations.
		// Persistent files must be kept in other locations
		// (such as Cloud Storage buckets).
		const promise = new Promise((resolve, reject) => {
			file.on('end', () => {
				writeStream.end();
			});
			writeStream.on('finish', resolve);
			writeStream.on('error', reject);
		});
		fileWrites.push(promise);
	});

	// Triggered once all uploaded files are processed by Busboy.
	// We still need to wait for the disk writes (saves) to complete.
	busboy.on('finish', async () => {
		try {
			await Promise.all(fileWrites);

			req.files = files;
			req.body = fields;

			res.on('finish', function () {
				for (const file in files) {
					if (files[file].filepath) {
						fs.unlinkSync(files[file].filepath);
					}
				}
			});
			next();
		} catch (err) {
			return res.status(400).json(responsejson(118));
		}
	});
	req.pipe(busboy);
};

module.exports = {
	responsejson,
	uploadFile,
};
