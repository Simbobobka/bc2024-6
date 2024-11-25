const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
// Завантаження swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Налаштування Swagger UI


const program = new Command();
const getNotePath = (noteName) => path.join(cache, `${noteName}.txt`);

program
  .requiredOption('-h, --host <type>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера', parseInt)
  .requiredOption('-c, --cache <path>', 'шлях до директорії для кешу');

program.parse(process.argv);

const options = program.opts();

const app = express();
const { host, port, cache } = options;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

console.log('Swagger документація доступна за адресою: http://localhost:3000/docs');

app.use(bodyParser.json());
const upload = multer();

// допоміжні функції для операцій з файлами
const readNote = (noteName) => {
  const notePath = getNotePath(noteName);
  if (!fs.existsSync(notePath)) return null;
  return fs.readFileSync(notePath, 'utf8');
};

const writeNote = (noteName, text) => {
  const notePath = getNotePath(noteName);
  fs.writeFileSync(notePath, text, 'utf8');
};

const deleteNote = (noteName) => {
  const notePath = getNotePath(noteName);
  if (fs.existsSync(notePath)) fs.unlinkSync(notePath);
};


app.get('/notes/:noteName', (req, res) => {
    const noteContent = readNote(req.params.noteName);
    if (!noteContent) return res.status(404).send('Not found');
    res.send(noteContent);
});

// Add a middleware to parse plain text
app.use(bodyParser.text({ type: 'text/plain' }));

app.put('/notes/:note_name', (req, res) => {
    const noteName = req.params.note_name;
    const noteContent = req.body; // Plain text content

    if (!readNote(noteName)) {
        return res.status(404).send('Note not found');
    }

    writeNote(noteName, noteContent); // Save plain text content
    res.status(200).send('Note updated');
});

app.delete('/notes/:noteName', (req, res) => {
    const { noteName } = req.params;
    if (!readNote(noteName)) return res.status(404).send('Not found');
    deleteNote(noteName);
    res.sendStatus(200);
});

app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(cache)
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const name = file.slice(0, -4);
        const text = readNote(name);
        return { name, text };
      });
    res.status(200).json(notes);
  });

app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;
    if (readNote(note_name)) return res.status(400).send('Note already exists');
    writeNote(note_name, note);
    res.status(201).send('Created');
});

app.get('/UploadForm.html', (req, res) => {
  const filePath = path.join(__dirname, 'UploadForm.html');
  res.sendFile(filePath);
});

app.listen(port, host, () => {
    console.log(`Сервер запущено на http://${host}:${port}`);
    console.log(`Кеш директорія: ${cache}`);
});

//npm start -- --host 127.0.0.1 --port 8080 --cache ./cache
