const puppeteer = require('puppeteer');
const {Client} = require('pg');

function dbInitCheck(id, pw, db, client) {
      console.log(`db init start`);

      var table = '';
      switch (db) {
            case `sj`:
                  table = `sj_insta`;
                  break;
            case `catsns`:
                  table = `insta_fans`;
                  break;
            case `dearrescued`:
                  table = `insta_fans`;
                  break;
            default:
                  break;
      }

      client.connect()
            .then(() => console.log(`postgres db connected successfully`))
            .then(() => client.query('SELECT * FROM ${table}'))
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
      try {
            var followListButtonSelector = `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`;

            const usersFollowingCounts = await page.evaluate(() =>
                  parseInt(
                        document.querySelector(
                              `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > span`,
                        ).innerText,
                  ),
            );

            console.table([{usersFollowingCounts: usersFollowingCounts}]);

            //click the follower list button in profile
            await Promise.all([
                  await page.waitForSelector(followListButtonSelector),
                  await page.evaluate(followListButtonSelector => {
                        var followListButton = document.querySelector(
                              followListButtonSelector,
                        );
                        followListButton.click();
                  }, followListButtonSelector),
            ]);
            await page.waitForSelector('body > div> div > div> ul > div', {
                  timeout: 5000,
            });
            const followingListDivHandler = await page.$(
                  `body > div> div > div> ul > div`,
            );
            const followingListScrollHeight = await page.evaluate(
                  div => div.scrollHeight,
                  followingListDivHandler,
            );

            console.log(
                  `Did followingListDiv height?`,
                  followingListScrollHeight,
            );
            const currentUlHeight = followingListScrollHeight;
            const shouldBeScrolledHeight = usersFollowingCounts * 53.97;

            console.table([
                  {shouldBeScrolledHeight: shouldBeScrolledHeight},
                  {currentUlHeight: currentUlHeight},
            ]);

            //scrolling down until the following ul reaches bottom
            for (var l = 1; l <= usersFollowingCounts / 12; l++) {
                  console.log(l, usersFollowingCounts / 12);
                  await page.evaluateHandle(() => {
                        document
                              .querySelector(`body>div>div>div>ul>div`)
                              .lastChild.scrollIntoView();
                  });
            }

            const followingListInnerText = await page.evaluate(
                  div => div.innerText,
                  followingListDivHandler,
            );
            console.log(`followingListInnerText`, followingListInnerText);
            console.log(`comparing with my 'id'`, id);
            var isHeFollowMe = followingListInnerText.includes(`${id}`);
            // send error
            return isHeFollowMe;
      } catch (e) {
            if (e.message.includes(`innerText`)) {
                  return (isHeFollowMe = false);
            } else {
                  console.error(e);
            }
      }
}

async function closeFollowingWindow(page) {
      await page.evaluate(() => {
            var closingFollowerWindowButton = document.querySelector(
                  `body > div> div > div:nth-child(1) > div > div:nth-child(3) > button`,
            );

            closingFollowerWindowButton.click();
      });
}

async function unfollowProc(page, client, table, targetFollowingUserId) {
      try {
            await page.evaluate(
                  (client, table, targetFollowingUserId) => {
                        var unfollowButton = document.querySelector(
                              `#react-root > section > main > div > header > section > div> div> span > span> button`,
                        );

                        if (unfollowButton.innerText == `Follow`) {
                              console.log(
                                    `already we don't follow this account `,
                              );
                        } else {
                              unfollowButton.click();
                              var unfollowConfirmButton = document.querySelector(
                                    `body > div > div > div > div > button`,
                              );
                              unfollowConfirmButton.click();

                              //delete from that id in my db
                              client.query(
                                    'DELETE FROM' +
                                          table +
                                          'WHERE user_insta_id= $1 RETURNING user_insta_id',
                                    [targetFollowingUserId],
                              )
                                    .then(result => console.log(result.rows[0]))
                                    .catch(e => console.error(e.message));
                        }
                  },
                  client,
                  table,
                  targetFollowingUserId,
            );
      } catch (e) {
            if (e.message.includes(`navigation`)) {
                  console.error(`navigation error`);
            } else {
                  console.error(`another error`, e.stack);
            }
      }
}

async function unfollowWhoNotFollowBackMain(page, id, pw, db, client) {
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

            if (isHeFollowMeBack) {
                  closeFollowingWindow(page);
                  console.log(`will keep follow ${followingUser}`);
            } else {
                  closeFollowingWindow(page);
                  unfollowProc(page, client, table, followingUser);
            }
      }
}

module.exports = {
      unfollowWhoNotFollowBackMain,
};
