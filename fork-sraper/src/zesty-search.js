import puppeteer from 'puppeteer';

function sleep(millis = 1000) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

(async () => {

    // ==============================================================================================

    // -- Config -- Feel free to edit the settings below 👍

    const MAX_PRICE = 175_000;

    const SLEEP_TIME = 200;

    const addresses = [
        "330 Broad Street, Eatontown NJ 07724"
    ]

    // ==============================================================================================

    let totalPropertiesScanned = 0;
    const properties = [];

    await Promise.all(addresses.map(async (address, pageIndex) => {

        // Puppeteer setup

        await sleep(pageIndex * SLEEP_TIME)
        
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // await page.goto("https://www.zillow.com/");
        // await page.goto("https://www.zillow.com/homes/for_sale/?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22isMapVisible%22%3Atrue%2C%22mapBounds%22%3A%7B%22west%22%3A-74.12596128625489%2C%22east%22%3A-73.98228071374513%2C%22south%22%3A40.245602221928884%2C%22north%22%3A40.34000607051629%7D%2C%22filterState%22%3A%7B%22sort%22%3A%7B%22value%22%3A%22globalrelevanceex%22%7D%7D%2C%22mapZoom%22%3A13%7D");
        await page.goto("https://www.zillow.com/homes/29-Crescent-PlaceMatawan-NJ-07747_rb/39316411_zpid/");
        await page.setViewport({ width: 1080, height: 1024 });

        // Find home page cells

        // const searchInputSelector = '[placeholder="Enter an address, neighborhood, city, or ZIP code"]';
        // const searchInputSelector = '[placeholder="City, Neighborhood, ZIP, Address"]';
        
        // const searchInputSelector = 'input';
        // await page.waitForSelector(searchInputSelector);
        // await page.type(searchInputSelector, address);
        // await page.keyboard.press('Enter');

        const zestimateSelector = 'span'

        await page.waitForSelector('svg');
        const spans = await page.$$(zestimateSelector);

        console.log('spansFound: ', spans.length)

        for (var i = 0; i < spans.length; i++) {

            const spanText = await (await spans[i].getProperty('textContent')).jsonValue();

            console.log(spanText)

            if (spanText.includes("Zestimate")) {
                console.log('yup!')
                console.log(spanText)
            }

        }

    }));

    console.log('done!')

    //     await page.waitForSelector(searchInputSelector);
    //     const tableCells = await page.$$(tableCellSelector);

    //     let currentProperty = {}

    //     // Loop over main page table cells

    //     for (var i = 0; i < tableCells.length; i++) {

    //       const cellText = await (await tableCells[i].getProperty('textContent')).jsonValue();

    //       if (cellText === 'Details') {

    //         currentProperty = {}

    //         // Read link from "Details" cell

    //         const aLink = await tableCells[i].$eval('a', a => a.getAttribute('href'));

    //         const fullLink = 'https://salesweb.civilview.com' + aLink;

    //         currentProperty.detailsLink = fullLink
    //         currentProperty.categoryLink = pageUrl

    //         // Launch another page and scrape details page

    //         const detailsPage = await browser.newPage();

    //         await detailsPage.goto(fullLink);

    //         await detailsPage.setViewport({ width: 1080, height: 1024 });

    //         const detailsCellSelector = 'td';
    //         await detailsPage.waitForSelector(detailsCellSelector);
    //         const detailsCells = await detailsPage.$$(detailsCellSelector);

    //         // Loop over all table cells, looking for key labels, and then store the value in same row

    //         await Promise.all(detailsCells.map(async (detailCell, detailCellIndex, detailCells) => {

    //           const detailCellText = await (await detailCell.getProperty('textContent')).jsonValue();

    //           if (detailCellText === 'Approx. Judgment' ||
    //             detailCellText === 'Approx. Judgment:' ||
    //             detailCellText === 'Approximate Judgment:') {
    //             const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
    //             currentProperty.approxJudgement = labelNeighborText.trim();
    //           }

    //           if (detailCellText === 'Upset Amount:' ||
    //             detailCellText === 'Approx. Upset*:' ||
    //             detailCellText === 'Good Faith Upset*:') {
    //             const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
    //             currentProperty.upsetPrice = labelNeighborText.trim();
    //           }

    //           if (detailCellText.includes('Sales Date')) {
    //             const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
    //             currentProperty.salesDate = labelNeighborText.trim();
    //           }

    //           if (detailCellText === 'Address:') {

    //             const a = await (await detailCells[detailCellIndex].getProperty('textContent')).jsonValue();
    //             const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
    //             currentProperty.address = labelNeighborText.trim();
    //           }

    //         }))

    //         // Get upset and judgement as numbers, not strings

    //         const upsetStringNoCommas = currentProperty.upsetPrice?.slice(1).replaceAll(",", '');

    //         const upsetFloat = parseFloat(upsetStringNoCommas);
    //         const judgementFloat = parseFloat(currentProperty.approxJudgement?.slice(1).replaceAll(",", ''));

    //         currentProperty.upsetFloat = upsetFloat;
    //         currentProperty.judgementFloat = judgementFloat;

    //         // Push only if less than our max spend

    //         let outEmoji = '💥'

    //         totalPropertiesScanned++;

    //         if (upsetFloat < MAX_PRICE || judgementFloat < MAX_PRICE) {
    //           outEmoji = '✅';
    //           properties.push(currentProperty);
    //         }

    //         console.log(outEmoji + ' ' + currentProperty.address)
    //       }

    //     }

    //     await browser.close();
    //   }))

    //   // Sort properties

    //   properties.sort((a, b) => {

    //     // console.log('comparing ', a)
    //     // console.log('to ', b)

    //     return (a.upsetFloat ? a.upsetFloat : a.judgementFloat) - (b.upsetFloat ? b.upsetFloat : b.judgementFloat)

    //   })


    //   // Writes entire array without cutting off
    //   process.stdout.write(JSON.stringify(properties, null, 2) + '\n');

    //   console.log('Filtered ' + properties.length + " of " + totalPropertiesScanned + "!");
    //   console.log('Max price: ' + MAX_PRICE);

})();