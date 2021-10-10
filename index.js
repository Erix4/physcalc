let canvas = document.getElementById("canvas");

let body = d3.select("body");
let svg = d3.select("#svg");

import Command from "./src/command";

let comm = new Command(loopStart, canvas, svg);

let lastTime = 0;

function loopStart(timeStamp){
    lastTime = timeStamp;
    window.requestAnimationFrame(loop);
}

function loop(timeStamp){
    let deltaTime = (timeStamp - lastTime) / 1000;
    lastTime = timeStamp;
    //
    comm.retime(deltaTime);
    //
    if(comm.running){//use comm.running
        window.requestAnimationFrame(loop);
    }
}