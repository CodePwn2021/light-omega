/**
 * 测试用，请勿参照学习
 */
async function init() {
    const omg_client = await import('../lib/client.js');

    const omg = omg_client.createClient();

    omg.on('omega.push', (res) => {
        console.log('OmegaPush', res);
    });
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
}

init();
