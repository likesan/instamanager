const puppeteer = require('puppeteer');
const {Client, Pool} = require('pg');
const accountInfo = require('./account_config.json');
const readLine = require('readline-sync');
const {scrappingFollowing} = require(`./functions/scrappingFollowing.js`);
const {
      unfollowWhoNotFollowBackMain,
} = require(`./functions/unfollowWhoNotFollowBack.js`);
const {homeFeedLikeFunction} = require(`./functions/homefeedLikeFunction.js`);

async function loginProcInFirst(page, id, pw) {
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
}

async function dbInit(db) {
      const pool = new Pool({
            user: 'postgres',
            password: 'sjisgoodrich!',
            host: 'localhost',
            port: 5432,
            database: `${db}`,
      });

      pool.on('error', (err, client) => {
            console.error('Unexpected error', err);
            process.exit(-1);
      });

      const client = await pool.connect();
      return client;
}

(async () => {
      console.table([
            accountInfo.zena,
            accountInfo.dearRescued,
            accountInfo.sj,
      ]);
      var chooseAccount = parseInt(readLine.question(`👥 Choose Account \n> `));

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

      const client = await dbInit(db);

      client == (null || undefined)
            ? console.log(`DB Init failed check dbInit function`)
            : console.log(`successfully db client initialized`);

      console.log(`🔐 loginInfo proc check`, loginInfo(chooseAccount));

      const puppeteerConfig = {
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            userDataDir: `./${id}`,
            devtools: true,
      };

      // USER INPUT
      const modeChoose = readLine.question(
            `What do you want me to do?\n1. like on homefeed\n2. Make a db by all following list of my account\n3. Unfollow who doesn't follow me back.\n> `,
      );

      switch (modeChoose) {
            case `1`:
                  puppeteerConfig.slowMo = 550;
                  const browser = await puppeteer.launch(puppeteerConfig);
                  const page = await browser.newPage();
                  loginProcInFirst(page, id, pw);
                  homeFeedLikeFunction(page, client, db);
                  break;
            case `2`:
                  // scrapping all lists on following
                  console.log(`Scrapping 'Following list' started`);
                  browser = await puppeteer.launch(puppeteerConfig);
                  page = await browser.newPage();
                  loginProcInFirst(page, id, pw);
                  scrappingFollowing(page, id, pw, db);

                  break;

            case `3`:
                  console.log(`unfollow who doesn't follow me back`);
                  browser = await puppeteer.launch(puppeteerConfig);
                  page = await browser.newPage();
                  loginProcInFirst(page, id, pw);
                  unfollowWhoNotFollowBackMain(page, id, pw, db, client);
                  break;
            default:
                  break;
      }
})();
