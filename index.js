const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['start-fullscreen', '--no-sandbox', '--disable-setuid-sandbox'],
    userDataDir: './zena',
    devtools: true,
    slowMo: 250,
  });

  const page = await browser.newPage();
  await page.goto(
    'https://www.instagram.com/accounts/login/?source=auth_switcher',
    {
      waitUntil: ['networkidle2'],
    },
  );
  console.log('puppeteer launch');
  /// login proc for no cookie mode
 
 
  //init
  var id = '6catmom.zena';
  var pw = '2djr$$$';
 
 
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
  } catch (e) {
    if (e.message.includes(`not found`)) {
      throw `not found`;
    }
  }
  //click `not now` button for notice alarm

  await page.waitForSelector(
    `body > div > div > div > div > button:nth-child(2)`,
  );
  await page.click(`body > div > div > div > div > button:nth-child(2)`);

  await page.waitForSelector(
    `#react-root > section > nav > div> div > div > div> div > div:nth-child(3) > a`,
  );

  // on profile page -> following page with the small window
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

  //scrolling for all following list scrapping

  try {
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

    for (var l = 0; l < getFollowCount / 12; l++) {
      await page.$$eval(`body > div > div > div> ul > div > li`, list => {
        console.log(`what is in the list? `, list);
        list.forEach(e => e.scrollIntoView({block: 'end', inline: 'end'}));
      });
    }
  } catch (e) {
    console.log(e);
  }

  // get List of Following to get the length and making it looping
  await page.waitForSelector(`body > div > div > div > ul > div > li`);
  var followingList = await page.$$(`body > div> div > div> ul > div > li`, e =>
    console.log(e),
  );
  console.log(`[Following list length] ${followingList.length} `);

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
