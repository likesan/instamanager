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

async function pickTargetIdFromDB(table, client) {
      const selectProc = await client.query(
            `SELECT user_insta_id FROM ${table} order by id asc limit 1`,
      );
      const result = await selectProc.rows[0].user_insta_id;

      console.table([result]);

      return result;
}

async function followMeBackChecker(id, page) {
      var followListButtonSelector = `#react-root > section > main > div > header > section > ul > li:nth-child(2) > a`;

      //click the follower list button in profile
      await page.waitForSelector(followListButtonSelector);
      await page.evaluate(followListButtonSelector => {
            var followListButton = document.querySelector(
                  followListButtonSelector,
            );
            followListButton.click();
      }, followListButtonSelector);

      //look up my id on his follower list
      //   await page.waitForNavigation({waitUntil: 'networkidle2'});
      await page.on('dialog', async dialog => {
            console.log(dialog, dialog.message());
      });
      var followListDivSelector = `body > div > div > div:nth-child(2)`;

      await page.waitForSelector(followListDivSelector);
      const result = await page.evaluate(
            (id, followListDivSelector) => {
                  var followListDiv = document.querySelector(
                        `body > div > div > div:nth-child(2)`,
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

async function unfollowWhoNotFollowBack(page, id, pw, db, client) {
      console.table([id, pw, db]);

      const table = dbInitCheck(id, pw, db, client);
      const targetUserId = await pickTargetIdFromDB(table, client);
      console.log(`targetUserId`, targetUserId);

      await page.goto(`https://instagram.com/${targetUserId}`, {
            waituntil: 'networkidle2',
      });

      console.log(page.url());

      const isHeFollowMeBack = await followMeBackChecker(id, page);
      console.log(`Is he follow me back?`, isHeFollowMeBack);

//if he is following me up, I'll call to check next follower checker from.. pickTargetIdFromDB function

}

module.exports = {
      unfollowWhoNotFollowBack,
};
