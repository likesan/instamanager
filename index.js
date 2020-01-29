const puppeteer = require('puppeteer');
const {Client} = require('pg');
const accountInfo = require('./account_config.json');
const readLine = require('readline-sync');
const {scrappingFollowing} = require(`./functions/scrappingFollowing.js`);
const {
      unfollowWhoNotFollowBack,
} = require(`./functions/unfollowWhoNotFollowBack.js`);

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
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            userDataDir: `./${id}`,
            devtools: true,
      });

      const page = await browser.newPage();
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
                        waitUntil: 'networkidle0',
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
                  if (url == 'https://instagram.com') {
                        await Promise.all([
                              page.waitForSelector(
                                    `body > div > div > div > div > button`,
                              ),
                              page.evaluate(() =>
                                    document
                                          .querySelector(
                                                `body > div > div > div > div >button`,
                                          )
                                          .click(),
                              ),
                        ]);
                  }

                  console.log(`user choose 1, homefeed like will run.`);
                  var countsLiked = 0;
                  var scrolledCounts = 0;
                  var interval = 2000;
                  console.log(`start looping to click with ${interval} ms`);

                  try {
                        while (scrolledCounts <= 10) {
                              await page.waitForXPath(
                                    `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article/div[2]/section[1]/span[1]/button`,
                              );
                              var grabLikesCounts = await page.$x(
                                    `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article/div[2]/section[1]/span[1]/button`,
                              );

                              console.log(
                                    `how many likes selected?`,
                                    grabLikesCounts.length,
                              );
                              for (
                                    var l = 1;
                                    l <= grabLikesCounts.length;
                                    l++
                              ) {
                                    await page.evaluate(
                                          (l, countsLiked) => {
                                                console.log(l, `th loop`);

                                                var like = document.evaluate(
                                                      `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article[${l}]/div[2]/section[1]/span[1]/button`,
                                                      document,
                                                      null,
                                                      XPathResult.FIRST_ORDERED_NODE_TYPE,
                                                      null,
                                                ).singleNodeValue;

                                                try {
                                                      like.focus();
                                                      like.click();
                                                      countsLiked++;
                                                      console.log(
                                                            `like clicked?`,
                                                            countsLiked,
                                                      );
                                                } catch (e) {
                                                      e.message;
                                                }
                                          },
                                          l,
                                          countsLiked,
                                    );

                                    await page.evaluate(scrolledCounts => {
                                          console.log(
                                                `scroll Down! `,
                                                scrolledCounts,
                                          );
                                          window.scrollBy(
                                                0,
                                                document.body.scrollHeight,
                                          );
                                          scrolledCounts++;
                                    }, scrolledCounts);
                              }
                        }
                  } catch (e) {
                        if (e.stack.includes("'focus' of null")) {
                              console.log(`focus of null error detected`);
                              console.log(
                                    `element couldn't recognized by puppeteer, so wait for 2 sec, It may happen infinite scroll still loading`,
                              );
                              await page.waitFor(2000);
                              await page.waitForXPath(
                                    `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article[${l}]/div[2]/section[1]/span[1]/button`,
                              );
                        }
                  }

                  break;

            case `2`:
                  // scrapping all lists on following
                  console.log(`Scrapping 'Following list' started`);
                  scrappingFollowing(page, id, pw, db);

                  break;

            case `3`:
                  console.log(`unfollow who doesn't follow me back`);
                  unfollowWhoNotFollowBack(page, id, pw, db, client);
                  break;
            default:
                  break;
      }
})();
