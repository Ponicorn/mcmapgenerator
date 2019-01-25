const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process');
const fetch = require('node-fetch')
const decompress = require('decompress')
const rimraf = require('rimraf')
const decompressTargz = require('decompress-targz')
const configuration = require('./configuration/configuration.json')

const username         = configuration.username
const password         = configuration.password
const authurl          = configuration.authurl
const realmurl         = configuration.realmurl
const minecraftVersion = configuration.minecraftVersion
const serverId         = configuration.serverId
const serverSlot       = configuration.serverSlot
const downloadFolder   = path.normalize(configuration.downloadFolder)
const mapcrafter = configuration.mapcrafter

const dlpath = path.join(downloadFolder,'mcmap.tar.gz')
const worldpath = path.join(downloadFolder, 'world')
mapcrafter.configurationFile = path.normalize(mapcrafter.configurationFile)

let authbody = {
    agent: {
        name: "Minecraft",
        version: 1
    },
	username,
    password,
}
log('Authentification a l\'API mojang')
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

        log('Récupération du lien de téléchargement')
        return fetch(`${realmurl}/worlds/${serverId}/slot/${serverSlot}/download`, {
            headers: { cookie }
        })
    })
    .then(r => r.json())
    .then(json => {
        log('Préparation au téléchargement de la carte')
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        let downloadLink = json.downloadLink
        return fetch(downloadLink)
    })
    .then(r => new Promise((resolve, reject) => {
        // On a merdé si on passe pas ça frère
        if (!r.ok) reject()
        
        // On prépare le dl frère
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        const dest = fs.createWriteStream(dlpath)
        // On fait pété tout ça frère
        r.body.pipe(dest)
            .on('open', () => {
                // ça commence frère, croise les doigts !
                log('début du téléchargement')
            })
            .on('error', (err) => {
                // ça va planté frère
                log(err.toString(), true)
                reject(err)
            })
            .on('finish', () => {
                // ouais frère, bien ouèj
                log('Téléchargement de la carte terminé')
                log('Préparation a la décompression de la carte')
                if (fs.existsSync(worldpath)) rimraf.sync(worldpath)
                resolve()
            })
    }))
    .then(() => decompress(dlpath, downloadFolder, { plugins: [ decompressTargz() ] }))
    .then(() => {
        log('Décompression terminé')
        
        return new Promise((resolve, reject) => {
            log('Préparation de la génération de la carte web')
            log(`${mapcrafter.cmd} -b -j ${mapcrafter.cpusThreads} -c ${mapcrafter.configurationFile}`)
            let spawncmd = spawn(mapcrafter.cmd, ['-b','-j',mapcrafter.cpusThreads, '-c', mapcrafter.configurationFile])

            // En cas de log
            spawncmd.stdout.on('data', data => log(data.toString(), false, false))

            // En cas d'erreur
            spawncmd.stderr.on('data', data => log(data.toString(), true, false))

            // En cas de fin
            spawncmd.on('exit', (code) => {
                log(`Génération terminée, le processus a quitté avec le code: ${code}`)
                resolve()
            })
        })
    })
    .then(() => {
        // Nettoyage du dossier de telechargement
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        // if (fs.existsSync(worldpath)) rimraf.sync(worldpath)
        log('Processus terminé, vous pouvez retrouvez votre carte dans le dossier configuré !')
    })
    .catch(err => log(err.toString(), true))

// Fonction pour.. bah log quoi
function log (logmsg, error = false, showdate = true) {
    let date = ''
    let info = error ? ' [ERROR] ' : ' [INFO] '
    if (showdate) date = new Date().toISOString() + info
    if (error) return process.stderr.write(`${date}${logmsg}\n`)
    process.stdout.write(`${date}${logmsg}\n`)
}

// Suppression eventuel du dossier passé en param