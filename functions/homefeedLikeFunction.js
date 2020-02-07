async function dbChecker(client, db) {
      const result = await client.query(`SELECT * FROM insta_logs`);
      if (result.rows.length > 0) {
            console.log(`nothing in db 'insta_logs' `);
      } else {
            console.log(
                  `✅ Last log check`,
                  result.rows.forEach(row => console.log(row)),
            );
      }
}

async function closeNoticeBox(page, url) {
      if (url == 'https://instagram.com') {
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

async function clickLikesWithScrollDown(
      client,
      page,
      countsLiked,
      grabLikesNumbers,
) {
      for (var l = 1; l <= grabLikesNumbers.length; l++) {
            console.log(l, `th of article chosen`);
            await page.evaluate(
                  (l, countsLiked, client) => {
                        client == undefined || null
                              ? console.log(`❌ client didn't init properly!`)
                              : console.log(`👍 client came in!`);

                        var like = document.evaluate(
                              `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article[${l}]/div[2]/section[1]/span[1]/button`,
                              document,
                              null,
                              XPathResult.FIRST_ORDERED_NODE_TYPE,
                              null,
                        ).singleNodeValue;

                        var isLikeHeartNonClickedYet =
                              like.children[0].getAttribute(`aria-label`) ==
                              'Like';
                        console.table([
                              {
                                    'like label?': like.children[0].getAttribute(
                                          `aria-label`,
                                    ),
                              },
                              {'like status': isLikeHeartNonClickedYet},
                        ]);

                        try {
                              if (isLikeHeartNonClickedYet) {
                                    like.focus();
                                    like.click();
                                    countsLiked++;
                                    function likeLogging(client) {
                                          const likeLoggingInDB = client.query(
                                                'UPDATE insta_logs SET like_counts_today = like_counts_today + 1 WHERE date= current_date RETURNING date, like_counts_today',
                                          );

                                          console.log(
                                                `Log like Row changed?`,
                                                likeLoggingInDB.rows,
                                                likeLoggingInDB.rows.forEach(
                                                      row => console.log(row),
                                                ),
                                          );

                                          if (likeLoggingInDB.length > 0) {
                                                const createNewLikeLogRow = client.query(
                                                      'INSERT INTO insta_logs (date,like_counts_today) VALUES(current_date, 1) RETURNING date, like_counts_today',
                                                );

                                                console.log(
                                                      `🎂 first like row created`,
                                                      createNewLikeLogRow.rows,
                                                );
                                          }
                                    }
                              } else {
                                    console.log(`🙄 That's already clicked`);
                              }
                        } catch (e) {
                              e.message.includes(`null`)
                                    ? console.log(`null error`)
                                    : console.error(e);
                        }
                  },
                  l,
                  countsLiked,
                  client,
            );
            await page.evaluate(() => {
                  window.scrollBy(0, document.body.scrollHeight);
            });
      }
}

async function homeFeedLikeFunction(page, client, db) {
      const url = page.url();
      dbChecker(client, db);
      closeNoticeBox(page, url);

      console.log(`user choose 1, homefeed like will run.`);
      var scrolledCounts = 0;
      var countsLiked = 0;
      while (scrolledCounts <= 10) {
            const grabLikesNumbersSelector = `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article/div[2]/section[1]/span[1]/button`;
            await page.waitForXPath(grabLikesNumbersSelector);
            var grabLikesNumbers = await page.$x(grabLikesNumbersSelector);

            console.log(`how many likes selected?`, grabLikesNumbers.length);
            clickLikesWithScrollDown(
                  client,
                  page,
                  countsLiked,
                  grabLikesNumbers,
            );
      }
}

module.exports = {
      homeFeedLikeFunction: homeFeedLikeFunction,
};
