import {WebSocket} from 'ws';
import {EventEmitter} from 'events';
import {OmegaRequestPacket, OmegaResponsePacket} from './omega_packet';
import log4js from 'log4js';
import {Player} from "./player";

const pkg = require('../package.json');
const DEFAULT_WS_URL: string = 'ws://localhost:24011/omega_side';

/** 一个客户端 */
export class OmegaClient extends EventEmitter {
    /** 机器人的昵称
     * @readonly
     */
    get bot_name() {
        return this.#bot_name;
    }

    #bot_name: String = 'Unknown'

    /** 是否已连接
     * @readonly
     */
    get connected() {
        return this.#connected;
    }

    #connected: Boolean = false
    /** 连接 Omega WebSocket 的实例
     * @private
     */
    #wsClient: WebSocket
    /** 日志记录器
     * @private
     */
    #logger: log4js.Logger = log4js.getLogger('[LightOmega]')

    constructor(host: string, level: logLevel = 'mark') {
        super();
        this.#wsClient = new WebSocket(host);
        /** 注册&处理ws client的事件 */
        this.#wsClient.on('open', async () => {
            this.#connected = true;
            // 处理omega的包
            this.#wsClient.on('message', (message) => {
                const obj_message = JSON.parse(message.toString('utf-8'));
                /** omega 响应数据包 */
                if (obj_message.client !== 0) {
                    /** 发送的数据包有问题 */
                    if (obj_message.violate) {
                        throw Error(JSON.stringify(obj_message))
                    }
                    this.emit('omega.response', obj_message);
                    return;
                }
                /** omega 主动推送数据包 */
                switch (obj_message.type) {
                    /** sub: 玩家登录 */
                    case 'playerLogin':
                        this.emit('omega.playerLogin', obj_message);
                        break;
                    /** sub: 玩家登出 */
                    case 'playerLogout':
                        this.emit('omega.playerLogout', obj_message);
                        break;
                    /** sub: 菜单选项被触发 */
                    case 'menuTriggered':
                        this.emit('omega.menuTriggered', obj_message);
                        break;
                    /** sub: 接收到订阅的数据包 */
                    case 'mcPkt':
                        this.emit('omega.mcPkt', obj_message);
                        break;
                    /** sub: 方块更新 */
                    case 'blockUpdate':
                        this.emit('omega.blockUpdate', obj_message);
                        break;
                    /** 通用 */
                    default:
                        this.emit('omega.push', obj_message);
                        break;
                }
            });

            /** 获取自己（机器人）的昵称 */
            const get_name_packet = await this.execCmd('tell @s @s');
            this.#bot_name = get_name_packet.data.result.OutputMessages[0].Parameters[0];

            /** 初始化logger */
            this.#logger = log4js.getLogger(`[LightOmega:${this.#bot_name}]`);
            this.#logger.level = level;
            this.#logger.mark('┌────────────────────────────────────────────────────────────────┐');
            this.#logger.mark(`| version: ${pkg.version} (publish on ${pkg.publish_time})                          |`);
            this.#logger.mark('| changelog: https://github.com/CodePwn2021/light-omega/releases |');
            this.#logger.mark('└────────────────────────────────────────────────────────────────┘');

            /** 注册必要的监听 */
            await registerPushPacket(this);

            /** 准备就绪 */
            this.emit('omega.ready');
        });
        /** 错误提示 */
        this.#wsClient.on('error', (err) => {
            this.#logger.error('WebSocket ERROR!!', err);
        });
    }

    /** 发包编号
     * @private
     */
    #packetCount: number = 0

    /**
     * 发送一个数据包
     * @function sendPacket
     * @param {string} func 请求的数据类型（也可理解成函数名）
     * @param {any} param 参数
     * @returns
     */
    async sendPacket(func: packetFuncName, param: any): Promise<OmegaResponsePacket> {
        if (!this.#connected) throw Error('WebSocket not connected!!!\nPlease use sendPacket() in client.on("omega.ready") !!!');
        if (this.#packetCount === 24011 || this.#packetCount === 0) {
            this.#packetCount = 1;
        } else {
            this.#packetCount++;
        }

        const packet: OmegaRequestPacket = {
            client: this.#packetCount,
            'function': func,
            args: param
        };

        this.#wsClient.send(JSON.stringify(packet), (err) => {
            if (err) {
                console.error(err);
            }
        });
        return new Promise((resolve) => {
            this.once('omega.response', (res: OmegaResponsePacket) => {
                resolve(res);
            });
        });
    }

    /**
     * 执行一个命令
     * @function execCmd
     * @description 请不要用于执行没有返回值的命令，比如 "say"，否则会导致函数流程卡住
     * @param {string} cmd 命令
     * @param {boolean} isWebSocket (可选) 是否以游戏内 WebSocket 的身份执行
     * @returns {OmegaResponsePacket}
     * @see execWriteOnlyCmd
     */
    async execCmd(cmd: string, isWebSocket: boolean = false): Promise<OmegaResponsePacket> {
        return await this.sendPacket(isWebSocket ? 'send_ws_cmd' : 'send_player_cmd', {
            cmd
        });
    }

    /**
     * 执行一个 setting 命令
     * @function execWriteOnlyCmd
     * @description 通常以此方式执行的命令可能会无效，但是可用于执行一个永远没有返回值的命令，比如 "say"
     * @param {string} cmd 命令
     * @returns {void}
     * @see execCmd
     */
    async execWriteOnlyCmd(cmd: string): Promise<void> {
        await this.sendPacket('send_wo_cmd', {
            cmd
        });
        return;
    }

    /**
     * 使用玩家昵称获取一个玩家对象
     * @function getPlayerByName
     * @param {string} playerName 玩家昵称
     * @returns {Player}
     */
    async getPlayerByName(playerName: string): Promise<Player> {
        const playerListPacket = await this.sendPacket('get_players_list', {});
        let targetIndex: number = 0;
        const isPlayerExists: boolean = playerListPacket.data.some((value: any, index: number) => {
            targetIndex = index;
            return playerName === value.name;
        });
        if (isPlayerExists) {
            return new Player(this, playerListPacket.data[targetIndex]);
        }
        throw Error('Player NOT exists!!!');
    }

    /**
     * 使用UUID获取一个玩家对象
     * @function getPlayerByUUID
     * @param {string} UUID 玩家UUID
     * @returns {Player}
     */
    async getPlayerByUUID(UUID: string): Promise<Player> {
        const playerListPacket = await this.sendPacket('get_players_list', {});
        let targetIndex: number = 0;
        const isPlayerExists: boolean = playerListPacket.data.some((value: any, index: number) => {
            targetIndex = index;
            return UUID === value.uuid;
        });
        if (isPlayerExists) {
            return new Player(this, playerListPacket.data[targetIndex]);
        }
        throw Error('Player NOT exists!!!');
    }

    /**
     * 发送QQ信息（会调用群服互通，若未开启群服互通则会导致不可预料的异常）
     * @function sendQQMsg
     * @param {string} msg 要发送的信息
     * @returns {void}
     */
    async sendQQMsg(msg: string): Promise<void> {
        await this.sendPacket('send_qq_msg', {
            msg
        });
        return;
    }

    /**
     * 注册一个菜单
     * @function registerMenu
     * @param {string[]} triggers
     * @param {string} argument_hint
     * @param {string} usage
     * @param {string} sub_id
     */
    async registerMenu(triggers: string[], argument_hint: string, usage: string, sub_id: string): Promise<void> {
        await this.sendPacket('reg_menu', {
            triggers,
            argument_hint,
            usage,
            sub_id
        });
        return;
    }
}

