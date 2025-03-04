import { iMMCodes } from "../model/mmcodes";
import { iUser } from "../model/user";
import decode from "../utilities/decode";
import kv from "../utilities/kv";
import Safety from "../utilities/safety";

export { };

const express = require("express");
const app = express.Router();
import functions from "../utilities/structs/functions";
const MMCode = require("../model/mmcodes");
const { verifyToken } = require("../tokenManager/tokenVerify");
import qs from "qs";
import error from "../utilities/structs/error";

interface iCodeDocument {
    code_lower: string,
    ip: string,
    region: string,
    playlist: string,
}

let buildUniqueId = {};

app.get("/fortnite/api/matchmaking/session/findPlayer/*", (req, res) => {

    res.status(200).end();
});

app.get("/fortnite/api/game/v2/matchmakingservice/ticket/player/*", verifyToken, async (req, res) => {
    const playerCustomKey = qs.parse(req.query, { ignoreQueryPrefix: true })['player.option.customKey'] as string;
    const bucketId = qs.parse(req.query, { ignoreQueryPrefix: true })['bucketId'];
    if (typeof bucketId !== "string" || bucketId.split(":").length !== 4) {
        return res.status(400).end();
    }
    const region = bucketId.split(":")[2];
    const playlist = bucketId.split(":")[3];

    await kv.set(`playerPlaylist:${req.user.accountId}`, playlist);

    if (typeof playerCustomKey == "string") {

        let codeDocument: iMMCodes = await MMCode.findOne({ code_lower: playerCustomKey?.toLowerCase() });
        if (!codeDocument) {
            return error.createError(
                "errors.com.epicgames.common.matchmaking.code.not_found",
                `The matchmaking code "${playerCustomKey}" was not found`,
                [], 1013, "invalid_code", 404, res
            );
        }

        const kvDocument = JSON.stringify({
            ip: codeDocument.ip,
            port: codeDocument.port,
            playlist: playlist,
        })
        await kv.set(`playerCustomKey:${req.user.accountId}`, kvDocument);
    }
    if (typeof req.query.bucketId !== "string" || req.query.bucketId.split(":").length !== 4) {
        return res.status(400).end();
    }

    buildUniqueId[req.user.accountId] = req.query.bucketId.split(":")[0];

    const matchmakerIP = Safety.env.MATCHMAKER_IP;

    return res.json({
        "serviceUrl": matchmakerIP.includes("ws") || matchmakerIP.includes("wss") ? matchmakerIP : `ws://${matchmakerIP}`,
        "ticketType": "mms-player",
        "payload": "account",
        "signature": `${req.user.matchmakingId} ${playlist}`
    })

});

app.get("/fortnite/api/game/v2/matchmaking/account/:accountId/session/:sessionId", (req, res) => {
    res.json({
        "accountId": req.params.accountId,
        "sessionId": req.params.sessionId,
        "key": "none"
    });
});

app.get("/fortnite/api/matchmaking/session/:sessionId", verifyToken, async (req, res) => {

    const user: iUser = await decode.decodeAuth(req) as iUser;

    const playlist = await kv.get(`playerPlaylist:${req.user.accountId}`);

    let kvDocument = await kv.get(`playerCustomKey:${req.user.accountId}`);
    if (!kvDocument) {
        const gameServers = Safety.env.GAME_SERVERS;
        let selectedServer = gameServers.find(server => server.split(":")[2] === playlist);
        if (!selectedServer) {
            selectedServer = gameServers[Math.floor(Math.random() * gameServers.length)];
        }
        kvDocument = JSON.stringify({
            ip: selectedServer.split(":")[0],
            port: selectedServer.split(":")[1],
            playlist: selectedServer.split(":")[2]
        });
    }

    let codeKV = JSON.parse(kvDocument);

    console.log(codeKV.ip, codeKV.port, codeKV.playlist);

    res.json({
        "id": req.params.sessionId,
        "ownerId": functions.MakeID().replace(/-/ig, "").toUpperCase(),
        "ownerName": "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        "serverName": "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        "serverAddress": codeKV.ip,
        "serverPort": codeKV.port,
        "maxPublicPlayers": 220,
        "openPublicPlayers": 175,
        "maxPrivatePlayers": 0,
        "openPrivatePlayers": 0,
        "attributes": {
            "REGION_s": "EU",
            "GAMEMODE_s": "FORTATHENA",
            "ALLOWBROADCASTING_b": true,
            "SUBREGION_s": "GB",
            "DCID_s": "FORTNITE-LIVEEUGCEC1C2E30UBRCORE0A-14840880",
            "tenant_s": "Fortnite",
            "MATCHMAKINGPOOL_s": "Any",
            "STORMSHIELDDEFENSETYPE_i": 0,
            "HOTFIXVERSION_i": 0,
            "PLAYLISTNAME_s": codeKV.playlist,
            "SESSIONKEY_s": functions.MakeID().replace(/-/ig, "").toUpperCase(),
            "TENANT_s": "Fortnite",
            "BEACONPORT_i": 15009
        },
        "publicPlayers": [],
        "privatePlayers": [],
        "totalPlayers": 45,
        "allowJoinInProgress": false,
        "shouldAdvertise": false,
        "isDedicated": false,
        "usesStats": false,
        "allowInvites": false,
        "usesPresence": false,
        "allowJoinViaPresence": true,
        "allowJoinViaPresenceFriendsOnly": false,
        "buildUniqueId": buildUniqueId[req.user.accountId] || "0",
        "lastUpdated": new Date().toISOString(),
        "started": false
    });
});

app.post("/fortnite/api/matchmaking/session/*/join", (req, res) => {

    res.status(204).end();
});

app.post("/fortnite/api/matchmaking/session/matchMakingRequest", (req, res) => {

    res.json([]);
});

module.exports = app;