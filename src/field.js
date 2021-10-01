/*
Notes
It is not the field's job to keep track of inputs or resizing events
-> it is the field's job to resize the field when it is told to do so and remember what size it's supposed to be

While pixel values are y increasing top-down, everything else is top-up
*/

import Func from "./func";

export default class Field{
    constructor(command, ctx, svg, cx, cy, scale){
        this.command = command;
        console.log("Creating Field");
        //
        this.ctx = ctx;
        this.svg = svg;
        this.body = d3.select("body");
        this.timeline = d3.select("#timeline")
        //
        this.totalW = parseInt(this.body.style("width"));
        this.totalH = parseInt(this.body.style("height")) - parseInt(this.timeline.style("height"));
        //
        this.superRes = 4;//frequency of bolded lines
        this.res = 1;//frequency of any lines (internal unit values)
        //
        this.cx = cx;//center position in units, describes the grid position the field of view is positioned around
        this.cy = cy;
        this.scale = scale;//y scale defines as y units across height (ex. 20)
        this.strX = 1;//x stretch multiplies by y scale
        //
        this.calcSize();
        canvas.width = this.scrW;
        canvas.height = this.scrH;
        //
        this.gridMin = this.getGridRes() / 2;//minimum distance between grid lines (pixels)
        this.gridMax = this.getGridRes() * 2;//minimum distance between grid lines (pixels)
        //
        this.grid = new Grid(this);
        //
        this.functions = [new Func(10, 1, 2), new Func(1000, 1, 2, 0, 0), new Func(1000, 1, 0, -5)];
        this.functions[1].setColor("red");
        this.functions[2].setColor("green");
        console.log(this.functions[0].calcRoots());
        console.log(this.functions[2].calcRoots());
        //
        this.drawField();
    }
    //
    calcSize(){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        let bt = (this.scale / -2) - this.cy;//get screen top and bottom in units
        let tp = bt + this.scale;
        //
        let xSc = this.scale * this.scrW / (this.scrH * this.strX);//get number of x units using scale and x stretch
        let lf = (xSc / -2) - this.cx;//get screen left and right in units
        let rt = lf + xSc;
        //
        this.scaleY = d3.scaleLinear().domain([bt, tp]).range([this.scrH, 0]);//declare scale functions for converting units to pixels
        this.scaleX = d3.scaleLinear().domain([lf, rt]).range([0, this.scrW]);
        this.conX = d3.scaleLinear().domain([0, this.scrW]).range([0, xSc]);
        this.conY = d3.scaleLinear().domain([0, this.scrH]).range([0, -this.scale]);
    }
    //
    resize(){
        /*let pScrW = this.scrW;
        let pScrH = this.scrH;
        let pTotW = this.totalW;
        let pTotH = this.totalH;
        //
        let nScrW = parseInt(this.svg.style("width"));
        let nScrH = parseInt(this.svg.style("height"));
        this.totalW = parseInt(this.body.style("width"));
        this.totalH = parseInt(this.body.style("height")) - parseInt(this.timeline.style("height"));//make sure timeline isn't included in height calc
        //
        let pScale = this.scale;
        let pxSc = pScale * pScrW / (pScrH * this.strX);//get number of x units using scale and x stretch
        this.scale = pScale * (nScrH / pScrH);
        let nxSc = this.scale * nScrW / (nScrH * this.strX);//get number of x units using scale and x stretch
        //
        let px = (pxSc / this.strX / 2) + this.conX(pTotW - pScrW);//previous x offset
        let nx = (nxSc / this.strX / 2) + (nxSc / this.strX) * (this.totalW - nScrW) / nScrW;//new x offset
        //
        let py = (pScale / 2) - this.conY(pTotH - pScrH);//previous y offset
        let ny = (this.scale / 2) + (this.scale) * (this.totalH - nScrH) / nScrH;//new y offset*/
        //
        //this.cx -= (nx - px);//repos center for screen resize with change in unit offset
        //this.cy += (ny - py);
        //
        this.calcSize();
        this.command.canvas.width = this.scrW;
        this.command.canvas.height = this.scrH;
        //fix_dpi(this.command.canvas);
        this.drawField();
    }
    //
    repos(px, py){//reposition field
        this.cx += this.conX(px);
        this.cy += this.conY(py);
        //
        this.resize();
        //this.drawField();
    }
    //
    zoom(c, px, py){
        this.scale *= c;
        //
        if(this.getGridRes() < this.gridMin){
            this.res *= 4;
            this.superRes *= 4;
        }else if(this.getGridRes() > this.gridMax){
            this.res /= 4;
            this.superRes /= 4;
        }
        //
        let mx = this.scaleX.invert(px);
        let my = this.scaleY.invert(py);
        //
        this.cx = mx - ((mx - this.cx) / c);//this is slightly wrong and I don't know why
        this.cy = my - ((my - this.cy) / c);
        //
        this.calcSize();
        this.drawField();
    }
    getGridRes(){
        return this.scrH / (this.scale / this.res);
    }
    //
    drawField(){
        this.ctx.clearRect(0, 0, this.scrW, this.scrH);
        //
        //d3.select("canvas").style("width", this.scrW).style("height", this.nScrH);
        //d3.select("svg").style("width", this.scrW).style("height", this.nScrH);
        this.grid.draw(this.ctx);
        //
        this.functions.forEach(func => {
            func.draw(this, this.ctx, this.scaleX.domain()[0], this.scaleX.domain()[1]);
        });
    }
}

