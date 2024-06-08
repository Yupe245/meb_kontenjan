import ora from 'ora';
import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import low from 'lowdb';

import FileSync from 'lowdb/adapters/FileSync.js';

const prompt = inquirer.createPromptModule();
console.clear();

const configAdapter = new FileSync('config.json');
const config = low(configAdapter);

const info = {
    notif: '',
    uri: '',
    token: '',
    chatId: 0,
    grade: 0,
    schoolType: 0,
    city: 0,
    town: 0,
    school: 0
};

prompt({
    name: 'notif',
    type: 'list',
    choices: [
        { name: 'Telegram', value: 'telegram' },
        { name: 'NTFY', value: 'ntfy' }
    ],
    message: 'Hangi bildirim servisini kullanmak istersiniz?'
}).then(async ({ notif }) => {
    console.clear();
    info.notif = notif;
    if (notif == 'ntfy') {
        await prompt({
            name: 'uri',
            type: 'input',
            message: 'NTFY sunucusunun URL\'ini giriniz:\n'
        }).then(async ({ uri }) => {
            await prompt({
                name: 'token',
                type: 'input',
                message: 'NTFY sunucusu için API token\'ını giriniz:\n'
            }).then(({ token }) => {
                info.uri = uri;
                info.token = token;
            });
        });
    } else if (notif == 'telegram') {
        await prompt({
            name: 'token',
            type: 'input',
            message: 'Telegram botunun token\'ını giriniz:\n'
        }).then(async ({ token }) => {
            await prompt({
                name: 'chatId',
                type: 'input',
                message: 'Telegram chat ID\'sini giriniz:\n'
            }).then(({ chatId }) => {
                info.token = token;
                info.chatId = chatId;
            });
        });
    };

    console.clear();

    prompt({
        name: 'grade',
        type: 'number',
        message: 'Kontrol edilecek sınıf seviyesini giriniz (9, 10, 11, 12):\n'
    }).then(async ({ grade }) => {
        if (!Number(grade)) {
            console.log('Lütfen sadece sayı giriniz!');
            return process.exit();
        };

        if (grade < 9 || grade > 12) {
            console.log('Lütfen 9 ile 12 arasında bir sayı giriniz!');
            return process.exit();
        };

        console.clear();
        const schoolType = ora('Okul türleri alınıyor..').start();

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        var choices;

        try {
            await page.goto('https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK06006.aspx');

            await page.waitForSelector('#ddlTercihTuru_chosen');
            await page.click('#ddlTercihTuru_chosen');
            await page.waitForSelector('#ddlTercihTuru_chosen .chosen-results');

            const options = await page.$$eval('#ddlTercihTuru_chosen .chosen-results li', options => options.map(option => option.textContent).slice(1));
            await browser.close();
            choices = options.map((data, index) => ({ name: data, value: index }));
            schoolType.succeed('Okul türleri başarı ile alındı!');
            info.grade = grade;
        } catch (error) {
            schoolType.fail('Okul türleri alınırken bir hata oluştu!');
            console.error(error);
            return process.exit();
        };

        prompt({
            name: 'schoolType',
            type: 'list',
            choices,
            message: 'Okul türünü seçiniz:'
        }).then(async ({ schoolType }) => {
            schoolType = schoolType + 2; // adding 2 beacuse the first option is not school type

            console.clear();
            const fetchingCities = ora('İller alınıyor..').start();

            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            var choices;

            try {
                await page.goto('https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK06006.aspx');

                await page.waitForSelector('#ddlTercihTuru_chosen');
                await page.click('#ddlTercihTuru_chosen');
                await page.waitForSelector('#ddlTercihTuru_chosen .chosen-results');
                await page.click('#ddlTercihTuru_chosen .chosen-drop .chosen-results li:nth-child(' + schoolType + ')');

                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await new Promise(resolve => setTimeout(resolve, 1000));

                await page.waitForSelector('#ddlIl_chosen');
                await page.click('#ddlIl_chosen');
                await page.waitForSelector('#ddlIl_chosen .chosen-drop');

                const options = await page.$$eval('#ddlIl_chosen .chosen-results li', options => options.map(option => option.textContent));
                await browser.close();
                choices = options.map((data, index) => ({ name: data, value: index }));
                fetchingCities.succeed('İller başarı ile alındı!');
                info.schoolType = schoolType;
            } catch (error) {
                fetchingCities.fail('Okul türleri alınırken bir hata oluştu!');
                console.error(error);
                return process.exit();
            };

            prompt({
                name: 'city',
                type: 'list',
                choices,
                message: 'İl seçiniz:',
            }).then(async ({ city }) => {
                city = city + 1;

                console.clear();
                const fetchingTowns = ora('İlçeler alınıyor..').start();
                const browser = await puppeteer.launch({ headless: true });
                const page = await browser.newPage();
                var choices;

                try {
                    await page.goto('https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK06006.aspx');

                    await page.waitForSelector('#ddlTercihTuru_chosen');
                    await page.click('#ddlTercihTuru_chosen');
                    await page.waitForSelector('#ddlTercihTuru_chosen .chosen-results');
                    await page.click('#ddlTercihTuru_chosen .chosen-drop .chosen-results li:nth-child(' + schoolType + ')');

                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await page.waitForSelector('#ddlIl_chosen');
                    await page.click('#ddlIl_chosen');
                    await page.waitForSelector('#ddlIl_chosen .chosen-drop');
                    await page.click('#ddlIl_chosen .chosen-drop .chosen-results li[data-option-array-index="' + city + '"]');

                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await page.waitForSelector('#ddlIlce_chosen');
                    await page.click('#ddlIlce_chosen');
                    await page.waitForSelector('#ddlIlce_chosen .chosen-drop');

                    const options = await page.$$eval('#ddlIlce_chosen .chosen-results li', options => options.map(option => option.textContent).slice(1));
                    await browser.close();
                    choices = options.map((data, index) => ({ name: data, value: index }));

                    fetchingTowns.succeed('İlçeler başarı ile alındı!');
                    info.city = city;
                } catch (error) {
                    fetchingTowns.fail('İlçeler alınırken bir hata oluştu!');
                    console.error(error);
                    return process.exit();
                };

                prompt({
                    name: 'town',
                    type: 'list',
                    choices,
                    message: 'İlçe seçiniz:',
                }).then(async ({ town }) => {
                    town = town + 1;

                    console.clear();
                    const fetchingSchools = ora('Okullar alınıyor..').start();
                    const browser = await puppeteer.launch({ headless: true });
                    const page = await browser.newPage();
                    var choices;

                    try {
                        await page.goto('https://e-okul.meb.gov.tr/OrtaOgretim/OKL/OOK06006.aspx');

                        await page.waitForSelector('#ddlTercihTuru_chosen');
                        await page.click('#ddlTercihTuru_chosen');
                        await page.waitForSelector('#ddlTercihTuru_chosen .chosen-results');
                        await page.click('#ddlTercihTuru_chosen .chosen-drop .chosen-results li:nth-child(' + schoolType + ')');

                        await page.waitForNavigation({ waitUntil: 'networkidle0' });
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await page.waitForSelector('#ddlIl_chosen');
                        await page.click('#ddlIl_chosen');
                        await page.waitForSelector('#ddlIl_chosen .chosen-drop');
                        await page.click('#ddlIl_chosen .chosen-drop .chosen-results li[data-option-array-index="' + city + '"]');

                        await page.waitForNavigation({ waitUntil: 'networkidle0' });
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await page.waitForSelector('#ddlIlce_chosen');
                        await page.click('#ddlIlce_chosen');
                        await page.waitForSelector('#ddlIlce_chosen .chosen-drop');
                        await page.click('#ddlIlce_chosen .chosen-drop .chosen-results li[data-option-array-index="' + town + '"]');

                        await page.waitForNavigation({ waitUntil: 'networkidle0' });
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await page.waitForSelector('#ddlOkul_chosen');
                        await page.click('#ddlOkul_chosen');
                        await page.waitForSelector('#ddlOkul_chosen .chosen-results');

                        const options = await page.$$eval('#ddlOkul_chosen .chosen-results li', options => options.map(option => option.textContent));
                        await browser.close();
                        choices = options.map((data, index) => ({ name: data, value: index }));

                        if (choices.length == 0) {
                            fetchingSchools.fail('Seçtiğiniz ilçede seçtiğiniz türde okul bulunamadı!');
                            return process.exit();
                        };

                        fetchingSchools.succeed('Okullar başarı ile alındı!');
                        info.town = town;
                    } catch (error) {
                        fetchingSchools.fail('Okullar alınırken bir hata oluştu!');
                        console.error(error);
                        return process.exit();
                    };

                    prompt({
                        name: 'school',
                        type: 'list',
                        choices,
                        message: 'Okul seçiniz:',
                    }).then(async ({ school }) => {
                        school = school + 1;
                        info.school = school;

                        config.read();
                        config.set('config', info).write();

                        console.clear();
                        console.log('Ayarlar başarı ile kaydedildi!');
                    });
                });
            });
        });
    });
});
