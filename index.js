let canvas = document.getElementById("fieldCanvas");

let body = d3.select("body");
let svg = d3.select("#fieldSVG");

import Command from "./src/command";
import 'simplebar';
import 'simplebar/dist/simplebar.css';

d3.select('#settingsB').on('click', function(){//show/hide the settings section and rotate the settings icon
    if(d3.select('#settings').style('display') == 'none'){
        d3.select('#settings').style('display', 'inline');
        d3.select('#settingsIcon').style('transform', 'rotate(90deg)');
    }else{
        d3.select('#settings').style('display', 'none');
        d3.select('#settingsIcon').style('transform', 'rotate(0deg)');
    }
});

var cur = [3,3];
d3.selectAll('.juncType').on('click', function(d, i){//cycle the junction icons and enable.disable the bounds fields if necessary
    cur[i] = (cur[i] + 1) % 4;
    d3.select(this).select('.sel').attr('class', `discIcon`);
    d3.select(this.childNodes[cur[i]*2+1]).attr('class', `sel discIcon`);
    if(cur[i] == 0){
        d3.select(d3.selectAll('.tabField').nodes()[i]).attr('class', 'tabField');
    }else if(cur[i] == 3){
        d3.select(d3.selectAll('.tabField').nodes()[i]).attr('class', 'noField tabField');
    }
});

var tabNum = 1;
d3.select('#addTab').on('click', function(){//add new tabs, their separators, but prevent at max (10)
    tabNum++;
    let newTab = d3.select('#tabs').append('div').attr('class', 'newtab tab').attr('val', tabNum);
    newTab.append('p').attr('class', 'tabText text').text(tabNum);
    d3.select(this).raise();
    if(tabNum == 10){
        d3.select(this).style('display', 'none');
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