class Grid{
    constructor(field){
        this.field = field;
        this.axisColor = "black";
        if(this.field.command.darkMode){
            this.axisColor = "white";//if darkmode, make grid lines white
        }
    }
    //
    draw(ctx){
        let res = this.field.res;
        //
        let xLeft = this.field.scaleX.domain()[0];//get x left and right (in units)
        let xRight = this.field.scaleX.domain()[1];
        let yBot = this.field.scaleY.domain()[0];//get y top and bottom
        let yTop = this.field.scaleY.domain()[1];
        //
        ctx.lineCap = "round";
        ctx.strokeStyle = "gray";
        var curX = Math.ceil(xLeft / res) * res;//get first x line position
        for(var n = 0; n < ((xRight - xLeft) / res); n++){//loop for number of lines (if multiple of res, there will be a line at the left of the screen)
            ctx.lineWidth = this.colorLine(ctx, curX) * .5;
            ctx.beginPath();
            ctx.moveTo(this.field.scaleX(curX), this.field.scaleY(yBot));//draw line from bottom to top at current x
            ctx.lineTo(this.field.scaleX(curX), this.field.scaleY(yTop));
            ctx.stroke();
            curX += res;//increment by grid line resolution
        }
        //
        var curY = Math.ceil(yBot / res) * res;//get first y line position
        for (var n = 0; n < (this.field.scale / res); n++){
            //this.colorLine(ctx, curY);
            ctx.lineWidth = this.colorLine(ctx, curY) * .5;
            ctx.beginPath();
            ctx.moveTo(Math.floor(this.field.scaleX(xLeft)), Math.floor(this.field.scaleY(curY)));//draw line from left to right at current y
            ctx.lineTo(Math.floor(this.field.scaleX(xRight)), Math.floor(this.field.scaleY(curY)));
            ctx.stroke();
            curY += res;//increment by grid line resolution
        }
    }
    //
    colorLine(ctx, pos){
        let ctx2 = ctx;
        let strength = 4 - Math.ceil(Math.abs((pos % this.field.superRes) / this.field.superRes)) - 2* Math.ceil(Math.abs(pos / 100000));//for every super res line, make more bold
        return 2 * (strength - 1) + 1;
        console.log(strength);
        switch(strength){
            case 1:
                ctx2.lineWidth = 1;
                ctx2.strokeStyle = "gray";
            case 2:
                ctx2.lineWidth = 2;
                ctx2.strokeStyle = "gray";
            case 3:
                ctx2.lineWidth = 2;
                ctx2.strokeStyle = this.axisColor;
        }
        return ctx2;
    }
}

function fix_dpi(canvas) {
    //get CSS height
    //the + prefix casts it to an integer
    //the slice method gets rid of "px"
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    //get CSS width
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    //scale the canvas
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}