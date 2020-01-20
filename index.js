const puppeteer = require('puppeteer');
const {Client} = require('pg');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['start-fullscreen', '--no-sandbox', '--disable-setuid-sandbox'],
    userDataDir: './zena',
    devtools: true,
    slowMo: 250,
  });

  const page = await browser.newPage();
  //init
  const id = '6catmom.zena';
  const pw = '2djr$$$';
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
    .catch(e => console.log(e))
    .finally(() => client.end());

  await page.goto(
    'https://www.instagram.com/accounts/login/?source=auth_switcher',
    {
      waitUntil: ['networkidle2'],
    },
  );
  console.log('puppeteer launch');
  /// login proc for no cookie mode

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

    //fully scroll down until the last following person
    const multiply = 12;
    for (var l = 1; l < shouldBeLooping; l++) {
     
	    console.log(`${l}th of loop`);
      await page.waitForSelector(
        `body > div> div > div> ul > div > li:nth-child(${l})`,
      );
      await page.$eval(
        `body > div> div > div> ul > div > li:nth-child(${l}) `,
        list => {
          console.log(list);
          list.scrollIntoView({block: 'end', inline: 'nearest'});
        },
      );
    }

    // get List of Following to get the length and making it looping
    await page.waitForSelector(`body > div > div > div > ul > div > li`);
    var followingList = await page.$$(
      `body > div> div > div> ul > div > li`,
      e => console.log(e),
    );
    console.log(`[Following list length] ${followingList.length} `);
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

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
})();

//
//
//
//
//
//
//
//
//
//
//
//
//
//	for extracting username and id during loop
//
//	//          const userInfo = e
//            .querySelector(`body > div> div > div > ul > div > li > div`)
//            .innerText.split(/\n/g);
//
//          console.log(`is E cannot captured?`, e);
//          const profilePhoto = e.querySelector(
//            `body > div > div > div > ul > div > li:nth-child(1) > div > div > div > a > img`,
//          ).src;
//          console.log(
//            `ID : `,
//            userInfo[0] + `\n`,
//            `NAME :`,
//            userInfo[1] + `\n`,
//            `IMG : `,
//            profilePhoto,
//          );
//
// add user Insta ID, Name, Picture into Postgre DB
//            client
//              .connect()
//              .then(e => console.log(e, `db connected to insert user info`))
//              .query(
//                `INSERT INTO insta_fans (user_name, user_id, profile_photo )
//			   VALUES('${userInfo[1]}','${userInfo[0]}','${profilePhoto}')`,
//              )
//              .then(results => console.table(results.rows))
//              .catch(e => console.log(e))
//              .finally(() => client.end());
//
//
//
//
//	 var followingUser =  e.querySelector(`body > div > div > div> ul > div > li > div`).innerText;
//	var userInfo = followingUser.split(/\n/g);
//var userId = userInfo[0];
//var userName = userInfo[1];
//
//console.log(`userId : `, userId, `\n`, `userName :`, userName);
