
const puppeteer = require('puppeteer-core');
const { EXECUTABLE_PATH, PAGE_URL } = require('./constants');
const { devices } = require('puppeteer-core');
const { tests, mobileTests }  = require('./tests');
const { TestSet } = require("./testResult");

(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: EXECUTABLE_PATH,
        defaultViewport:{
            width: 1200,
            height: 800,
            isMobile: false,
        },
    });

    const page = await browser.newPage()
    
    // const input = await page.$("input")
    

    await page.goto(PAGE_URL, {waitUntil: "networkidle2", timeout: 0})
    
    var testSet = new TestSet()

    for (let i = 0; i < tests.length; i++) {
        const result = await tests[i](page)
        if(result)
            testSet.addResult( result) 
    }

    await browser.close()

    
    const mobileBrowser = await puppeteer.launch({
        headless: false,
        executablePath: EXECUTABLE_PATH
    });

    const mobilePage = await mobileBrowser.newPage()
    await mobilePage.emulate(devices["iPhone X"])
    await mobilePage.goto(PAGE_URL, {waitUntil: "networkidle2", timeout: 0})

    for (let i = 0; i < mobileTests.length; i++) {
        const result = await mobileTests[i](mobilePage)
        if(result)
            testSet.addResult( result )
    }

    await mobileBrowser.close()

    testSet.printToConsole()

})();
