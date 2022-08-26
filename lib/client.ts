import {WebSocket} from 'ws';
import {EventEmitter} from 'events';
import {OmegaRequestPacket, OmegaResponsePacket} from './omega_packet';
import log4js from 'log4js';

const pkg = require('../package.json');
const DEFAULT_WS_URL: string = 'ws://localhost:24011/omega_side';

/** 一个客户端 */
export class OmegaClient extends EventEmitter {
    bot_name: String = 'Unknown'
    private connected: Boolean = false
    private wsClient: WebSocket = new WebSocket(null)
    logger:log4js.Logger = log4js.getLogger('[LightOmega]')

    constructor(host: string, level:LogLevel = 'mark') {
        super();
        this.wsClient = new WebSocket(host);
        /** 注册&处理ws client的事件 */
        this.wsClient.on('open', async () => {
            this.connected = true;
            // 处理omega的包
            this.wsClient.on('message', (message) => {
                const obj_message = JSON.parse(message.toString('utf-8'));
                /** omega 响应数据包 */
                if (obj_message.client !== 0) {
                    /** 发送的数据包有问题 */
                    if(obj_message.violate) {
                        throw Error(JSON.stringify(obj_message))
                    }
                    this.emit('omega.response', obj_message);
                    return;
                }
                /** omega 主动推送数据包 */
                this.packetCount = obj_message.client;
                this.emit('omega.push', obj_message);
            });

            /** 获取自己（机器人）的昵称 */
            const get_name_packet = await this.execCmd('tell @s @s');
            this.bot_name = get_name_packet.data.result.OutputMessages[0].Parameters[0];

            /** 初始化logger */
            this.logger = log4js.getLogger(`[LightOmega:${this.bot_name}]`);
            this.logger.level = level;
            this.logger.mark('┌────────────────────────────────────────────────────────────────┐');
            this.logger.mark(`| version: ${pkg.version} (publish on ${pkg.publish_time})                          |`);
            this.logger.mark('| changelog: https://github.com/CodePwn2021/light-omega/releases |');
            this.logger.mark('└────────────────────────────────────────────────────────────────┘');

            /** 准备就绪 */
            this.emit('omega.ready');
        });
        /** 错误提示 */
        this.wsClient.on('error', (err) => {
            console.error('ERROR !!!!!!!!!!!!!!');
            console.error(err);
            console.error('ERROR !!!!!!!!!!!!!!');
        });
    }

    private packetCount: number = 0

    /**
     * 发送一个数据包
     * @function sendPacket
     * @param {string} func 请求的数据类型（也可理解成函数名）
     * @param {any} param 参数
     */
    async sendPacket(func: string, param: any): Promise<OmegaResponsePacket> {
        if(!this.connected) throw Error('WebSocket not connected!!!\nPlease use sendPacket() in client.on("omega.ready") !!!');
        if(this.packetCount === 24011 || this.packetCount === 0) {
            this.packetCount = 1;
        } else {
            this.packetCount++;
        }

        const packet: OmegaRequestPacket = {
            client: this.packetCount,
            'function': func,
            args: param
        };

        this.wsClient.send(JSON.stringify(packet), (err) => {
            if (err) {
                console.error(err);
            }
        });
        return new Promise((resolve) => {
            this.once('omega.response', (res:OmegaResponsePacket) => {
                resolve(res);
            });
        });
    }

    /**
     * 执行一个命令
     * @function execCmd
     * @param {string} cmd 命令
     * @param {boolean} isWebSocket (可选) 是否以游戏内 WebSocket 的身份执行
     */
    async execCmd(cmd:string, isWebSocket:boolean = false):Promise<OmegaResponsePacket> {
        return await this.sendPacket(isWebSocket?'send_ws_cmd':'send_player_cmd', {
            cmd
        });
    }
}

/**
 * 创建一个客户端
 * @function createClient
 * @param {string} host (可选) 自定义连接的ip/域名和端口
 * @param {LogLevel} level (可选) 日志等级，参考log4js
 */
export function createClient(host?: string, level?: LogLevel) {
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
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off'
