const puppeteer = require('puppeteer');
const {Client} = require('pg');

async function followingDivScrollingDown(page, usersFollowingCounts) {}

async function getFollowingPeopleFromScrolledDiv(page) {
      //extracting followinglist to array
      var followingList = await page.$$(`body > div> div > div> ul > div > li`);
      var arrayChunk = [];
      for (var list of followingList) {
            var userId = JSON.stringify(
                  await (await list.getProperty('innerText')).jsonValue(),
            )
                  .split(/\\n/g)[0]
                  .replace(/"/g, '');

            var userName = JSON.stringify(
                  await (await list.getProperty('innerText')).jsonValue(),
            ).split(/\\n/g)[1];

            // userName if it's empty, then 'Following' string captured, so replace them with userId
            if (userName.includes(`Following`)) {
                  userName = userId;
                  return userName;
            }

            console.log(`userName test`, userName);
            var userProfileImg = await list.evaluate(node => {
                  return node.childNodes[0].childNodes[0].childNodes[0]
                        .childNodes[1].childNodes[0].src;
            });

            var trimmedImg = userProfileImg.substring(0, 30);
            console.log(
                  `Did $$ got the list in followingList[${followingList.length}]`,
            );
            console.table([userId, userName, trimmedImg]);

            arrayChunk.push({
                  userId: userId,
                  userName: userName,
                  userProfileImg: userProfileImg,
            });
      }
}

async function getUsersFollowingCounts(page) {
      await page.waitForSelector(`body > div > div > div> ul > div > li`);
      var usersFollowingCounts = await page.$eval(
            `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > span`,
            e =>
                  // following int counts from str
                  parseInt(e.innerText.replace(/,/g, '')),
      );
      console.log(
            `How many following do I?`,
            typeof usersFollowingCounts,
            usersFollowingCounts,
      );
      return usersFollowingCounts;
}

async function loopingAllListsInFollowing(page, usersFollowingCounts) {
      const shouldBeLooping = usersFollowingCounts / 12;
      const multiply = 12;
      for (var l = 1; l <= shouldBeLooping; l++) {
            console.log(`${l}th of loop`);

            // choose for the code block
            const listSelector = `body > div> div > div> ul > div > li`;
            await page.waitForSelector(listSelector);

            //extracting currently checked list length
            const currentlyLoadedList = await page.$$eval(
                  listSelector,
                  lists => lists.length,
            );
            console.table([currentlyLoadedList, usersFollowingCounts]);

            // does looping shows up all hidden lists of following?
            if (currentlyLoadedList <= usersFollowingCounts) {
                  // how many following still in left?
                  await page.waitForSelector(
                        `body > div> div > div> ul > div > li:nth-child(${l *
                              multiply})`,
                        {timeout: 5000},
                  );
                  // keep goes down by scrollIntoView()
                  await page.$eval(
                        `body > div> div > div> ul > div > li:nth-child(${l *
                              multiply}) `,
                        (list, err) => {
                              list.scrollIntoView({
                                    block: 'end',
                                    inline: 'nearest',
                              });
                        },
                  );
            } else {
                  console.log(`scrolling loop will break`);

                  break;
            }
      }
}

async function insertIntoDBFromScrapping(arrayChunk, client, table) {
      // if following list put into array succesfully, put them into db
      if (arrayChunk.length > 0) {
            console.log(`how many followings scrapped?`, arrayChunk.length);
            for (var person of arrayChunk) {
                  client.query(
                        'INSERT INTO ' +
                              table +
                              ' (user_name, user_insta_id, profile_photo) VALUES ($1, $2, $3) returning user_insta_id',
                        [person.userName, person.userId, person.userProfileImg],
                  )
                        .then(result => {
                              console.table(result.rows[0]);
                              console.log('scrapping into DB finished!');
                        })
                        .catch(e => console.error(e));
            }
      }
}

async function toTheFollowingPopup(page) {
      // on profile page -> following page with the small window
      await Promise.all([
            await page.waitForSelector(
                  `#react-root > section > nav > div> div > div > div> div > div:nth-child(3) > a`,
            ),

            await page.click(
                  `#react-root > section > nav > div> div > div > div> div > div:nth-child(3) > a`,
            ),
      ]);

      console.log(`profile page clicked`);

      await Promise.all([
            // click following counts on profile
            await page.waitForSelector(
                  `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`,
            ),
            await page.click(
                  `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`,
            ),
      ]);

      console.log(`following window opened`);
}
async function loginProc(page) {
      // Account INIT

      // login proc for no cookie mode
      try {
            //login proc

            await page.type(
                  `#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(2) > div > label > input`,
                  id,
            );
            await page.type(
                  `#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(3) > div > label > input`,
                  pw,
            );
            await page.click(
                  `#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(4) > button`,
            );
            console.log(`Login!`);
            console.log(`entered my profile screen`);
            //click `not now` button for notice alarm

            await page.waitForSelector(
                  `body > div > div > div > div > button:nth-child(2)`,
            );
            await page.click(
                  `body > div > div > div > div > button:nth-child(2)`,
            );
      } catch (e) {
            if (e.message.includes(`not found`)) {
                  throw `not found`;
            }
      }
}

scrappingFollowing = async (page, id, pw, db) => {
      console.log(`LOGIN INFO`);
      console.table([id, pw, db]);

      //POSTRESQL DB CONNECTION INIT
      var client = new Client({
            user: 'postgres',
            password: 'sjisgoodrich!',
            host: 'localhost',
            port: 5432,
            database: `${db}`,
      });

      var table = ``;
      switch (db) {
            case 'sj':
                  table = `sj_insta`;
                  break;
            case 'catsns':
                  table = `insta_fans`;

                  break;
            default:
                  break;
      }
      client.connect()
            .then(() => console.log(`postgres db connected successfully`))
            .then(() => client.query(`SELECT * FROM ${table}`))
            .then(results => console.table(results.rows))
            .catch(e => console.log(e));

      await page.goto(
            'https://www.instagram.com/accounts/login/?source=auth_switcher',
            {
                  waitUntil: [`domcontentloaded`],
            },
      );

      console.log('puppeteer launch');

      await loginProc(page);

      await toTheFollowingPopup(page);

      //get my following numbers

      var usersFollowingCounts = await getUsersFollowingCounts(page);

      await loopingAllListsInFollowing(page, usersFollowingCounts);

      await getFollowingPeopleFromScrolledDiv(page);

      await insertIntoDBFromScrapping(arrayChunk, client, table);
};
module.exports = {
      scrappingFollowing,
};
