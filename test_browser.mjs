import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        let errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        page.on('pageerror', error => {
            errors.push(error.message);
        });

        await page.goto('http://localhost:5176/novo restaurante comidas da terra', { waitUntil: 'networkidle2', timeout: 10000 });

        if (errors.length > 0) {
            console.log("BROWSER ERRORS:");
            errors.forEach(e => console.log(e));
        } else {
            console.log("NO CONSOLE ERRORS DETECTED");
        }

        await browser.close();
    } catch (err) {
        console.error("Puppeteer Script Error:", err);
    }
})();
