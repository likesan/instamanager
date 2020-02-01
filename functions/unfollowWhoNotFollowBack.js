const puppeteer = require('puppeteer');
const {Client} = require('pg');

function dbInitCheck(id, pw, db, client) {
      console.log(`db init start`);

      var table = '';
      switch (db) {
            case `sj`:
                  break;
            case `catsns`:
                  table = `insta_fans`;
                  break;
            default:
                  break;
      }

      client.connect()
            .then(() => console.log(`postgres db connected successfully`))
            .then(() => client.query(`SELECT * FROM ${table}`))
            .then(results => console.table(`found a table`))
            .catch(e => console.log(e));
      return table;
}

async function getFollowingUsersFromDB(table, client) {
      const selectProc = await client.query(
            `SELECT user_insta_id FROM ${table} ORDER BY id
`,
      );
      const followingListResult = await selectProc.rows;

      return followingListResult;
}

async function followMeBackChecker(id, page) {
      var followListButtonSelector = `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`;

      //click the follower list button in profile
      await page.waitForSelector(followListButtonSelector);
      await page.evaluate(followListButtonSelector => {
            var followListButton = document.querySelector(
                  followListButtonSelector,
            );
            followListButton.click();
      }, followListButtonSelector);

      await page.on('dialog', async dialog => {
            console.log(dialog, dialog.message());
      });
      var followListDivSelector = `body > div> div > div:nth-child(3)`;

      await page.waitForSelector(followListDivSelector);
      const result = await page.evaluate(
            (id, followListDivSelector) => {
                  var followListDiv = document.querySelector(
                        `body > div > div > div:nth-child(3)`,
                  ).innerText;
                  console.table([followListDiv]);
                  console.log(`comparing with my 'id'`, id);
                  var isHeFollowMe = followListDiv.includes(`${id}`);
                  return isHeFollowMe;
            },
            id,
            followListDivSelector,
      );

      return result;
}

async function closeFollowingWindow(page) {
      await page.evaluate(() => {
            var closingFollowerWindowButton = document.querySelector(
                  `body > div> div > div:nth-child(1) > div > div:nth-child(3) > button`,
            );

            closingFollowerWindowButton.click();
      });
}

async function unfollowProc(page) {
      await page.evaluate(() => {
            var unfollowButton = document.querySelector(
                  `#react-root > section > main > div > header > section > div> div> span > span> button`,
            );
            unfollowButton.click();

            var unfollowConfirmButton = document.querySelector(
                  `body > div > div > div > div > button`,
            );
            unfollowConfirmButton.click();
      });
}

async function unfollowWhoNotFollowBack(page, id, pw, db, client) {
      console.table([id, pw, db]);

      const table = dbInitCheck(id, pw, db, client);
      const followingUsers = await getFollowingUsersFromDB(table, client);
      console.log(followingUsers);

      for (var rawFollowingUser of followingUsers) {
            var followingUser = rawFollowingUser.user_insta_id;
            console.log(`will check ${followingUser} follow me or not`);
            await page.goto(`https://instagram.com/${followingUser}`, {
                  waituntil: 'networkidle2',
            });

            console.log(page.url());

            const isHeFollowMeBack = await followMeBackChecker(id, page);
            console.log(`Is he follow me back?`, isHeFollowMeBack);

            //if he is following me up, I'll call to check next follower checker from.. pickTargetIdFromDB function

            if (isHeFollowMeBack) {
                  //1. close window - find next following listed user
                  closeFollowingWindow(page);
                  console.log(`will keep follow ${followingUser}`);
            } else {
                  //1. close winodw - select unfollow button - click - find next following listed user

                  closeFollowingWindow(page);
                  unfollowProc(page);
            }
      }
}

module.exports = {
      unfollowWhoNotFollowBack,
};
