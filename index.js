"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const node_fetch_1 = __importDefault(require("node-fetch"));
const ws_1 = __importDefault(require("ws"));
const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const guilds = {};
const socket = new ws_1.default("wss://gateway.discord.gg/?v=10&encoding=json");
socket.onmessage = async (message) => {
    const data = JSON.parse(message.data.toString());
    if (data.t === "GUILD_UPDATE") {
        const guild = guilds[data.d.guild_id];
        if ((guild || data.d.vanity_url_code) !== data.d.vanity_url_code) {
            const start = Date.now();
            await (0, node_fetch_1.default)(`https://discord.com/api/v9/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code: guild }),
            }).then(async (res) => {
                const end = Date.now();
                const elapsed = end - start;
                const elapsedSeconds = elapsed / 1000;
                const content = res.ok
                    ? `\`${guild}\`
                    DURUM: \`${res.status}\` SPEED: (\`${elapsedSeconds}\`:MS) @everyone`
                    : `Error getting vanity: \`${guild}\`SPEED: (\`${elapsedSeconds}\`:MS)
                  Status Code: \`${res.status}\` @everyone`;
                await (0, node_fetch_1.default)(`https://canary.discord.com/api/v10/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: content,
                    }),
                });
                return delete guilds[data.d.guild_id];
            });
        }
    }
    else if (data.t === "GUILD_DELETE") {
        const guild = guilds[data.d.id];
        if (guild) {
            await (0, node_fetch_1.default)(`https://discord.com/api/v10/guilds/${config.sniperGuild}/vanity-url`, {
                method: "PATCH",
                headers: {
                    Authorization: config.sniperToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code: guild }),
            }).then(async (res) => {
                const content = res.ok
                    ? `URL : https://discord.gg/${guild} Sniped. *guild_delete* ||@everyone||`
                    : `Error getting vanity: \`${guild}\`
                  discord.gg/${guild}. (\`${data.t}\`)
                  Status Code: \`${res.status}\` @everyone`;
                await (0, node_fetch_1.default)(`https://canary.discord.com/api/v10/channels/${config.infoChannelId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: config.sniperToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: content,
                    }),
                });
                return delete guilds[data.d.id];
            });
        }
    }
    else if (data.t === "READY") {
        for (let guild of data.d.guilds) {
            if (guild.vanity_url_code)
                guilds[guild.id] = guild.vanity_url_code;
        }
        console.log(guilds);
    }
    if (data.op === 10) {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                    token: config.listenerToken,
                    intents: 1 << 0,
                    properties: {
                        os: "macos",
                        browser: "Safari",
                        device: "MacBook Air",
                    },
                },
            }));
            setInterval(() => socket.send(JSON.stringify({ op: 0.002 })), data.d.heartbeat_interval);
        }
    };
    socket.onclose = (event) => {
        console.log(`[error] socket connection closed, reason: ${event.reason}, code: ${event.code}`);
        return process.exit();
    };
