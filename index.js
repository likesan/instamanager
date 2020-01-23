const puppeteer = require('puppeteer');
const {Client} = require('pg');
const {id, pw} = require('./account_config.json');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['start-fullscreen', '--no-sandbox', '--disable-setuid-sandbox'],
    userDataDir: './zena',
    devtools: true,
    //slowMo: 250,
  });

  const page = await browser.newPage();
  // POSTRESQL DB CONNECTION INIT
  var client = new Client({
    user: 'postgres',
    password: 'sjisgoodrich!',
    host: 'localhost',
    port: 5432,
    database: 'catsns',
  });

  client
    .connect()
    .then(() => console.log(`postgres db connected successfully`))
    .then(() => client.query('SELECT * FROM insta_fans'))
    .then(results => console.table(results.rows))
    .catch(e => console.log(e));

  await page.goto(
    'https://www.instagram.com/accounts/login/?source=auth_switcher',
    {
      waitUntil: [`domcontentloaded`],
    },
  );
  console.log('puppeteer launch');
  // Account INIT
  console.log(`ID : ${id} \n PW : ${pw}`);
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
    await page.click(`body > div > div > div > div > button:nth-child(2)`);
  } catch (e) {
    if (e.message.includes(`not found`)) {
      throw `not found`;
    }
  }

  // on profile page -> following page with the small window
  await page.waitForSelector(
    `#react-root > section > nav > div> div > div > div> div > div:nth-child(3) > a`,
  );

  await page.click(
    `#react-root > section > nav > div> div > div > div> div > div:nth-child(3) > a`,
  );

  console.log(`profile page clicked`);

  // click following counts on profile
  await page.waitForSelector(
    `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`,
  );
  await page.click(
    `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a`,
  );

  console.log(`following window opened`);

  try {
    //get my following numbers
    await page.waitForSelector(`body > div > div > div> ul > div > li`);
    var getFollowCount = await page.$eval(
      `#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > span`,
      e =>
        // following int counts from str
        parseInt(e.innerText.replace(/,/g, '')),
    );
    console.log(
      `How many following do I?`,
      typeof getFollowCount,
      getFollowCount,
    );

    const shouldBeLooping = getFollowCount / 12;
    console.log(`How many times will loop?`, shouldBeLooping);

    //here is the line to be checked : fully scroll down until the last following person
    const multiply = 12;

    for (var l = 1; l <= 2; l++) {
      console.log(`${l}th of loop`);

      // choose for the code block
      const listSelector = `body > div> div > div> ul > div > li`;
      await page.waitForSelector(`body > div> div > div> ul > div > li`);
      //extracting currently checked list length
      const currentlyLoadedList = await page.$$eval(
        listSelector,
        lists => lists.length,
      );
      console.log(
        `currentlyLoadedList`,
        currentlyLoadedList,
        `getFollowCount`,
        getFollowCount,
      );
      try {
        if (currentlyLoadedList <= getFollowCount) {
          // how many following still in left?
          await page.waitForSelector(
            `body > div> div > div> ul > div > li:nth-child(${l * multiply})`,
          );
          // can get timeout error
          await page.$eval(
            `body > div> div > div> ul > div > li:nth-child(${l * multiply}) `,
            (list, err) => {
              list.scrollIntoView({block: 'end', inline: 'nearest'});
            },
          );
        } else {
          console.log(`scrolling loop will break`);

          break;
        }
      } catch (e) {
        if (e.message.includes('timeout')) {
          // scrolled following list should be inserted into D
          console.log(
            `break this loop, would try to insert scrolled following lists`,
          );
          break;
        }
      }
    }

    //extracting followinglist to array
    var followingList = await page.$$(`body > div> div > div> ul > div > li`);
    console.log(`followinList`, followingList);
    for (var list of followingList) {
      var userId = JSON.stringify(
        await (await list.getProperty('innerText')).jsonValue(),
      )
        .split(/\\n/g)[0]
        .replace(/"/g, '');

      var userName = JSON.stringify(
        await (await list.getProperty('innerText')).jsonValue(),
      )
        .split(/\\n/g)[1]
        .trim();


      var userProfileImg = await list.evaluate(node => {
        return node.lastChild.childNodes[0].children[0].children[1].children[0]
          .src;
      });


      console.log(
        `userId :`,
        userId,
        `\n userName :`,
        userName,
        `\n userProfileImg : `,
        userProfileImg,
      );
      var arrayChunk = [];
      arrayChunk.push({
        userId: userId,
        userName: userName,
        userProfileImg: userProfileImg,
      });

      return arrayChunk;
    }
    console.log(arrayChunk); // it doesn't matter with here
    if ((arrayChunk = !(null || undefined))) {
      return arrayChunk;
    } else {
      console.log(`scrapping chunk didn't work!`);
    }
    console.log(
      `did this chunk alreaady inserted into an array?`,
      followingList.length,
    );
    // if following list put into array succesfully, put them into db
    if (followingList.length > 0) {
      console.log(`how many followings scrapped?`, followingList.length);
      for (var person of followingList) {
        // console.log('person?', person);
        client
          .query(
            `INSERT INTO insta_fans(user_name, user_insta_id, profile_photo) VALUES ('${person.userName}','${person.userId}','${person.userProfileImg}')`,
          )
          .then(res => console.log(res.row[0]))
          .catch(e => e.stack);
      }
    }

    // get List of Following to get the length and making it looping
    await page.waitForSelector(`body > div > div > div > ul > div > li`);
  } catch (e) {
    console.log(e);
  }

  // click follower
  await page.waitForSelector(
    `body > div> div > div> ul > div > li:nth-child(1) > div > div> div > div > div > a`,
  );
  await page.click(
    `body > div > div > div> ul > div > li:nth-child(1) > div > div> div > div > div > a`,
  );
  console.log(`following profile opened up!`);

  //click follower list to check myself on his list
  await page.waitForSelector(
    `#react-root > section > main > div > header > section > ul > li:nth-child(2) > a`,
  );
  await page.click(
    `#react-root > section > main > div > header > section > ul > li:nth-child(2) > a`,
  );
  console.log(`follower's following list opened`);

  // find 6catmom.zena from following list's innerText
  await page.waitForSelector(`body > div> div > div> ul > div`);

  var isThereMyId = await page.$eval(`body > div > div > div> ul > div`, e =>
    e.innerText.includes(`6catmom.zena`),
  );
  console.log(`[Does he follow me back?]`, isThereMyId);

  if (isThereMyId) {
    await page.goto(`https://instagram.com/6catmom.zena`);
  } else {
    console.log(`should be unfollowed`);
  }
})();
