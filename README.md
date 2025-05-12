# Avatar Server

This project is an **Express.js** server for managing and generating talking avatar videos. It provides endpoints for uploading training videos, checking processing status, and generating speech-driven avatar videos using Azure TTS and a Python backend for video processing.

## Features

- **Avatar Management**: Upload and list avatars, check their processing status.
- **Video Generation**: Generate talking avatar videos from text or SSML using Azure Text-to-Speech.
- **Integration**: Communicates with a Python backend for video preprocessing and inference.
- **MongoDB**: Stores avatar metadata and processing status.

## Requirements

- Node.js (v14+ recommended)
- MongoDB instance
- Python backend for video processing (see environment variables)
- Azure Speech Service subscription

## Installation

```bash
git clone <repo-url>
cd avatar-server
npm install
```

## Environment Variables

Copy `.env.sample` to `.env` and adjust env parameter


## Usage

Start the server:

```bash
npm start
```

## API Endpoints

### `GET /avatar/all`

Returns all avatars and their metadata.

### `GET /avatar/list-ready`

Returns a list of avatar IDs that are preprocessed and ready for use.

### `GET /avatar/video?avatar_id=...`

Downloads the generated video for the specified avatar.

### `POST /avatar/train`

Uploads a video to train a new avatar.

- **Body (multipart/form-data):**
  - `avatar_id` (string, required)
  - `video` (file, required)

### `GET /avatar/train-status?avatar_id=...`

Returns the processing status for a given avatar.

### `POST /avatar/speak`

Generates a talking avatar video from text or SSML.

- **Body (JSON):**
  - `avatar_id` (string, required)
  - `text` (string, required unless `ssml` is provided)
  - `ssml` (string, optional)
  - `language` (string, optional, default: `en-US`)
  - `voice` (string, optional, default: `en-US-JennyNeural`)
  - `speed` (string, optional, default: `1.0`)
  - `gender` (string, optional, default: `Female`)

Returns: `video/mp4` stream.

## Project Structure

- `app.js` - Main Express app
- `routes/avatar.js` - Avatar-related API endpoints
- `models/` - Mongoose models for avatars and processing status
- `utility/` - Utility functions (file upload, TTS, etc.)
- `videos/` - Stores generated videos
- `temp/` - Temporary files

## License

MIT