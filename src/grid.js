export default class Grid{
    constructor(command, ctx, svg, cx, cy, scale){
        this.command = command;
        console.log("Creating Field");
        this.svg = svg;
        this.body = d3.select("body");
        this.timeline = d3.select("#time")
        //
        this.totalW = parseInt(this.body.style("width"));
        this.totalH = parseInt(this.body.style("height")) - parseInt(this.timeline.style("height"));
        //
        this.bd = require('bigdecimal');//local instance of npm package
        //
        this.superRes = 5;//frequency of bolded lines, constant
        this.exactRes = this.bd.BigDecimal(`1`);//frequency of any lines (internal unit values), impervious to floating point errors
        this.xRes = this.bd.BigDecimal(`1`);//frequency of x axis lines
        //
        this.cx = cx;//center position in units, describes the grid position the field of view is positioned around
        this.cy = cy;
        this.scale = scale;//y scale defines as y units across height (ex. 20)
        this.strX = 1;//x stretch multiplies by y scale
        //
        this.calcSize();
        this.command.canvas.width = this.scrW;
        this.command.canvas.height = this.scrH;
        //
        this.gridMin = this.getGridRes() / 2;//minimum distance between grid lines (pixels)
        this.gridMax = this.getGridRes() * 2;//minimum distance between grid lines (pixels)
        //
        this.draw(ctx);
    }
    //
    /**
     * Recalculate grid scale (scaleX, scaleY)
     */
    calcSize(){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        this.command.scrW = parseInt(this.svg.style("width"));
        this.command.scrH = parseInt(this.svg.style("height"));
        //
        let bt = (this.scale / -2) + this.cy;//get screen top and bottom in units
        let tp = bt + this.scale;
        //
        let xSc = this.scale * this.scrW / (this.scrH * this.strX);//get number of x units using scale and x stretch
        let lf = (xSc / -2) + this.cx;//get screen left and right in units
        let rt = lf + xSc;
        //
        this.command.scaleY = d3.scaleLinear().domain([bt, tp]).range([this.scrH, 0]);//declare scale functions for converting units to pixels
        this.command.scaleX = d3.scaleLinear().domain([lf, rt]).range([0, this.scrW]);
        this.conX = d3.scaleLinear().domain([0, this.scrW]).range([0, xSc]);
        this.conY = d3.scaleLinear().domain([0, this.scrH]).range([0, -this.scale]);
        //
        let fd = firstDigit(this.superRes * (parseFloat(this.exactRes)));//redo the gridlines
        this.exactRes = getGrid(this.getGridRes(), this.exactRes, this.gridMin, this.gridMax, fd, this.bd);
        //
        //FIX THIS FOR COMPOUNDING FIRST DIGITS
        fd = firstDigit(this.superRes * (parseFloat(this.exactRes.multiply(this.xRes))));//redo the gridlines for x axis
        //console.log(`first digit: ${fd}`);
        this.xRes = getGrid(this.getGridRes() * parseFloat(this.xRes) * this.strX, this.exactRes.multiply(this.xRes), this.gridMin, this.gridMax, fd, this.bd).divide(this.exactRes);
        /*if(this.getGridRes() < this.gridMin){
            if(fd == 1 || fd == 5){//if the first digit is 1 or 5
                this.exactRes = this.exactRes.multiply(new this.bd.BigDecimal(`2`));//multiply res by 2
            }else{//first digit is 2
                this.exactRes = this.exactRes.multiply(new this.bd.BigDecimal(`2.5`));//multiply res by 5/2
            }
        }else if(this.getGridRes() > this.gridMax){
            if(fd == 1 || fd == 2){//if the first digit is 1 or 2
                this.exactRes = this.exactRes.divide(new this.bd.BigDecimal(`2`));//divide res by 2
            }else{//first digit is five
                this.exactRes = this.exactRes.multiply(new this.bd.BigDecimal(`0.4`));//multiply res by 2/5
            }
        }*/
    }
    //
    /**
     * Resize canvas on resize event
     */
    resize(){
        this.calcSize();
        this.command.canvas.width = this.scrW;
        this.command.canvas.height = this.scrH;
        /*if (!ratio) { ratio = PIXEL_RATIO; }
        this.command.canvas.width = this.scrW * ratio;
        this.command.canvas.height = this.scrH * ratio;
        this.command.canvas.style.width = this.scrW + "px";
        this.command.canvas.style.height = this.scrH + "px";
        this.command.canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);*/
        //fix_dpi(this.command.canvas);
    }
    //
    /**
     * Shift grid position
     * @param {Number} cx change in x in pixels
     * @param {Number} cy change in y in pixels
     */
    shiftPos(cx, cy){//reposition field
        this.cx -= this.conX(cx);
        this.cy -= this.conY(cy);
        //
        this.calcSize();
    }
    //
    /**
     * Change scale of field
     * @param {Number} c  change amount (multiplier)
     * @param {Number} px zoom center x in pixels
     * @param {Number} py zoom center y in pixels
     */
    zoom(c, px, py){
        if((-Math.log10(this.scale) < 12 || c > 1) && (Math.log10(this.scale) < 20 || c < 1)){
            this.scale *= c;
        }
        //
        let mx = this.command.scaleX.invert(px);
        let my = this.command.scaleY.invert(py);
        //
        this.cx = mx - ((mx - this.cx) * c);
        this.cy = my - ((my - this.cy) * c);
        //
        this.calcSize();
    }
    /**
     * find size of displayed grid units (in pixels) 
     * @returns pixels in between each y grid line
     */
    getGridRes(){
        return this.scrH / (this.scale / parseFloat(this.exactRes));
    }
    //
    zoomX(c, px, py){
        this.strX *= c;
        //
        let mx = this.command.scaleX.invert(px);
        this.cx = mx - ((mx - this.cx) / c);
        //
        this.calcSize();
    }
    //
    /**
     * Draw the grid (lines and axis)
     * @param {any} ctx contex of canvas
     */
    draw(ctx){
        ctx.clearRect(0, 0, this.scrW, this.scrH);
        //
        let res = parseFloat(this.exactRes);
        //
        let xLeft = this.command.scaleX.domain()[0];//get x left and right (in units)
        let xRight = this.command.scaleX.domain()[1];
        let yBot = this.command.scaleY.domain()[0];//get y top and bottom
        let yTop = this.command.scaleY.domain()[1];
        //
        ctx.lineCap = "round";
        ctx.strokeStyle = "gray";
        ctx.font = "20px LatinM";
        ctx.fillStyle = "gray";
        //
        var curY = Math.ceil(yBot / res) * res;//get first y line position
        var exactY = this.exactRes.multiply(new this.bd.BigDecimal(`${Math.ceil(yBot / res)}`));
        //
        for (var n = 0; n < (this.scale / res); n++){
            if(parseFloat(exactY) == 0){
                ctx.lineWidth = 4;
            }else if(parseFloat(exactY.divide(this.exactRes) % this.superRes) / (this.superRes + 1) == 0){
                ctx.lineWidth = 2;
                ctx.fillText(eify(parseFloat(exactY)), this.command.scaleX(0) + 5, this.command.scaleY(curY) + 20);
            }else{
                ctx.lineWidth = 0.5;
            }
            //
            ctx.beginPath();
            ctx.moveTo(Math.floor(this.command.scaleX(xLeft)), Math.floor(this.command.scaleY(curY)));//draw line from left to right at current y
            ctx.lineTo(Math.floor(this.command.scaleX(xRight)), Math.floor(this.command.scaleY(curY)));
            ctx.stroke();
            curY += res;//increment by grid line resolution
            exactY = exactY.add(this.exactRes);
        }
        //
        res *= parseFloat(this.xRes);
        //
        var curX = Math.ceil(xLeft / res) * parseFloat(this.exactRes.multiply(this.xRes));//get first x line position
        var exactX = this.exactRes.multiply(new this.bd.BigDecimal(`${Math.ceil(xLeft / res)}`)).multiply(this.xRes);//new bigdecimal.BigDecimal(`${Math.ceil(xLeft / res) * this.exactRes}`);
        //
        for(var n = 0; n < ((xRight - xLeft) / res); n++){//loop for number of lines (if multiple of res, there will be a line at the left of the screen)
            if(parseFloat(exactX) == 0){
                ctx.lineWidth = 4;
            }else if(parseFloat(exactX.divide(this.exactRes.multiply(this.xRes)) % this.superRes) / (this.superRes + 1) == 0){
                ctx.lineWidth = 2;
                ctx.fillText(eify(parseFloat(exactX)), this.command.scaleX(curX) + 5, this.command.scaleY(0) + 20);
            }else{
                ctx.lineWidth = 0.5;
            }
            //
            ctx.beginPath();
            ctx.moveTo(this.command.scaleX(curX), this.command.scaleY(yBot));//draw line from bottom to top at current x
            ctx.lineTo(this.command.scaleX(curX), this.command.scaleY(yTop));
            ctx.stroke();
            curX += res;//increment by grid line resolution
            exactX = exactX.add(this.exactRes.multiply(this.xRes));
        }
    }
}

function getGrid(gridRes, res, gridMin, gridMax, fd, bd){
    if(gridRes < gridMin){
        if(fd == 1 || fd == 5){//if the first digit is 1 or 5
            return res.multiply(new bd.BigDecimal(`2`));//multiply res by 2
        }else{//first digit is 2
            return res.multiply(new bd.BigDecimal(`2.5`));//multiply res by 5/2
        }
    }else if(gridRes > gridMax){
        if(fd == 1 || fd == 2){//if the first digit is 1 or 2
            return res.divide(new bd.BigDecimal(`2`));//divide res by 2
        }else{//first digit is five
            return res.multiply(new bd.BigDecimal(`0.4`));//multiply res by 2/5
        }
    }
    return res;
}

function eify(x){
    if(Math.abs(x) > 1e+7){
        var log = Math.floor(Math.log10(Math.abs(x)));
        return `${x / Math.pow(10, log)}e+${log}`;
    }else{
        return `${x}`;
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

var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

function toPlaces(number, places){
    return Math.round(Math.pow(10, places) * number) / Math.pow(10, places);
}

function firstDigit(num){
    return Math.floor(num / Math.pow(10, Math.floor(Math.log10(num))));
}