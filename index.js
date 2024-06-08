import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';
import fetchQuota from './src/functions/fetchQuota.js';
import sendNotification from './src/functions/sendNotification.js';

const configAdapter = new FileSync('./src/config.json');
const config = low(configAdapter);

await new Promise(resolve => setTimeout(resolve, 500));
console.clear();

config.read();
const value = config.get('config').value();

if (Object.keys(value) == 0) {
    console.log(`\x1b[101m ! \x1b[0m\x1b[37m Sistemi çalıştırmadan önce kurulum yapmalısınız..`);
    process.exit(1);
};

fetchQuota(value.schoolType, value.city, value.town, value.school, value.grade, value.schoolName);
setInterval(() => {
    fetchQuota(value.schoolType, value.city, value.town, value.school, value.grade, value.schoolName);
}, 1 * 60 * 60 * 1000);