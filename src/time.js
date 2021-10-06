export default class Timeline{
    constructor(command, canvas, svg, scale){
        this.command = command;
        console.log("Creating Timeline");
        //
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        //
        this.svg = svg;
        this.body = d3.select("body");
        this.timeline = d3.select("#timeline")
        //
        this.cx = 0;
        //
        this.superRes = 5;//frequency of bolded lines
        this.res = 1;//frequency of any lines (internal unit values)
        //
        this.scale = scale;//zoom of timeline
        //
        this.calcSize();
        canvas.width = this.scrW;
        canvas.height = this.scrH;
        //
        this.gridMin = this.getGridRes() / 2;//minimum distance between grid lines (pixels)
        this.gridMax = this.getGridRes() * 2;//minimum distance between grid lines (pixels)
        //
        this.draw(ctx);
    }
    //
    calcSize(){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        let bt = (this.scale / -2) + this.cy;//get screen top and bottom in units
        let tp = bt + this.scale;
        //
        let xSc = this.scale * this.scrW / (this.scrH * this.strX);//get number of x units using scale and x stretch
        let lf = (xSc / -2) + this.cx;//get screen left and right in units
        let rt = lf + xSc;
        //
        this.timeX = d3.scaleLinear().domain([lf, rt]).range([0, this.scrW]);
    }
    //
    resize(){
        this.calcSize();
        this.canvas.width = this.scrW;
        this.canvas.height = this.scrH;
    }
    //
    repos(px){//reposition field
        this.cx -= this.conX(px);
        //
        this.calcSize();
        //this.drawField();
    }
}