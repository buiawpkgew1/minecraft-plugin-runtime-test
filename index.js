// Author: FN-FAL113
// License: GNU GPL v3
const https = require('https')
const fsPromise = require('fs').promises
const fs = require('fs')
const childproc = require('child_process')

async function main(){
    try {
        if(!process.env.SERVER_VERSION) {
            console.error(`缺少 "SERVER_VERSION" 环境变量值！退出进程，代码为 1.`)
            
            process.exit(1)
        }

        const serverName = "paper"
        const serverVersion = process.env.SERVER_VERSION
        const serverBuild = await getLatestServerBuild(serverVersion)
        const serverJarFileName = `${serverName}-${serverVersion}-${serverBuild}.jar`
        const serverJarUrl = `https://api.papermc.io/v2/projects/paper/versions/${serverVersion}/builds/${serverBuild}/downloads/${serverJarFileName}`

        const slimefunJarUrl = 'https://builds.guizhanss.com/r2/StarWishsama/Slimefun4/master/Slimefun-d36ce9d-Beta.jar'
        const GuizhanLibPluginUrl = 'https://builds.guizhanss.com/r2/ybw0014/GuizhanLibPlugin/master/GuizhanLibPlugin-Build%2044%20(git%201f5d835).jar'
        await fsPromise.writeFile('server/eula.txt', "eula=true").catch((err) => console.log("写入 eula.txt 内容时出错: " + err))

        await downloadJar(serverJarUrl, 'server/', serverJarFileName)

        await downloadJar(slimefunJarUrl, 'server/plugins/' , 'Slimefun-d36ce9d-Beta.jar')

        await downloadJar(GuizhanLibPluginUrl, 'server/plugins/' , 'GuizhanLibPlugin-Build 44 (git 1f5d835).jar')

        runServer(serverJarFileName)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

function getLatestServerBuild(serverVersion){
    return new Promise((resolve, reject) => {
        const url = `https://api.papermc.io/v2/projects/paper/versions/${serverVersion}/builds` 

        let jsonStream = ''

        https.get(url, (res) => {
            res.on('data', (chunk) => {
                jsonStream += chunk // 逐块拼接字节数据
            })

            res.on('end', () => {
                if(res.statusCode !== 200) { 
                    reject("获取构建数据失败，状态消息：" + res?.statusMessage)
                } else {
                    const json = JSON.parse(jsonStream) // 直接解析流而不是写入文件

                    resolve(json.builds[json.builds.length - 1].build) // 获取构建数组的最后一个索引
                }
            })
        })
    })
}

function downloadJar(url, dir, jarFile){
    return new Promise((resolve, reject) => {
        let receivedBytes = 0

        https.get(url, (res) => {
            res.pipe(fs.createWriteStream(dir + jarFile)) // 将可读流管道到可写流
            
            res.on('data', (chunk) => {
                receivedBytes += chunk.length // 每次补丁字节长度以检查下载进度
                
                console.log(`正在下载 "${jarFile}": ` + (receivedBytes / 1000000).toFixed(2) + "mb / " + (res.headers['content-length'] / 1000000).toFixed(2) + "mb")
            })

            res.on('end', () => {
                if(res.statusCode !== 200){
                    console.log("\n下载服务器 jar 文件失败！")
                    console.log("\n状态码: " + res.statusCode)
                    console.log("\n状态消息: " + res?.statusMessage)

                    reject()
                } else {
                    console.log(`\n成功下载 "${jarFile}"！`)

                    resolve()
                }
            })
        })
    })
}

function runServer(jarFile){
    console.log("Jar 文件执行中！")

    const child = childproc.spawn("java", ['-jar', `${jarFile}`, '--nogui'], { cwd:"server/" })
    
    child.stdout.on('data', (data) => {
        console.log(data.toString())
    })

    child.stderr.on('data', (data) => {
        console.log(data.toString())      
    })
}

main()
