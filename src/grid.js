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
        this.yRes = this.bd.BigDecimal(`1`);//frequency of any lines (internal unit values), impervious to floating point errors
        this.xRes = this.bd.BigDecimal(`1`);//frequency of x axis lines
        //
        this.cx = cx;//center position in units, describes the grid position the field of view is positioned around
        this.cy = cy;
        this.scale = scale;//y scale defines as y units across height (ex. 20)
        this.strX = 1;//x stretch multiplies by y scale
        //
        //this.iqrThres = 1.7;//
        //
        this.calcSize();
        this.command.canvas.width = this.scrW;
        this.command.canvas.height = this.scrH;
        //
        this.gridMin = this.getGridRes() / 2;//minimum distance between grid lines (pixels)
        this.gridMax = this.getGridRes() * 2;//minimum distance between grid lines (pixels)
        //
        this.draw(ctx);
        //
        let self = this;
        d3.select('#squareButton').on('click', function(){
            self.square();
        });
        //
        d3.select('#normalizeButton').on('click', function(){
            self.normalize();
            //self.resize();//fix this
        });
    }
    //
    /**
     * Recalculate grid scale (scaleX, scaleY)
     */
    calcSize(setProps = true){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        this.command.scrW = parseInt(this.svg.style("width"));
        this.command.scrH = parseInt(this.svg.style("height"));
        //
        let bt = (this.scale / -2) + this.cy;//get screen top and bottom in units
        let tp = bt + this.scale;
        //
        let xSc = this.scale * this.scrW / (this.scrH * this.strX);//get number of x units using scale and x stretch
        //console.log(`xSc: ${xSc}`);
        let lf = (xSc / -2) + this.cx;//get screen left and right in units
        let rt = lf + xSc;
        //
        this.command.scaleY = d3.scaleLinear().domain([bt, tp]).range([this.scrH, 0]);//declare scale functions for converting units to pixels
        this.command.scaleX = d3.scaleLinear().domain([lf, rt]).range([0, this.scrW]);
        this.conX = d3.scaleLinear().domain([0, this.scrW]).range([0, xSc]);
        this.conY = d3.scaleLinear().domain([0, this.scrH]).range([0, -this.scale]);
        //
        let fd = firstDigit(this.superRes * (parseFloat(this.yRes)));//redo the gridlines
        this.yRes = getGrid(this.getGridRes(true), this.yRes, this.gridMin, this.gridMax, fd, this.bd);
        //
        fd = firstDigit(this.superRes * (parseFloat(this.xRes)));//redo the gridlines for x axis
        this.xRes = getGrid(this.getGridRes(false) * this.strX, this.xRes, this.gridMin, this.gridMax, fd, this.bd);
        //
        if(setProps){
            d3.select('#x1Bound').property('value', lf.toFixed(3));
            d3.select('#x2Bound').property('value', rt.toFixed(3));
            d3.select('#y1Bound').property('value', bt.toFixed(3));
            d3.select('#y2Bound').property('value', tp.toFixed(3));
        }
    }
    //
    square(){
        this.strX = 1;
        //
        this.calcSize();
        //
        this.customResize();
        this.xRes = this.yRes;
        this.customResize();
    }
    //
    normalize(){
        var Xextrs = [];
        var Yextrs = [];
        var extrs = [];
        //
        this.command.objects.forEach(obj => {
            obj.extremes.forEach(extr => {
                let pos = obj.getVals(0, extr);
                extrs.push([extr, pos[0], pos[1]])
            });
            extrs.push([this.command.time, obj.xS[0], obj.yS[0]]);
        });
        //
        extrs = this.filterOutliers(extrs);
        //
        switch(this.command.viewType){
            case 0:
                Xextrs = extrs.map(extr => extr[1]);//positions match values
                Yextrs = extrs.map(extr => extr[2]);
                break;
            case 1:
                Xextrs = extrs.map(extr => extr[0]);//x position is time
                Yextrs = extrs.map(extr => extr[1]);//y position is x value
                break;
            case 2:
                Xextrs = extrs.map(extr => extr[0]);//x position is time
                Yextrs = extrs.map(extr => extr[2]);//y position is y value
                break;
        }
        //
        const sort = arr => arr.sort(function(a, b) {
            return a - b;
        });
        //
        Xextrs = sort(Xextrs);
        Yextrs = sort(Yextrs);
        //
        let left = Xextrs[0];
        let right = Xextrs[Xextrs.length - 1];
        let bottom = Yextrs[0];
        let top = Yextrs[Yextrs.length - 1];
        //
        let bufferX = (right - left) / 4;
        let bufferY = (top - bottom) / 4;
        //
        //add code here to check if either bounds match each other, and if they do then square the scale and center the bounds
        if(left == right){
            if(top == bottom){//only one point in lists
                this.scale = this.command.defaultScale;//set defualt square scale and center the one point
                this.strX = 1;
                //
                this.cx = left;
                this.cy = bottom;
                //
                this.calcSize(true);
                this.customResize();
            }else{//only vertical diversity
                this.scale = (top - bottom) + (2 * bufferY);//set a square scale by the vertical axis
                this.strX = 1;
                //
                this.cx = left;
                this.cy = bottom - bufferY + (this.scale / 2);
                //
                this.calcSize(true);
                this.customResize();
            }
        }else if(top == bottom){//only horizontal diversity
            //set a square scale by the horizontal axis
            this.scale = ((right - left) + (2 * bufferX)) * (this.scrW / this.scrH);
            this.strX = 1;
            //
            this.cx = left + bufferX + (((right - left) + (2 * bufferX)) / 2);
            this.cy = bottom;
            //
            this.calcSize(true);
            this.customResize();
        }else{
            this.setSizeByEdge({left: left - bufferX, right: right + bufferX, top: top + bufferY, bottom: bottom - bufferY, setProps: true});
        }
    }
    //
    filterOutliers(values){
        values.sort(function(a, b) {
            return a[0] - b[0];
        });
        //
        /* Then find a generous IQR. This is generous because if (values.length / 4) 
        * is not an int, then really you should average the two elements on either 
        * side to find q1.
        */     
        var q1 = values[Math.floor(((values.length - 1) / 4))][0];
        // Likewise for q3. 
        //console.log(`${((values.length - 1) * (3 / 4))} to ${Math.ceil((values.length * (3 / 4)))}`);
        var q3 = values[Math.ceil(((values.length - 1) * (3 / 4)))][0];
        var iqr = q3 - q1;
        //
        // Then find min and max values
        var maxValue = q3 + iqr*1.5;//add iqr adjustment
        var minValue = q1 - iqr*1.5;

        // Then filter anything beyond or beneath these values.
        var filteredValues = values.filter(function(x) {
            return (x[0] <= maxValue) && (x[0] >= minValue);
        });
        //
        return filteredValues;
    }
    //
    setSizeByEdge({left, right, top, bottom, setProps = false}={}){
        console.log(`resizing`);
        if(left == null){
            left = this.command.scaleX.domain()[0];
        }
        if(right == null){
            right = this.command.scaleX.domain()[1];
        }
        if(top == null){
            top = this.command.scaleY.domain()[1];
        }
        if(bottom == null){
            bottom = this.command.scaleY.domain()[0];
        }
        //
        console.log(`left: ${left}, right: ${right}`);
        console.log(`top: ${top}, bottom: ${bottom}`);
        //
        this.scale = top - bottom;
        this.strX = this.scale * this.scrW / ((right - left) * this.scrH);
        //
        console.log(`new scale: ${this.scale}, stretch: ${this.strX}`);
        //
        this.cx = left + ((right - left) / 2);
        this.cy = bottom + (this.scale / 2);
        this.calcSize(setProps);
        //
        console.log(`cx: ${this.cx}, cy: ${this.cy}`);
        //
        this.customResize();
    }
    //
    customResize(){
        var curRes = this.getGridRes(true);
        while(curRes < this.gridMin || curRes > this.gridMax){//resizing may need to be done several times
            let fd = firstDigit(this.superRes * (parseFloat(this.yRes)));//redo the gridlines
            this.yRes = getGrid(curRes, this.yRes, this.gridMin, this.gridMax, fd, this.bd);
            curRes = this.getGridRes(true);
            console.log(`curres: ${curRes}, yres: ${this.yRes}`);
        }
        //
        console.log(`gridMin: ${this.gridMin}, gridMax: ${this.gridMax}`);
        curRes = this.getGridRes(false) * this.strX;
        while(curRes < this.gridMin || curRes > this.gridMax){
            let fd = firstDigit(this.superRes * (parseFloat(this.xRes)));//redo the gridlines for x axis
            this.xRes = getGrid(curRes, this.xRes, this.gridMin, this.gridMax, fd, this.bd);
            curRes = this.getGridRes(false) * this.strX;
            console.log(`curres: ${curRes}, xres: ${this.xRes}, fd: ${fd}`);
        }
        //
        this.command.drawGrid();
        this.command.moveGrid();
        this.command.moveExtremes();
        this.command.moveSelects();
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
        if((-Math.log10(this.scale) < 12 || c > 1) && (Math.log10(this.scale) < 20 || c < 1)){//check for zoom bounds
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
    getGridRes(yq){
        return this.scrH / (this.scale / parseFloat(yq ? this.yRes : this.xRes));
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
        let yRes = parseFloat(this.yRes);
        let xRes = parseFloat(this.xRes);
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
        var curY = Math.ceil(yBot / yRes) * yRes;//get first y line position
        var exactY = this.yRes.multiply(new this.bd.BigDecimal(`${Math.ceil(yBot / yRes)}`));//exact line position with big decimal
        //
        for (var n = 0; n < (this.scale / yRes); n++){
            if(parseFloat(exactY) == 0){
                ctx.lineWidth = 4;
            }else if(parseFloat(exactY.divide(this.yRes) % this.superRes) / (this.superRes + 1) == 0){
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
            curY += yRes;//increment by grid line resolution
            exactY = exactY.add(this.yRes);
        }
        //
        var curX = Math.ceil(xLeft / xRes) * xRes;//get first x line position
        var exactX = this.xRes.multiply(new this.bd.BigDecimal(`${Math.ceil(xLeft / xRes)}`));//new bigdecimal.BigDecimal(`${Math.ceil(xLeft / res) * this.exactRes}`);
        //
        for(var n = 0; n < ((xRight - xLeft) / xRes); n++){//loop for number of lines (if multiple of res, there will be a line at the left of the screen)
            if(parseFloat(exactX) == 0){
                ctx.lineWidth = 4;
            }else if(parseFloat(exactX.divide(this.xRes) % this.superRes) / (this.superRes + 1) == 0){
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
            curX += xRes;//increment by grid line resolution
            exactX = exactX.add(this.xRes);
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