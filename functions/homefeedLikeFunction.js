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

async function clickLikesWithScrollDown(page, countsLiked, grabLikesNumbers) {
      for (var l = 1; l <= grabLikesNumbers.length; l++) {
            await page.evaluate(
                  (l, countsLiked) => {
                        console.log(l, `th of article chosen`);
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
                        } catch (e) {
                              e.message.includes(`null`)
                                    ? console.log(`null error comes out`)
                                    : console.error(e);
                        }
                        countsLiked++;
                        console.log(`like clicked?`, countsLiked);
                  },
                  l,
                  countsLiked,
            );
            await page.evaluate(() => {
                  window.scrollBy(0, document.body.scrollHeight);
            });
      }
}

async function homeFeedLikeFunction(page, url) {
      closeNoticeBox(page, url);

      console.log(`user choose 1, homefeed like will run.`);
      var countsLiked = 0;
      var scrolledCounts = 0;

      while (scrolledCounts <= 10) {
            const grabLikesNumbersSelector = `/html/body/div[1]/section/main/section/div[2]/div[1]/div/article/div[2]/section[1]/span[1]/button`;
            await page.waitForXPath(grabLikesNumbersSelector);
            var grabLikesNumbers = await page.$x(grabLikesNumbersSelector);

            console.log(`how many likes selected?`, grabLikesNumbers.length);
            clickLikesWithScrollDown(page, countsLiked, grabLikesNumbers);
      }
}

module.exports = {
      homeFeedLikeFunction: homeFeedLikeFunction,
};
