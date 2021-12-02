let canvas = document.getElementById("fieldCanvas");

let body = d3.select("body");
let svg = d3.select("#fieldSVG");

import Command from "./src/command";
import 'simplebar';
import 'simplebar/dist/simplebar.css';

let headerHeight = parseFloat(d3.select('#header').style('height'));
let columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
let screenRatio = window.innerWidth / window.innerHeight;
console.log(columnWidth);
const RATIOTHRESHOLD = 0.9;

//adjust header font-size and hide field by screen ratio
if(screenRatio > RATIOTHRESHOLD){//horizontal
    d3.select('#title').style('font-size', `${headerHeight * 0.9}px`);
    d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
}else{//vertical
    d3.select('#title').style('font-size', `${headerHeight * 0.4}px`);
    d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
    d3.select('#leftcolumn').style('width', '100%');
    d3.select('#fieldcolumn').style('display', 'none');
    d3.select('#lefthandle').style('display', 'none');
    columnWidth = window.innerWidth;
}

d3.select('#leftcolumn').style('font-size', `${columnWidth / 10}px`);//adjust left column font size

fitWidth();//fit the input fields to the width of the left column
fitSolve();

function getExtra(){//get the width of the non-field elements of the values section
    return getWidth('.expandCompIcon') + (2 * getWidth('.propParaLabel')) + (2 * getWidth('.propdrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getCalc(){//get the width of the non-field elements of the solver section
    return (2 * getWidth('.checkbox')) + (2 * getWidth('.readCalcLabel')) + (2 * getWidth('.readCalcDrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getField(){//get the width of the field
    if(d3.select('#settings').style('display') == 'none'){
        return getWidth('#leftfield') + 10;
    }else{
        return parseFloat(d3.select('#settings').style('width')) + getWidth('#leftfield') + 10;
    }
}

function fitWidth(){//fit the input fields to the width of the left column
    let labelWidth = getExtra();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.fitWidth').style('width', `${fieldWidth}px`);
}

function fitSolve(){//fit the input fields in the solve section
    let labelWidth = getCalc();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.solveInput').style('width', `${fieldWidth}px`);
}

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
    console.log(contents);
    if(contents.style('display') == 'none'){
        contents.style('display', 'block');
        d3.select(this).select('.expandIcon').style('transform', 'rotate(90deg)');
    }
    else{
        contents.style('display', 'none');
        d3.select(this).select('.expandIcon').style('transform', 'rotate(0deg)');
    }
});

window.addEventListener('resize', event => {//resize everything*
    headerHeight = parseFloat(d3.select('#header').style('height'));
    screenRatio = window.innerWidth / window.innerHeight;
    if(screenRatio > RATIOTHRESHOLD){//horizontal
        d3.select('#title').style('font-size', `${headerHeight * 0.9}px`);
        d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
        d3.select('#leftcolumn').style('width', '25%');
        d3.select('#fieldcolumn').style('display', 'flex');
        d3.select('#lefthandle').style('display', 'block');
        columnWidth = window.innerWidth * 0.25;
    }else{//vertical
        d3.select('#title').style('font-size', `${headerHeight * 0.4}px`);
        d3.select('#title').style('margin-left', `${headerHeight / 8}px`);
        d3.select('#leftcolumn').style('width', '100%');
        d3.select('#fieldcolumn').style('display', 'none');
        d3.select('#lefthandle').style('display', 'none');
        columnWidth = window.innerWidth;
    }
    d3.select('#leftcolumn').style('font-size', `${columnWidth / 10}px`);
    d3.select('#leftcolumn').style('width', `${columnWidth}px`);
    d3.select('#fieldcolumn').style('width', `${window.innerWidth - columnWidth}px`);
    fitWidth();
    fitSolve();
});

var resizeLeft = false;
var initalX = 0;
d3.select("#lefthandle").on("mousedown", function(){//start resizing the left column
    resizeLeft = true;
    initalX = d3.event.clientX;
});

document.addEventListener("mouseup", event => {//stop resizing the left column*
    resizeLeft = false;
});

//console.log(d3.select('.tab').style('height'));

//document.getElementById("vt0").style = "background-color: #a5cbc3 !important; color: black;";
//document.getElementById("vt1").style = "background-color: #254441";
//document.getElementById("vt2").style = "background-color: #254441";

MathJax.Hub.Config({
    messageStyle: "none"
});  

let comm = new Command(loopStart, canvas, svg);//start the website

window.addEventListener('mousemove', event => {//resize the left column sometimes*
    if(resizeLeft){
        let newX = event.clientX;
        console.log(`field: ${getField()}`);
        if(newX - 130 > getExtra() && window.innerWidth - newX > getField()){
            d3.select('#leftcolumn').style('width', `${newX}px`);
            d3.select('#fieldcolumn').style('width', `${window.innerWidth - newX}px`);
            //initalX = newX;
            columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
            fitWidth();
            fitSolve();
            comm.resize();
        }
    }
});

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

function getWidth(id){
    let elem = d3.select(id);
    return parseFloat(elem.style('width')) + parseFloat(elem.style('margin-left')) + parseFloat(elem.style('margin-right'));
}