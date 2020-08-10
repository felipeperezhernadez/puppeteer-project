const { PAGE_URL } = require("./constants")
const { devices } = require("puppeteer-core")
const { OK, ERROR, WARNING, TestResult } = require("./testResult")

const tests = [
    async page => {
        try{
            await page.waitForSelector(".flex.justify-center.max-w-full.FareMonthlyHistogram.py-1")
            return new TestResult("SKELETON_VIEW" ,"OK", "Skeleton view load", "The skeleton view appears when page is loaded")
        }
        catch{
            new TestResult("SKELETON_VIEW" ,"ERROR", "Skeleton view load", "The skeleton view doesn't appear when page is loaded")
        }
    },
    async page => {
        try{
            await page.evaluate(() => window.scroll(0, 1000))
            var histogram = false
            page.on('request', req => {

                if(!histogram && req.url().endsWith('histogram')){
                    histogram = true

                    if(!req.postData()){
                        histogram = false
                        return
                    }

                    const dateRange = JSON.parse(req.postData()).dateRange

                    const startDate = new Date(dateRange.start)
                    const endDate = new Date(dateRange.end)

                    var date = new Date()
                    date.setDate(date.getDate() + 1)

                    if(date.toDateString() !== startDate.toDateString()){
                        histogram = false
                        return
                    }

                    date.setDate(date.getDate() + 34)

                    if(date.toDateString() !== endDate.toDateString()){
                        histogram = false
                        return
                    }

                    return new TestResult("HIST_REQ",OK, "Histogram request", "Histogram request date range match with dates in page")
                }
            })
        }
        catch{
            return new TestResult("HIST_REQ",ERROR, "Histogram request", "Histogram not found or doesn't have correct data")
        }
    },
   async page => {
        
        try{
            // await page.evaluate(() => window.scroll(0, 1000))
            await page.waitForSelector('.fare-container-title')
            return new TestResult("HEADING", OK, "Heading", "The heading is present")
        }
        catch{
            return new TestResult("HEADING", ERROR, "Heading", "The heading isn't present")

        }
    },

    async page => {

        try{
            // await page.evaluate(() => window.scroll(0, 1000))
            await page.waitForSelector('.histo-base')
            const module = await page.$('.histo-base')
            const selects = await module.$$('.select-destination')

            if(selects.length !== 2)
                return new TestResult("SELECTS", ERROR, "Selects in module" ,'There are not two select controls in the histogram module')
            
            await page.waitFor(1000) // sometimes the second select hasn't loaded its content
            
            const from = (await page.evaluate(elm => elm.options[elm.selectedIndex].text, selects[0])).substr(4).toLowerCase()
            const to = (await page.evaluate(elm => elm.options[elm.selectedIndex].text, selects[1])).substr(4).toLowerCase()
            
            const pageUrl = await page.evaluate(() => window.location.pathname)

            if(pageUrl.search(from) !== -1 && pageUrl.search(to) !== -1)
                return new TestResult("SELECTS", OK, "Selects in module", 'There are two selects and their content match the context of the page');
            return new TestResult("SELECTS", ERROR, "Selects in module" ,'The content of selects do not match the context of the page');
            
        }
        catch{
            return new TestResult("SELECTS", ERROR, "Selects in module", "Unspecified error")
        }
    },

    async page => {

        try{
            await page.waitForSelector('.histo-base')
            const container = await page.$(".histo-base")

            const pricesBefore = await container.$$(".fare-atom-price-total-price")
            const fromSelect = await page.$('.histo-base select')
            const from = (await page.evaluate(elm => elm.options[elm.selectedIndex].text, fromSelect)).substr(0, 3)
            const opts = await fromSelect.$$('option')
            
            const val = await page.evaluate(opt => opt.value, opts[Math.floor(Math.random() * opts.length)])
            await page.select('.histo-base select', val)
            await page.waitFor(3000);
            const pricesAfter = await container.$$('.fare-atom-price-total-price')

            if(pricesBefore.length > 0 && pricesAfter.length > 0){

                let changed = false
                for (let i = 0; i < pricesBefore.length; i++) {
                    const beforeVal = await page.evaluate(elm => elm.textContent, pricesBefore[i])
                    const afterVal = await page.evaluate(elm => elm.textContent, pricesAfter[i])

                    if(beforeVal !== afterVal){
                        changed = true;
                        break;
                    }
                }

                if(!changed)
                    return new TestError("ORIGIN_CHG", ERROR, "Changing origin airport", "There were no changes in fares when the origin was changed")
                return new TestError("ORIGIN_CHG", OK, "Changing origin airport","Fares were updated when origin changed")
            }
            await page.select('.histo-base select', from)
            return new TestError("ORIGIN_CHG",OK,"Changing origin airport", "Fares were updated when origin changed")
            
        }
        catch(e){
            return new TestResult("ORIGIN_CHG", ERROR, "Changing origin airport", "Unspecified error")
        }
    },

    async page => {

        try{
            await page.waitForSelector(".slick-track")

            const cards = await page.$$(".slick-slide.slick-active")

            if(cards.length !== 3)
                return new TestResult("CAROUSEL", ERROR, "Carousel checking", "There are not three cards in the carousel");
            else{
                var date = new Date();
                date.setDate(new Date().getDate() + 1)
                const month = date.toDateString().split(" ")[1].toLowerCase()
                const cardMonth = await cards[0].$(".top-section span")
                const cardMonthStr = (await page.evaluate(el => el.textContent, cardMonth)).toLowerCase().substr(0, 3)

                if(month !== cardMonthStr)
                    return new TestResult("CAROUSEL",  ERROR, "Carousel checking", "Months in carousel are displayed wrongly")
                else
                    return new TestResult("CAROUSEL", OK, "Carousel checking", "The carousel is displayed correctly");
            }
        }
        catch(e){
            return new TestResult("CAROUSEL", ERROR, "Carousel checking", "Unspecified error")
        }
    },

    async page => {

        try{
            await page.waitForSelector(".slick-track")
            const card = await page.$(".slick-slide.slick-active.price")

            const topSect = await card.$$(".top-section span")

            if(topSect.length !== 2)
                return new TestResult("CARD_DISPL", ERROR, "Cards", "Month and Year are not displaying correctly")

            const month = topSect[0];
            const year = topSect[1];

            const middleSection = await card.$(".middle-section .origin-container")

            const label = await middleSection.$("span")
            const currency = await middleSection.$(".fare-atom-price-currency")
            const total = await middleSection.$(".fare-atom-price-total-price")
            const star = await middleSection.$(".fare-atom-price-disclaimer-indicator")

            if(month && year && label && currency && total && star)
                return new TestResult( "CARD_DISPL", OK, "Cards", "All elements in cards are displayed");

            return new TestResult("CARD_DISPL", ERROR, "Cards", "Some elements are not displaying in carousel cards");
        }
        catch(e){
            return new TestResult("CARD_DISPL", ERROR, "Cards", "Unspecified error")
        }


    },

    async page => {
        try{
            await page.waitForSelector(".slick-track")
            const cards = await page.$$(".slick-slide.slick-active")

            await cards[1].click();

            const cardMonth = await cards[1].$(".top-section span")
            const cardMonthStr = (await page.evaluate(el => el.textContent, cardMonth)).toLowerCase().substr(0, 3) 

            await page.waitFor(1000);

            const chartMonth = await page.$('.chart-bar div div')
            const charMonthStr = (await page.evaluate(el => el.textContent, chartMonth)).toLowerCase()

            if(charMonthStr !== cardMonthStr)
                return new TestResult("CAR_MONTH" ,ERROR, "Update month", "The month in the chart do not match with the card selected in the carousel");

            return new TestResult("CAR_MONTH" ,OK, "Update month", "Month in the carousel updated correctly when selected another card");
            
        }
        catch(e){
            return new TestResult("CAR_MONTH" ,ERROR, "Update month", "Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector("button.slick-arrow.slick-next")

            const cards = await page.$$(".slick-slide")

            var date = new Date()
            date.setDate(new Date().getDate() + 1)
            date.setMonth(date.getMonth() + 3)
            const nextMonth = date.toDateString().split(" ")[1].toLowerCase()
             
            const nextCardMonth = await cards[3].$(".top-section span")
            const nextCardMonthStr = (await page.evaluate(el => el.textContent, nextCardMonth)).toLowerCase().substr(0, 3)
            
            await page.click("button.slick-arrow.slick-next")

            await page.waitFor(2000)

            if(nextMonth !== nextCardMonthStr)
                return new TestResult("ARROW_CLICK" ,ERROR, "Next three cards" ,"The month of next three cards are not correct");

            const chartMonth = await page.$('.chart-bar div div')
            const charMonthStr = (await page.evaluate(el => el.textContent, chartMonth)).toLowerCase()

            if(nextMonth !== charMonthStr)
                return new TestResult("ARROW_CLICK" ,ERROR, "Next three cards" ,"The month of the chart did not update correctly when the carousel were scrolled");

            return new TestResult("ARROW_CLICK" ,OK, "Next three cards" ,"Month updated successfully")


        }
        catch(e){
            return new TestResult("ARROW_CLICK" ,ERROR, "Next three cards" , "Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector("button.slick-arrow.slick-next")
            
            const emptyFare = await page.$(".is-empty-fare")

            if(emptyFare === null)
                return new TestResult("CHK_AVAILAB", WARNING, "Check availability" ,"There is no empty fare card in carousel");

            const checkAv = emptyFare.$(".link-check-availability")

            if(checkAv === null)
                return new TestResult("CHK_AVAILAB", ERROR, "Check availability" ,"There is an empty fare without the check availability link");

            return new TestResult("CHK_AVAILAB", OK, "Check availability" ,"Empty fare has check availability link")


        }
        catch(e){
            return new TestResult("CHK_AVAILAB", ERROR, "Check availability" ,"Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector(".chart-bar")
            
            const chartBars = await page.$$(".chart-bars")

            const chartMonth = await page.$('.chart-bar div div')

            if(!chartMonth)
                return new TestResult("CHART_DISPL" ,ERROR, "Chart display" ,"The month is not displayed in the chart");

            for (let i = 0; i < chartBars.length; i++) {
                const legend = chartBars[i].$$(".chart-legend span")
                if(legend.length !== 2)
                    return new TestResult("CHART_DISPL" ,ERROR, "Chart display" ,"The day of the month and the day of the week are not displayed correctly in the chart");
            }

            return new TestResult("CHART_DISPL" ,OK, "Chart display" ,"Chart is displayed correctly");
        }
        catch(e){
            return new TestResult("CHART_DISPL" ,ERROR, "Chart display" , "Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector(".chart-container")
            
            const container = await page.$(".chart-container")

            const pricesElms = await container.$$(".fare-atom-price-total-price")

            var prices = []
            for (let i = 0; i < pricesElms.length; i++) {
                prices.push(await page.evaluate(elm => elm.textContent, pricesElms[i]));
            }

            var min = 'zzzzzzzzzzzzzzzzzzzzz'

            prices.forEach(el => {
                if(el.length < min.length) min = el
                else if(el.length === min.length && el < min) min = el
            })

            const minBar = await container.$(".color-min")
            const minPrice = await minBar.$(".fare-atom-price-total-price")
            const minPriceStr = await page.evaluate(el => el.textContent, minPrice)


            if(minPriceStr !== min)
                return new TestResult("MIN_PRICE_BAR",ERROR, "Min price bar" ,"The highlighted bar doesn't represent the minimum fare");

            return new TestResult("MIN_PRICE_BAR",OK, "Min price bar" ,"The highlighted bar represents the minimum fare");

        }
        catch(e){
            return new TestResult("MIN_PRICE_BAR",ERROR, "Min price bar" , "Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector(".chart-container")
            
            const container = await page.$(".chart-container")

            const barsElms = await container.$$(".chart-bar button")
            
            var bars = []
            for (let i = 0; i < barsElms.length; i++) {
                const className = (await barsElms[i].getProperty('className'))._remoteObject.value
                
                if(className.search('color-no-value') === -1)
                    bars.push(barsElms[i])
            }

            if(!bars)
                return new TestResult("BAR_HOVER" ,WARNING, "Bar hover pop up" ,"There are no available fares");

            await bars[0].hover()

            await page.waitFor(1000)

            const popUp = (await bars[0].getProperty('className'))._remoteObject.value.search('color-select') !== -1

            if(!popUp)
                return new TestResult("BAR_HOVER",ERROR,"Bar hover pop up", "There is no Pop Up element on chart bar hover")

            const title = await bars[0].$(".title-tooltip-deal")
            const body = await bars[0].$(".body-tooltip-deal")
            const footer = await bars[0].$(".foot-tooltip-deal")
            const arrow = await bars[0].$(".arrow-tooltip")
            
            if(title && body && footer && arrow)
                return new TestResult("BAR_HOVER" ,OK, "Bar hover pop up" ,"The pop up is shown correctly on chart bar hovered");

            return new TestResult("BAR_HOVER" ,ERROR, "Bar hover pop up" ,"The pop up doesn't display correctly when chart bar is hovered")

        }
        catch(e){
            return new TestResult("BAR_HOVER" ,ERROR, "Bar hover pop up" , "Unspecified error")
        }

    },

    async page => {
        try{
            await page.waitForSelector(".chart-container")
            
            const container = await page.$(".chart-container")

            const barsElms = await container.$$(".chart-bar button")
            
            var bars = []
            for (let i = 0; i < barsElms.length; i++) {
                const className = (await barsElms[i].getProperty('className'))._remoteObject.value
                
                if(className.search('color-no-value') === -1)
                    bars.push(barsElms[i])
            }

            if(!bars)
                return new TestResult("CHART_CLK" ,WARNING, "Modal on chart click" ,"There are no available fares");

            await bars[0].click()

            await page.waitFor(1000)

            const popUp = await page.$(".ReactModalPortal")

            if(!popUp)
                return new TestResult("CHART_CLK" ,ERROR, "Modal on chart click" ,"There is no modal element on chart bar click")

            const close = await popUp.$("button.Popup__close-button")
            await close.click()
            await page.waitFor(1000)

            return new TestResult("CHART_CLK" ,OK, "Modal on chart click" ,"The pop up is shown correctly on chart bar hovered");
        }
        catch(e){
            return new TestResult("CHART_CLK" ,ERROR, "Modal on chart click" , "Unspecified error")
        }

    },
    async page => {
        try{
            await page.waitForSelector(".chart-container")
            
            const container = await page.$(".chart-container")

            const barsElms = await container.$$(".chart-bar button")
            
            var bars = []
            for (let i = 0; i < barsElms.length; i++) {
                const className = (await barsElms[i].getProperty('className'))._remoteObject.value
                
                if(className.search('color-no-value') === -1)
                    bars.push(barsElms[i])
            }

            
            if(!bars)
                return new TestResult("CHART_CLK" ,WARNING, "Modal on chart click" ,"There are no available fares");

            await bars[0].click()

            await page.waitFor(1000);

            const popUp = await page.$(".ReactModalPortal")

            if(!popUp)
                return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" ,"There is no modal element on chart bar click")


            const title = await bars[0].$(".title-tooltip-deal")
            const titleTxt = await page.evaluate(elm => elm.textContent, title)

            const origin = titleTxt.split("-")[0].substr(0,3)
            const dest = titleTxt.split("-")[1]

            const body = await bars[0].$(".body-tooltip-deal")

            const dates = await page.evaluate(elm => elm.textContent, body)
            const depDate = dates.split("-")[0].split(" ")
            const retDate = dates.split("-")[1].split(" ")

            await page.waitForSelector(".LocationSelector__single-value")
            // await page.waitFor(10000)
            const locations = await popUp.$$(".LocationSelector__single-value")

            if(locations.length === 0)
                return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" ,"There are no locations in the modal")

            const origin2 = await page.evaluate(elm => elm.textContent, locations[0])
            const dest2 = await page.evaluate(elm => elm.textContent, locations[1]) 

            const depDateElm = await popUp.$("#em__b-UID__booking-popup-departure")
            const retDateElm = await popUp.$("#em__b-UID__booking-popup-return")

            const depDateStr = (await depDateElm.getProperty('value'))._remoteObject.value
            const retDateStr = (await retDateElm.getProperty('value'))._remoteObject.value

            const splDepDate = depDateStr.split("/")
            const splRetDate = retDateStr.split("/")


            if(origin2.search(origin) === -1)
                return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" , "The origin in the modal doesn't match with the origin in the pop up");

            if(dest2.search(dest) === -1)
                return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" ,"The destination in the modal doesn't match with the destination in the pop up");

            if(splDepDate[1] !== depDate[1] ||
                 new Date(2020, parseInt(splDepDate[0]) - 1).toDateString().split(" ")[1] !== depDate[0])
                    
                    return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" ,"The departure date in the modal doesn't match with the departure date in the pop up");

            if(splRetDate[1] !== retDate[2] ||
                new Date(2020, parseInt(splRetDate[0]) - 1).toDateString().split(" ")[1] !== retDate[1])
                   
                   return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page" ,"The return date in the modal doesn't match with the return date in the pop up");

            const close = await popUp.$("button.Popup__close-button")
            await close.click()
            await page.waitFor(1000)
            return new TestResult("MODAL_MATCH" ,OK, "Modal match with page" ,"Modal on bar click behaves as expected");
        }
        catch(e){
            return new TestResult("MODAL_MATCH" ,ERROR, "Modal match with page", "Unspecified error")
        }

    },

    async page => {
        try{ 
            var date = new Date();
            date.setDate(new Date().getDate() + 1)
            const month = date.toDateString().split(" ")[1].toLowerCase()

            const cards = await page.$$(".slick-slide")

            const cardMonth = await cards[0].$(".top-section span")
            const cardMonthStr = (await page.evaluate(el => el.textContent, cardMonth)).toLowerCase().substr(0, 3)

            if(month !== cardMonthStr)
                return new TestResult("CAR_FMONTH" ,ERROR, "Carousel first month" ,"Months in carousel are displayed wrongly")
            else
                return new TestResult("CAR_FMONTH" ,OK, "Carousel first month" ,"The first month in carousel is displayed correctly");
        }
        catch(e){
            return new TestResult("CAR_FMONTH" ,ERROR, "Carousel first month" , "Unspecified error")
        }
    },
    async page => {

        try{ 
            const desktopBars = await page.$$(".chart-bar")
            if(desktopBars.length !== 35){
                return new TestResult("DESKTOP35" ,ERROR, "35 bars in desktop" ,"There aren't 35 chart bars in Desktop view")
                return
            }
            return new TestResult("DESKTOP35" ,OK, "35 bars in desktop" ,"There are 35 chart bars in Desktop view");
        }
        catch(e){
            return new TestResult("DESKTOP35" ,ERROR, "35 bars in desktop" , "Unspecified error")
        }
    },

    async page => {
        try {
            await page.waitForSelector(".chart-container")
            
            const container = await page.$(".chart-container")

            const barsElms = await container.$$(".chart-bar button")
            
            var bars = []
            for (let i = 0; i < barsElms.length; i++) {
                const className = (await barsElms[i].getProperty('className'))._remoteObject.value
                
                if(className.search('color-no-value') === -1)
                    bars.push(barsElms[i])
            }

            if(!bars)
                return new TestResult("LANDING_PG" ,WARNING, "Landing page matching", "There are no available fares");

            
            const title = await bars[0].$(".title-tooltip-deal")
            const titleTxt = await page.evaluate(elm => elm.textContent, title)
            
            const origin = titleTxt.split("-")[0].substr(0,3)
            const dest = titleTxt.split("-")[1].substr(1)
            
            await bars[0].click()
            await page.waitFor(1000);


            const popUp = await page.$(".ReactModalPortal")

            if(!popUp)
                return new TestResult("LANDING_PG" ,ERROR, "Landing page matching","There is no modal element on chart bar click")

            
            await page.waitForSelector(".Booking_submitButton")

            const submit = await popUp.$(".Booking_submitButton")

            submit.click()

            await page.waitForSelector(".originairportcode", {timeout: 0})

            const originElm = await page.$(".originairportcode")
            const destElm = await page.$(".destinationairportcode")

            const originCode = await page.evaluate(el => el.textContent, originElm)
            const destCode = await page.evaluate(el => el.textContent, destElm)

            if(origin !== originCode)
                return new TestResult("LANDING_PG" ,ERROR, "Landing page matching","The origin code in the landing page do not match");

            if(dest !== destCode)
                return new TestResult("LANDING_PG" ,ERROR, "Landing page matching","The destination code in the landing page do not match");

            return new TestResult("LANDING_PG" ,OK, "Landing page matching","Origin and destination in landing page match")

        } catch{
            return new TestResult("LANDING_PG" ,ERROR, "Landing page matching","Unspecified error")
        }
    }
]


const mobileTests = [
    async page => {
        try{
            await page.evaluate(() => window.scroll(0, 1000))
            await page.waitForSelector(".bar-container")

            const mobileBars = await page.$$(".bar-container")
            if(mobileBars.length !== 10){
                return new TestResult("MOBILE10" ,ERROR, "10 bars on mobile" ,"There aren't 10 chart bars in Mobile view")
                return
            }
            
            return new TestResult("MOBILE10" ,OK, "10 bars on mobile" ,"There are 10 chart bars in Mobile view");
        }
        catch(e){
            return new TestResult("MOBILE10" ,ERROR, "10 bars on mobile" ,"Unspecified error")
        }
    },

    async page => {

        try{
            await page.waitForSelector(".chart-container-mobile")
            const container = await page.$(".chart-container-mobile")
            const loadMore = await container.$(".load-more")
            if(!loadMore)
                return new TestResult("LOAD_MORE", ERROR, "Load more on mobile" ,"There is no load more button in mobile view")
            return new TestResult("LOAD_MORE", OK, "Load more on mobile" ,"Found load more button in mobile view");
        }
        catch(e){
            return new TestResult("LOAD_MORE", ERROR, "Load more on mobile" , "Unspecified error")
        }
    },

]

exports.tests = tests
exports.mobileTests = mobileTests
