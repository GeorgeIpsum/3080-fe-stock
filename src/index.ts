import twilio from 'twilio';
import sendgrid from '@sendgrid/mail';
import puppeteer from 'puppeteer';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? '';
sendgrid.setApiKey(SENDGRID_API_KEY);

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const SKU = '6429440';
const BEST_BUY_LINK = 'https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440';

const sendTwilioMessage = async (body: string) => {
  try {
    const msg = await twilioClient.messages.create({
      to: process.env.TO_NUMBER ?? '',
      from: process.env.FROM_NUMBER,
      body
    });
    return msg;
  } catch (e) {
    return e;
  }
}

const sendSGMessage = async (body: string) => {
  try {
    const msg = await sendgrid.send({
      to: process.env.TO_EMAIL ?? '',
      from: process.env.FROM_EMAIL ?? '',
      subject: body,
      text: body
    });
    return msg;
  } catch (e) {
    return e;
  }
}

const sendMessage = async (body: string) => {
  return Promise.all([sendTwilioMessage(body), sendSGMessage(body)]);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loop = async (counter: number) => {
  if (counter === 0) {
    await sendMessage("TESTING MESSAGING");
  }
  try {
    console.info(counter, 'LAUNCHING BROWSER');
    const browser = await puppeteer.launch({ headless: false, devtools: true, defaultViewport: { width: 900, height: 900 } });
    const page = await browser.newPage();
    console.info(counter, 'NAVIGATING TO PAGE');
    await page.goto(BEST_BUY_LINK);
    console.log(counter, 'NOW AT PAGE');
    await sleep(5000);
    await page.$$eval('[data-sku-id]', buttons => {
      if (buttons && buttons.length === 1) {
        const checkoutButton = buttons[0];
        if (checkoutButton.innerHTML === 'Sold Out') {
          console.info("NOT IN STOCK");
        } else {
          sendMessage(`GO GO GO GO GO GO: ${BEST_BUY_LINK}`);
        }
      } else {
        console.warn("MORE THAN ONE CHECKOUT BUTTON?")
      }
      return buttons;
    });
    await sleep(3000);
    console.info(counter, "PAGE ACTIONS FINISHED");
    await browser.close();
    console.info(counter, "BROWSER CLOSED");
  } catch (e) {
    console.warn(e);
  }
  return;
}

const TIMEOUT_LENGTH_IN_SECONDS = 20;

let counter = 0;
const main = async () => {
  try {
    await loop(counter);
    console.info(counter, `WAITING ${ TIMEOUT_LENGTH_IN_SECONDS } SECONDS FOR NEXT LAUNCH`);
    counter++;
    if (counter % 30 === 0) {
      await sendMessage("STATUS UPDATE: YOU STILL PROLLY GOT NOTHING. SORRY FRIEND.");
    }
    setTimeout(main, TIMEOUT_LENGTH_IN_SECONDS * 1000);
  } catch (e) {
    console.warn(e);
  }
}

main();
