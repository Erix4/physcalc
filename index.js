let canvas = document.getElementById("canvas");

let body = d3.select("body");
let svg = d3.select("#svg");

import Command from "./src/command";

//let fullH = parseInt(d3.select("#scroll-i").style("height"));
//d3.select("#tsvg").style("height", fullH);
//d3.select("#tcan").style("height", fullH);
//document.getElementById("tcan").height = fullH;

d3.select(".dropdown-submenu a.test").on("click", function(e){
    $(this).next('ul').toggle();
    e.stopPropagation();
    e.preventDefault();
});

document.getElementById("vt0").style = "background-color: #a5cbc3 !important; color: black;";
document.getElementById("vt1").style = "background-color: #254441";
document.getElementById("vt2").style = "background-color: #254441";

MathJax.Hub.Config({
    messageStyle: "none"
});  

let comm = new Command(loopStart, canvas, svg);//start the website

let lastTime = 0;

function loopStart(timeStamp){
    lastTime = timeStamp;
    window.requestAnimationFrame(loop);
}

function loop(timeStamp){
    let deltaTime = (timeStamp - lastTime) / 1000;
    lastTime = timeStamp;
    //
    comm.shiftTime(deltaTime * comm.rate);
    //
    if(comm.running){//use comm.running
        window.requestAnimationFrame(loop);
    }
}