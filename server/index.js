const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('AutoWorth backend is running.');
});

app.post('/predict', (req, res) => {
  const inputFeatures = req.body;
  const pythonProcess = spawn('python3', [
    path.join(__dirname, '../model/infer.py')
  ]);

  let dataString = '';
  let errorString = '';

  pythonProcess.stdin.write(JSON.stringify(inputFeatures));
  pythonProcess.stdin.end();

  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0 || errorString) {
      return res.status(500).json({ error: errorString || 'Python process failed' });
    }
    try {
      const result = JSON.parse(dataString);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse prediction result' });
    }
  });
});

app.get('/random-sample', (req, res) => {
  const pythonProcess = spawn('python3', [
    path.join(__dirname, '../model/sample.py')
  ]);

  let dataString = '';
  let errorString = '';

  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0 || errorString) {
      return res.status(500).json({ error: errorString || 'Python process failed' });
    }
    try {
      const result = JSON.parse(dataString);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse random sample result' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
