import ora from 'ora';
import puppeteer from 'puppeteer';
import sendNotification from './sendNotification.js';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const configAdapter = new FileSync('./src/config.json');
const config = low(configAdapter);

config.read();
const value = config.get('config').value();

export default async function fetchQuota(schoolType, city, town, school, grade, schoolName) {
    console.clear();
    const quota = ora('Kontenjan bilgisi alınıyor..').start();

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK06006.aspx');

        await new Promise(resolve => setTimeout(resolve, 1000)); // sometimes chromium runs slow so waiting 1000ms

        await page.waitForSelector('#ddlTercihTuru_chosen');
        await page.click('#ddlTercihTuru_chosen');
        await page.waitForSelector('#ddlTercihTuru_chosen .chosen-drop');
        await page.click('#ddlTercihTuru_chosen .chosen-drop .chosen-results li:nth-child(' + schoolType + ')');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 500)); // sometimes chromium runs slow so waiting 500ms

        await page.waitForSelector('#ddlIl_chosen');
        await page.click('#ddlIl_chosen');
        await page.waitForSelector('#ddlIl_chosen .chosen-drop');
        await page.click('#ddlIl_chosen .chosen-drop .chosen-results li[data-option-array-index="' + city + '"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 500));

        await page.waitForSelector('#ddlIlce_chosen');
        await page.click('#ddlIlce_chosen');
        await page.waitForSelector('#ddlIlce_chosen .chosen-drop');
        await page.click('#ddlIlce_chosen .chosen-drop .chosen-results li[data-option-array-index="' + town + '"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 500));

        await page.waitForSelector('#ddlOkul_chosen');
        await page.click('#ddlOkul_chosen');
        await page.waitForSelector('#ddlOkul_chosen .chosen-drop');
        await page.click('#ddlOkul_chosen .chosen-drop .chosen-results li[data-option-array-index="' + school + '"]');

        await page.waitForSelector('#btnGiris');
        await page.click('#btnGiris');

        await new Promise(resolve => setTimeout(resolve, 1000));

        const values = await page.$$eval('#dgListe tr', rows => {
            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                return Array.from(cells).map(cell => cell.innerText);
            });
        });

        await browser.close();

        quota.succeed('Kontenjan bilgisi başarı ile alındı!');
        var kontenjan;
        grade == 9 ? kontenjan = values[1][2] : grade == 10 ? kontenjan = values[1][3] : grade == 11 ? kontenjan = values[1][4] : kontenjan = values[1][5];

        if (kontenjan >= 1) {
            console.log(`${schoolName} okulunun ${grade}. sınıf kontenjanı: ${kontenjan}`);
            sendNotification(`${schoolName} okulunun ${grade}. sınıf kontenjanı: ${kontenjan}`, {
                service: value.notif,
                uri: value.uri,
                token: value.token,
                id: value.chatId
            });
        };
    } catch (error) {
        await browser.close();
        quota.fail('Kontenjan bilgisi alınırken bir hata oluştu.\n');
        console.log(error);
    };
};