/**
 * 注册必要的推送数据包
 * @function registerPushPacket
 * @param {OmegaClient} client 客户端
 * @returns {void}
 */
async function registerPushPacket(client: OmegaClient): Promise<void> {
    await client.sendPacket('reg_login', {});
    await client.sendPacket('reg_logout', {});
    return;
}

/**
 * 创建一个客户端
 * @function createClient
 * @param {string} host (可选) 自定义连接的ip/域名和端口
 * @param {logLevel} level (可选) 日志等级，参考log4js
 * @returns {OmegaClient}
 */
export function createClient(host?: string, level?: logLevel): OmegaClient {
    let _host;
    if (host) {
        _host = `ws://${host}/omega_side`;
    } else {
        _host = DEFAULT_WS_URL;
    }
    return new OmegaClient(_host, level);
}

// define

/** 日志等级 */
export type logLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off'

/** 数据包func名称 */
export type packetFuncName =
    'echo'
    | 'regMCPKt'
    | 'reg_mc_packet'
    | 'query_packet_name'
    | 'send_ws_cmd'
    | 'send_player_cmd'
    | 'send_wo_cmd'
    | 'send_fb_cmd'
    | 'get_uqholder'
    | 'get_players_list'
    | 'reg_menu'
    | 'player.next_input'
    | 'player.say_to'
    | 'player.title_to'
    | 'player.subtitle_to'
    | 'player.actionbar_to'
    | 'player.pos'
    | 'player.set_data'
    | 'player.get_data'
    | 'reg_login'
    | 'reg_logout'
    | 'reg_block_update'
    | 'query_item_mapping'
    | 'query_block_mapping'
    | 'query_memory_scoreboard'
    | 'send_qq_msg'
    | 'data.get_root_dir'

/** 可订阅事件 */
export type clientEvents =
    'omega.response'
    | 'omega.push'
    | 'omega.playerLogin'
    | 'omega.playerLogout'
    | 'omega.menuTriggered'
    | 'omega.mcPkt'
    | 'omega.blockUpdate'
