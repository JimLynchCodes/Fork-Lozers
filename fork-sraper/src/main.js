import puppeteer from 'puppeteer';

function sleep(millis = 1000) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

(async () => {

  // ==============================================================================================

  // -- Config -- Feel free to edit the settings below 👍

  const MAX_PRICE = 175_000;
  const MIN_PRICE = 50_000;

  const SORT_BY = 'RESCHEDULES';
  // const SORT_BY = 'PRICE';

  const SLEEP_TIME = 200;

  const pageUrls = [
    'https://salesweb.civilview.com/Sales/SalesSearch?countyId=25',   // Atlantic County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=6',    // Cumberland County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=7',    // Bergen County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=8',    // Monmouth County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=9',    // Morris County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=10',   // Hudson County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=15',   // Union County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=19',   // Gloucester County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=20',   // Salem County, NJ
    // 'https://salesweb.civilview.com/Sales/SalesSearch?countyId=32',   // Hunterdon County, NJ
  ]

  // ==============================================================================================

  let totalPropertiesScanned = 0;
  const properties = [];

  await Promise.all(pageUrls.map(async (pageUrl, pageIndex) => {

    // Puppeteer setup

    await sleep(pageIndex * SLEEP_TIME)

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(pageUrl);
    await page.setViewport({ width: 1080, height: 1024 });

    // Find home page cells

    const tableCellSelector = 'table.table td';
    await page.waitForSelector(tableCellSelector);
    const tableCells = await page.$$(tableCellSelector);

    let currentProperty = {
      rescheduleCount: 0
    }

    // Loop over main page table cells

    for (var i = 0; i < tableCells.length; i++) {

      const cellText = await (await tableCells[i].getProperty('textContent')).jsonValue();

      if (cellText === 'Details') {

        currentProperty = { rescheduleCount: 0 }

        // Read link from "Details" cell

        const aLink = await tableCells[i].$eval('a', a => a.getAttribute('href'));

        const fullLink = 'https://salesweb.civilview.com' + aLink;

        currentProperty.detailsLink = fullLink
        currentProperty.categoryLink = pageUrl

        // Launch another page and scrape details page

        const detailsPage = await browser.newPage();

        await detailsPage.goto(fullLink);

        await detailsPage.setViewport({ width: 1080, height: 1024 });

        const detailsCellSelector = 'td';
        await detailsPage.waitForSelector(detailsCellSelector);
        const detailsCells = await detailsPage.$$(detailsCellSelector);

        // Loop over all table cells, looking for key labels, and then store the value in same row

        await Promise.all(detailsCells.map(async (detailCell, detailCellIndex, detailCells) => {

          const detailCellText = await (await detailCell.getProperty('textContent')).jsonValue();

          if (detailCellText === 'Approx. Judgment' ||
            detailCellText === 'Approx. Judgment:' ||
            detailCellText === 'Approximate Judgment:') {
            const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
            currentProperty.approxJudgement = labelNeighborText.trim();
          }

          if (detailCellText === 'Upset Amount:' ||
            detailCellText === 'Approx. Upset*:' ||
            detailCellText === 'Good Faith Upset*:') {
            const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
            currentProperty.upsetPrice = labelNeighborText.trim();
          }

          if (detailCellText.includes('Sales Date')) {
            const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
            currentProperty.salesDate = labelNeighborText.trim();
          }

          if (detailCellText === 'Address:') {

            const a = await (await detailCells[detailCellIndex].getProperty('textContent')).jsonValue();
            const labelNeighborText = await (await detailCells[detailCellIndex + 1].getProperty('textContent')).jsonValue();
            currentProperty.address = labelNeighborText.trim();
          }

          if (detailCellText.includes('Re-Scheduled') ||
            detailCellText.includes('Adjourned')) {

            if (!currentProperty.rescheduleCount) {
              currentProperty.rescheduleCount = 1;
            } else {
              currentProperty.rescheduleCount++;
            }

          }

        }))

        // Get upset and judgement as numbers, not strings

        const upsetStringNoCommas = currentProperty.upsetPrice?.slice(1).replaceAll(",", '');

        const upsetFloat = parseFloat(upsetStringNoCommas);
        const judgementFloat = parseFloat(currentProperty.approxJudgement?.slice(1).replaceAll(",", ''));

        currentProperty.upsetFloat = upsetFloat;
        currentProperty.judgementFloat = judgementFloat;

        // Push only if less than our max spend

        let outEmoji = '💥'

        totalPropertiesScanned++;

        if ((upsetFloat < MAX_PRICE || judgementFloat < MAX_PRICE) &&
          (upsetFloat > MIN_PRICE || judgementFloat > MIN_PRICE)) {
          outEmoji = '✅';
          properties.push(currentProperty);
        }

        console.log(outEmoji + ' ' + currentProperty.address)
      }

    }

    await browser.close();
  }))

  // Sort properties

  properties.sort((a, b) => {

    if (SORT_BY === 'PRICE') {
      return (a.upsetFloat ? a.upsetFloat : a.judgementFloat) - (b.upsetFloat ? b.upsetFloat : b.judgementFloat)
    }
    else if (SORT_BY === 'RESCHEDULES') {
      return a.rescheduleCount - b.rescheduleCount
    }

  })


  // Writes entire array without cutting off
  process.stdout.write(JSON.stringify(properties, null, 2) + '\n');

  console.log('Filtered ' + properties.length + " of " + totalPropertiesScanned + "!");
  console.log('Max price: ' + MAX_PRICE);
  console.log('Min price: ' + MIN_PRICE);
  console.log('Sorting by: ' + SORT_BY);

})();