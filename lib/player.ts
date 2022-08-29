import {OmegaClient} from "./client";

export class Player {

    /**
     * 客户端实例
     *
     * 注意：请不要调用此处的客户端
     * @private
     */
    #client: OmegaClient

    name: string = "Unknown"
    uuid: string = "00000000-0000-0000-0000-000000000000"
    uniqueID: number = 0

    constructor(client: OmegaClient, playerInfo: playerInfo) {
        this.#client = client;
        this.name = playerInfo.name;
        Object.freeze(this.name);
        this.uuid = playerInfo.uuid;
        Object.freeze(this.uuid);
        this.uniqueID = playerInfo.uniqueID;
        Object.freeze(this.uniqueID);
    }

    /**
     * 获取玩家的下一句话
     * @param {string} hint 提示语
     * @returns {string}
     */
    async requestNextInput(hint:string):Promise<string> {
        const nextInputPacket = await this.#client.sendPacket('player.next_input', {
            player: this.name,
            hint
        });
        if(nextInputPacket.data.success && nextInputPacket.data.input !== undefined) {
            return nextInputPacket.data.input;
        }
        throw Error(`Cannot get player's next input, Because: ${nextInputPacket.data.err}`);
    }

    /**
     * 向该玩家发送一个信息
     * @function sayTo
     * @param {string} message 信息
     * @returns {void}
     */
    async sayTo(message:string):Promise<void> {
        await this.#client.sendPacket('player.say_to', {
            player: this.name,
            msg: message
        });
        return;
    }

    /**
     * 向该玩家发送一个title信息
     * @function titleTo
     * @param {string} message 信息
     * @returns {void}
     */
    async titleTo(message:string):Promise<void> {
        await this.#client.sendPacket('player.title_to', {
            player: this.name,
            msg: message
        });
        return;
    }

    /**
     * 向该玩家发送一个subtitle信息
     * @function subtitleTo
     * @param {string} message 信息
     * @returns {void}
     */
    async subtitleTo(message:string):Promise<void> {
        await this.#client.sendPacket('player.subtitle_to', {
            player: this.name,
            msg: message
        });
        return;
    }

    /**
     * 向该玩家发送一个actionbar信息
     * @function actionbarTo
     * @param {string} message 信息
     * @returns {void}
     */
    async actionbarTo(message:string):Promise<void> {
        await this.#client.sendPacket('player.actionbar_to', {
            player: this.name,
            msg: message
        });
        return;
    }

    /**
     * 获取玩家当前坐标
     * @param {string} limit 选择器，例如@a[name=[player],tag=abc]
     * @returns {number[]} 坐标数组[x,y,z]
     */
    async getPos(limit:string):Promise<number[]> {
        const playerPosPacket = await this.#client.sendPacket('player.pos', {
            player: this.name,
            limit
        });
        if(playerPosPacket.data.success) {
            return playerPosPacket.data.pos;
        }
        throw Error("Unable to get the player's position, is the player offline/in another dimension???");
    }

    /**
     * 给该玩家设置一个数据
     * @function setData
     * @param {string} key 键
     * @param {any} value 值
     * @returns {void}
     */
    async setData(key:string, value:any):Promise<void> {
        await this.#client.sendPacket('player.set_data', {
            player: this.name,
            entry: key,
            data: value
        });
    }

    /**
     * 通过键来获取该玩家的指定数据
     * @function getData
     * @param {string} key 键
     * @returns {any} 对应数据
     */
    async getData(key:string):Promise<any> {
        const getDataPacket = await this.#client.sendPacket('player.get_data', {
            player: this.name,
            entry: key
        });
        if(getDataPacket.data.found) {
            return getDataPacket.data.data;
        }
        throw Error(`Unable to get the player's data: ${key}`);
    }

    /**
     * 将该玩家踢出
     * @function kick
     * @param {string} reason 理由
     * @returns {void}
     */
    async kick(reason?:string):Promise<void> {
        await this.#client.execCmd(reason?`kick ${this.name} ${reason}`:`kick ${this.name}`);
    }
}

export type playerInfo = {
    name: string,
    runtimeID: number,
    uuid: string,
    uniqueID: number
}
