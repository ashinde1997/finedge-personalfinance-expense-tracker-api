// helper functions to read and write JSON files
// using fs/promises so everything is async

const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// read a json file and return parsed array
const readData = async (filename) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []; // file doesn't exist yet, just return empty
    }
    throw err;
  }
};

// write data back to the json file
const writeData = async (filename, data) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readData, writeData };

