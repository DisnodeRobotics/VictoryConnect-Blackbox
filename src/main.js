const Client = require("vicconnect-client");
const Config = require("../config");
const FS = require("fs");

var client = new Client("blackbox", "Blackbox");

var curCount = 0;
var fileCount = 0;
var currentPath = `${Config.filePath}/DATA-${new Date().getTime()}-FILE${fileCount}.vc`
if(!FS.existsSync(Config.filePath)){
    FS.mkdirSync(Config.filePath);
}

var createStream = FS.createWriteStream(currentPath);


client.enableTCP(Config.tcp.ip, Config.tcp.port);
client.on("ready", ()=>{
    client.setTickRate(Config.tickRate);
    client.subscribe("*", (packet)=>{
        curCount++;
        if(curCount >= Config.newFileEvery){
            fileCount ++;
            currentPath = `${Config.filePath}/DATA-${new Date().getTime()}-FILE${fileCount}.vc`
            createStream = FS.createWriteStream(currentPath);
            curCount = 0;
        }

        createStream.write(new Date().getTime() + "   " + packet + "\n");
    });

    client.addSource("blackbox/files", "TCP", ()=>{
        return fileCount + 1;
    });

    client.addSource("blackbox/total_saved", "TCP", ()=>{
        return (fileCount * Config.newFileEvery) + curCount;
    });
    client.newTopic("Blackbox TickRate", "blackbox/config/tickrate", "TCP");
    client.newTopic("Blackbox newFileEvery", "blackbox/config/newFileEvery", "TCP");
    client.setTopic("blackbox/config/tickrate",[Config.tickRate]);
    client.setTopic("blackbox/config/newFileEvery",[Config.newFileEvery]);
})