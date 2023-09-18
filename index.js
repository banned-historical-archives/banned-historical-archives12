const axios =require('axios');
const path = require('path');
const iconv = require('iconv-lite');
const stream = require('stream');
const { promisify } = require('util');
const fs = require('fs-extra');
const jsdom = require("jsdom");
const json5 = require('json5');
const { JSDOM } = jsdom;
require('dotenv').config()

const cookie = process.env.COOKIE;
async function commonRequest(url) {
  while (true) {
    try {
      const res = await axios.request({
        url,
        responseType: 'arraybuffer',
        headers: {
          Host: 'museums.cnd.org',
          'User-Agent':
            'AMD',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://maoistlegacy.de',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': 1,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          DNT: 1,
          'Sec-GPC': 1,
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
          TE: 'trailers',
          Cookie: cookie,
        },
      });
    const gb2312Data = iconv.decode(res.data, 'gb2312');
    const utf8Data = iconv.encode(gb2312Data, 'utf-8').toString();
      return utf8Data;
    } catch (e) {
      console.log('request failed, retry', url);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

    const host = 'http://museums.cnd.org';
    async function download(p) {
    const f_name = path.join(__dirname, 'html' + p);
    // if f_name exists
    if (await fs.pathExists(f_name)) {
        console.log(f_name, 'exists');
        return await fs.readFile(f_name);
    }
    const res = await commonRequest(host+p);
    await fs.ensureDir(path.join(__dirname, 'html' + path.dirname(p)));
    await fs.writeFile(f_name, res);
    return res;
    }
async function dfs(p) {
        const f = await download(p);
        const done_file = path.join(__dirname, 'html' + p + '.done');
        if (await fs.pathExists(done_file)) return;
        try {
            const dom = new JSDOM(f);
            // for each link in this dom
            for (const item of Array.from(dom.window.document.querySelectorAll('a'))) {
                let href = item.href.trim();
                if (item.href.startsWith(host)) {
                } else if (item.href.startsWith('http://') || !/\.html$/.test(item.href.split('#')[0]) || href.startsWith('/HXWZ/')) {
                    console.log('ignore', item.href);
                    continue;
                } else {
                    if (href.startsWith('/')) {
                    href = path.join(host, href)
                    } else {
                    href = path.join(host, path.dirname(p), href)
                    }
                }
                console.log('push', href, (new URL(href).pathname).split('#')[0]);
                await dfs((new URL(href).pathname).split('#')[0]);
            }
        } catch (e) {
            console.log(e);
        }
        await fs.writeFile(done_file, '');
}

(async () => {
    await dfs('/CR/cres.htm')
    await dfs('/CR/feature.htm')
    await dfs('/CR/cdocs.htm')
    await dfs('/CR/chis.htm')
    await dfs('/CR/cperson.htm')
    await dfs('/CR/cdown.htm')
    await dfs('/CR/cecho.htm')
    await dfs('/CR/cwhere.htm')
    await dfs('/CR/clit.htm')
})();
