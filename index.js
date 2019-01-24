const fs = require('fs')
const fetch = require('node-fetch')
const configuration = require('./configuration/configuration.json')

const username         = configuration.username
const password         = configuration.password
const authurl          = configuration.authurl
const realmurl         = configuration.realmurl
const minecraftVersion = configuration.minecraftVersion
const serverId         = configuration.serverId
const serverSlot       = configuration.serverSlot
const downloadFolder   = config.downloadFolder

let authbody = {
    agent: {
        name: "Minecraft",
        version: 1
    },
	username,
    password,
}

// On s'authentifie ici
fetch(`${authurl}/authenticate`, {
    method: 'POST',
    body: JSON.stringify(authbody),
    headers: { 'Content-Type': 'application/json' }
})
    .then(r => r.json())
    .then(json => {
        // On recupères les données pour la prochaines requêtes
        // On va recuperer l'url de download de la map
        let uuid = json.selectedProfile.id;
        let name = json.selectedProfile.name
        let accessToken = json.accessToken

        // On prépare l'auth avec le cookie
        let cookie = `sid=token:${accessToken}:${uuid};user=${name};version=${minecraftVersion}`
        return fetch(`${realmurl}/worlds/${serverId}/slot/${serverSlot}/download`, {
            headers: { cookie }
        })
    })
    .then(r => r.json())
    .then(json => {
        let downloadLink = json.downloadLink
        return fetch(downloadLink)
    })
    .then(r => new Promise((resolve, reject) => {
        // On a merdé si on passe pas ça frère
        if (!r.ok) reject()
        
        // On prépare le dl frère
        let dlpath = `${downloadFolder}/mcmap.tar.gz`
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        const dest = fs.createWriteStream(dlpath)

        // On fait pété tout ça frère
        r.body.pipe(dest)
            .on('open', () => {
                // ça commence frère, croise les doigts !
                console.log('debut du dl de la map')
            })
            .on('error', (err) => {
                // ça va planté frère
                console.error(err)
                reject(err)
            })
            .on('finish', () => {
                // ouais frère, bien ouèj
                resolve()
            })
    }))
    .then(() => {
        // On va se dezip la map frère
        console.log('noice')
    })