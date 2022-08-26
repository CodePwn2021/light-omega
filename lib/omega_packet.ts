/**
 * Omega 主动推送的数据包
 *
 * type 和 sub 共同确定数据包的类型，需要注意。
 *
 * @type OmegaPushPacket
 * @param {number} client 数据包序号，推送的数据包的编号应为0
 * @param {string} type 数据包类型
 * @param {string} sub 数据包类型
 * @param {any} data 实际的数据
 */
export type OmegaPushPacket = {
    client: 0
    type: string
    sub: string
    data: any
}

/**
 * 请求 Omega 的数据包
 * @type OmegaRequestPacket
 * @param {number} client 数据包编号，从1至24011，24011后应该从1重新开始
 * @param {string} function 请求的数据类型
 * @param {any} args 请求的参数
 */
export type OmegaRequestPacket = {
    client: number
    'function': string
    args: any
}

/**
 * Omega 响应请求的数据包
 * @type OmegaResponsePacket
 * @param {number} client 数据包编号，从1至24011，24011后应该从1重新开始
 * @param {boolean} violate 表示请求的数据包是否存在问题
 * @param {any} data 响应的数据
 */
export type OmegaResponsePacket = {
    client: number
    violate: boolean
    data: any
}
