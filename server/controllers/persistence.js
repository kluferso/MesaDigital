const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Criar diretório de dados se não existir
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const SETLISTS_FILE = path.join(DATA_DIR, 'setlists.json');

// Função auxiliar para ler JSON
const readJson = (file) => {
    if (!fs.existsSync(file)) {
        return [];
    }
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erro ao ler ${file}:`, error);
        return [];
    }
};

// Função auxiliar para salvar JSON
const writeJson = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Erro ao escrever ${file}:`, error);
        return false;
    }
};

module.exports = {
    // Eventos (Agenda)
    getEvents: (req, res) => {
        const events = readJson(EVENTS_FILE);
        res.json(events);
    },

    createEvent: (req, res) => {
        const events = readJson(EVENTS_FILE);
        const newEvent = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        writeJson(EVENTS_FILE, events);
        res.json(newEvent);
    },

    deleteEvent: (req, res) => {
        const { id } = req.params;
        let events = readJson(EVENTS_FILE);
        events = events.filter(e => e.id !== id);
        writeJson(EVENTS_FILE, events);
        res.json({ success: true });
    },

    // Setlists
    getSetlists: (req, res) => {
        const setlists = readJson(SETLISTS_FILE);
        res.json(setlists);
    },

    saveSetlist: (req, res) => {
        const setlists = readJson(SETLISTS_FILE);
        const newSetlist = {
            id: req.body.id || Date.now().toString(),
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        const index = setlists.findIndex(s => s.id === newSetlist.id);
        if (index >= 0) {
            setlists[index] = newSetlist;
        } else {
            setlists.push(newSetlist);
        }

        writeJson(SETLISTS_FILE, setlists);
        res.json(newSetlist);
    },

    deleteSetlist: (req, res) => {
        const { id } = req.params;
        let setlists = readJson(SETLISTS_FILE);
        setlists = setlists.filter(s => s.id !== id);
        writeJson(SETLISTS_FILE, setlists);
        res.json({ success: true });
    }
};
