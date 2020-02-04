const puppeteer = require('puppeteer');
const {Client} = require('pg');
const accountInfo = require('./account_config.json');
const readLine = require('readline-sync');
const {scrappingFollowing} = require(`./functions/scrappingFollowing.js`);
const {
      unfollowWhoNotFollowBackMain,
} = require(`./functions/unfollowWhoNotFollowBack.js`);
const {homeFeedLikeFunction} = require(`./functions/homefeedLikeFunction.js`);

(async () => {
      console.table([
            accountInfo.zena,
            accountInfo.dearRescued,
            accountInfo.sj,
      ]);
      var chooseAccount = parseInt(readLine.question(`Choose Account \n> `));

      var loginInfo = chooseAccount => {
            switch (chooseAccount) {
                  case 1:
                        return accountInfo.zena;
                  case 2:
                        return accountInfo.dearRescued;
                  case 3:
                        return accountInfo.sj;
                  default:
                        break;
            }
      };

      // INIT
      var id = loginInfo(chooseAccount).id;
      var pw = loginInfo(chooseAccount).pw;
      var db = loginInfo(chooseAccount).db;

      var client = new Client({
            user: 'postgres',
            password: 'sjisgoodrich!',
            host: 'localhost',
            port: 5432,
            database: `${db}`,
      });

      console.log(`loginInfo proc check`, loginInfo(chooseAccount));

      const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            userDataDir: `./${id}`,
            devtools: true,
            slowMo: 500,
      });

      const page = await browser.newPage();
      new Promise(res => browser.on(`targetcreated`, res));
      const loginScreenUrl = `https://www.instagram.com/accounts/login/?source=auth_switcher`;
      await page.goto(loginScreenUrl, {waitUntil: `networkidle2`});

      var url = await page.url();
      if (url == loginScreenUrl) {
            await Promise.all([
                  page.waitForSelector('[name="username"]'),
                  page.waitForSelector('[name="password"]'),
                  page.waitForSelector(`[type="submit"]`),
            ]);

            await page.type(`[name="username"]`, id);
            await page.type(`[name="password"]`, pw);

            await Promise.all([
                  page.click('[type="submit"]'),
                  page.waitForNavigation({
                        waituntil: 'networkidle0',
                  }),
            ]);

            //turn off box
            await Promise.all([
                  page.waitForSelector(`body > div > div > div > div > button`),
                  page.evaluate(() =>
                        document
                              .querySelector(
                                    `body > div > div > div > div >button`,
                              )
                              .click(),
                  ),
            ]);
      }

      // USER INPUT
      var modeChoose = readLine.question(
            `What do you want me to do?\n1. like on homefeed\n2. Make a db by all following list of my account\n3. Unfollow who doesn't follow me back.\n> `,
      );

      switch (modeChoose) {
            case `1`:
                  homeFeedLikeFunction(page, url);

                  break;

            case `2`:
                  // scrapping all lists on following
                  console.log(`Scrapping 'Following list' started`);
                  scrappingFollowing(page, id, pw, db);

                  break;

            case `3`:
                  console.log(`unfollow who doesn't follow me back`);
                  unfollowWhoNotFollowBackMain(page, id, pw, db, client);
                  break;
            default:
                  break;
      }
})();
