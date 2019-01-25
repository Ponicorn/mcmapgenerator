const fs = require('fs')
const { spawn } = require('child_process');
const fetch = require('node-fetch')
const decompress = require('decompress')
const decompressTargz = require('decompress-targz')
const configuration = require('./configuration/configuration.json')

const username         = configuration.username
const password         = configuration.password
const authurl          = configuration.authurl
const realmurl         = configuration.realmurl
const minecraftVersion = configuration.minecraftVersion
const serverId         = configuration.serverId
const serverSlot       = configuration.serverSlot
const downloadFolder   = configuration.downloadFolder
const dlpath = `${downloadFolder}/mcmap.tar.gz`

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
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        const dest = fs.createWriteStream(dlpath)

        // On fait pété tout ça frère
        r.body.pipe(dest)
            .on('open', () => {
                // ça commence frère, croise les doigts !
                console.log('début du dl de la map')
            })
            .on('error', (err) => {
                // ça va planté frère
                console.error(err)
                reject(err)
            })
            .on('finish', () => {
                // ouais frère, bien ouèj
                console.log('dl de la map terminé')
                console.log('début de la décompression')
                resolve()
            })
    }))
    .then(() => decompress(dlpath, downloadFolder, { plugins: [ decompressTargz() ] }))
    .then(() => {
        console.log('décompression terminée')
        if (fs.existsSync(dlpath)) fs.unlinkSync(dlpath)
        console.log('début de la génération de la carte web')

        let mapFolder = `${downloadFolder}\\world`
        let publicFolder = `.\\public`
        let cmd = 'mapcrafter -b -c configuration\\render.conf'

        return new Promise((resolve, reject) => {
            let spawncmd = spawn('mapcrafter', ['-b','-j','2', '-c', 'configuration\\render.conf'])
            let error = false
            
            // En cas de log
            spawncmd.stdout.on('data', data => console.log(data.toString()))

            // En cas d'erreur
            spawncmd.stderr.on('data', data => {
                error = true
                console.error(data.toString())
            })

            // En cas de fin
            spawncmd.on('exit', (code) => {
                console.log('code: ', code)
                if (error)
                    reject('un problème est survenu durant la generation')
                else 
                    resolve()
            })
        })
    })
    .then(() => {
        console.log('c\'est bon frère, c\'est fait')
    })
    .catch(err => {
        console.error(err)
    })