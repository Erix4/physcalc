d3.select('#noInternet').style('display', 'none');

let canvas = document.getElementById("fieldCanvas");

let body = d3.select("body");
let svg = d3.select("#fieldSVG");

console.log(`starting imports`);
import Command from "./command.js";
console.log(`command imported successfully`);
//import 'simplebar';
//import 'simplebar/dist/simplebar.css';

d3.select('#settingsB').on('click', function(){//show/hide the settings section and rotate the settings icon
    if(d3.select('#settings').style('display') == 'none'){
        d3.select('#settings').style('display', 'inline');
        d3.select('#settingsIcon').style('transform', 'rotate(90deg)');
    }else{
        d3.select('#settings').style('display', 'none');
        d3.select('#settingsIcon').style('transform', 'rotate(0deg)');
    }
});

d3.selectAll('.propExpand').on('click', function(){//expand the corresponding sections in the properties menu
    let contents = d3.select(this.parentNode).select('.propContents');
    if(contents.style('display') == 'none'){
        contents.style('display', 'block');
        d3.select(this).select('.expandIcon').style('transform', 'rotate(90deg)');
    }
    else{
        contents.style('display', 'none');
        d3.select(this).select('.expandIcon').style('transform', 'rotate(0deg)');
    }
});

//console.log(d3.select('.tab').style('height'));

//document.getElementById("vt0").style = "background-color: #a5cbc3 !important; color: black;";
//document.getElementById("vt1").style = "background-color: #254441";
//document.getElementById("vt2").style = "background-color: #254441";

console.log(`hello?`);
//let sb = new SimpleBar(document.getElementById('leftcolumn'), { autoHide: false });
//console.log(d3.select(sb));
//console.log(d3.select(sb).style('height'));

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