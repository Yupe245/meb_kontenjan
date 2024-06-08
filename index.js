import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';
import fetchQuota from './fetchQuota.js';

const configAdapter = new FileSync('config.json');
const config = low(configAdapter);

console.clear();

config.read();
const value = config.get('config').value();

fetchQuota(value.schoolType, value.city, value.town, value.school, value.grade);
setInterval(() => {
    fetchQuota(value.schoolType, value.city, value.town, value.school, value.grade);
}, 1*60*1000);