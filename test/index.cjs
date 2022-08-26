async function init() {
    const omgs = await import('../lib/client.js');

    const omg = omgs.createClient();

    omg.on('omega.push', (res) => {
        console.log('OmegaPush', res);
    });
    // register packet
    omg.on('omega.ready', onReady);

    async function onReady() {
        const res = await omg.execCmd('list');
        console.log('Execute Cmd!!!!!', res);
    }
}

init();
