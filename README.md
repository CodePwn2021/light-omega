# Light Omega
[![npm version](https://img.shields.io/npm/v/light-omega/latest.svg)](https://www.npmjs.com/package/light-omega)
[![dm](https://shields.io/npm/dm/light-omega)](https://www.npmjs.com/package/light-omega)
[![node engine](https://img.shields.io/node/v/light-omega/latest.svg)](https://nodejs.org)
## Install:
```bash
> npm i light-omega # yarn add light-omega
```
## Example
```js
const { createClient } = require('light-omega');

// client的大部分函数需要在ready事件之后才能执行
omg.on('omega.ready', onReady);

async function onReady() {
    // 在这里随便干点什么
    const res = await omg.sendPacket('get_players_list', {});
    console.log(JSON.stringify(res));
    const player = await omg.getPlayer(omg.bot_name);
    console.log(player);
    const echo = await omg.sendPacket('echo', {
        message: 'hello, light-omega!'
    });
    console.log(echo);
}
```
## Docs
coming soon...
## Chat
[![group:766363535](https://img.shields.io/badge/group-766363535-blue)](https://qm.qq.com/cgi-bin/qm/qr?k=Lq7eF60RsxhVPWCKvlSWWuimHR4bHHz-)
