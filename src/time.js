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
        this.triSize = 20;//triangle size in px
        //
        this.calcSize();
        canvas.width = this.scrW;
        canvas.height = this.scrH;
        //
        this.gridMin = this.getGridRes() / 2;//minimum distance between grid lines (pixels)
        this.gridMax = this.getGridRes() * 2;//minimum distance between grid lines (pixels)
        //
        this.timePoints = [];
        //
        this.draw(this.ctx);
        //
        this.cursor = this.svg.append("line").style("stroke", "#47a3ff").style("stroke-width", 4);
        this.tri = this.svg.append("polygon").style("fill", "#47a3ff");
        this.move();
        //console.log(`Domain: ${this.timeX.domain()[0]} to ${this.timeX.domain()[1]}, Range: ${this.timeX.range()[0]} to ${this.timeX.range()[1]}`);
    }
    //
    calcSize(){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        let lf = (this.scale / -2) + this.cx;//get screen left and right in units
        let rt = lf + this.scale;
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
    //
    zoom(c, px){
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
        let mx = this.command.timeX.invert(px);
        //
        this.cx = mx - ((mx - this.cx) * c);
        //
        this.calcSize();
    }
    getGridRes(){
        return this.scrW / (this.scale / this.res);
    }
    //
    move(){
        let x = this.timeX(this.command.time);
        let x1 = x - (this.triSize / 2);
        let x2 = x + (this.triSize / 2);
        //
        let y = this.triSize / 2 * Math.sqrt(2);
        //
        let points = `${x1},0 ${x2},0 ${x},${y}`;
        this.tri.attr("points", points);
        this.cursor
            .attr("x1", this.timeX(this.command.time))
            .attr("y1", 0)
            .attr("x2", this.timeX(this.command.time))
            .attr("y2", this.scrH);
        //
        this.command.objects.forEach((obj, idx) => {
            if(idx < this.timePoints.length){//object has already been pointed
                var n;
                for(n = 0; n < this.timePoints[idx].length && n < obj.extremes.length; n++){//set position for every point that already exists
                    this.timePoints[idx][n].attr("val", obj.extremes[n])
                        .attr("cx", this.timeX(obj.extremes[n]))//convert time of extreme to x in pixels
                        .attr("cy", 12 * idx + 12);//height from top depends on object index
                }
                while(this.timePoints[idx].length < obj.extremes.length){//add points until there are the same name number
                    this.timePoints[idx].push(this.svg.append("circle").style("fill", obj.color).attr("val", obj.extremes[n]).attr("ob", obj.id)
                    .attr("r", 5)
                    .attr("cx", this.timeX(obj.extremes[n]))//convert time of extreme to x in pixels
                    .attr("cy", 12 * idx + 12));//height from top depends on object index
                    n++;
                    this.command.input.newPoint(this.timePoints[idx][this.timePoints[idx].length - 1]);
                }
                while(this.timePoints[idx].length > obj.extremes.length){
                    this.timePoints[idx][this.timePoints[idx].length - 1].remove();
                    this.command.input.removePoint(this.timePoints[idx][this.timePoints[idx].length - 1]);
                    this.timePoints[idx].pop();
                    console.log("Removing circle");
                }
            }else{//object has not yet been pointed
                var objPoints = [];
                obj.extremes.forEach(extr => {
                    objPoints.push(this.svg.append("circle").style("fill", obj.color).attr("val", extr).attr("ob", obj.id)
                    .attr("r", 5)
                    .attr("cx", this.timeX(extr))//convert time of extreme to x in pixels
                    .attr("cy", 12 * idx + 12));
                    this.command.input.newPoint(objPoints[objPoints.length - 1]);
                });
                this.timePoints.push(objPoints);
            }
        });
    }
    //
    draw(){
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.scrW, this.scrH);
        //
        let res = this.res;
        //
        let xLeft = this.timeX.domain()[0];//get x left and right (in units)
        let xRight = this.timeX.domain()[1];
        //
        ctx.lineCap = "round";
        ctx.strokeStyle = "gray";
        var curX = Math.ceil(xLeft / res) * res;//get first x line position
        for(var n = 0; n < ((xRight - xLeft) / res); n++){//loop for number of lines (if multiple of res, there will be a line at the left of the screen)
            ctx.lineWidth = this.sizeLine(ctx, curX) * .5;
            ctx.beginPath();
            ctx.moveTo(this.timeX(curX), 0);//draw line from bottom to top at current x
            ctx.lineTo(this.timeX(curX), this.scrH);
            ctx.stroke();
            curX += res;//increment by grid line resolution
        }
        //
        ctx.lineWidth = 4;
        var n = 1;
        this.command.objects.forEach(object => {
            ctx.strokeStyle = object.color;
            ctx.fillStyle = object.color;
            ctx.beginPath();
            ctx.moveTo(0, 12 * n);
            ctx.lineTo(this.scrW, 12 * n);
            ctx.stroke();
            //
            /*object.extremes.forEach(extr => {
                ctx.beginPath();
                ctx.arc(this.timeX(extr), 12 * n, 5, 0, 2 * Math.PI);
                ctx.fill();
            });*/
            //
            n++;
        });
    }
    //
    sizeLine(ctx, pos){
        let ctx2 = ctx;
        let strength = 4 - Math.ceil(Math.abs((pos % this.superRes) / this.superRes)) - 2* Math.ceil(Math.abs(pos / 100000));//for every super res line, make more bold
        return 2 * (strength - 1) + 1;
    }
}