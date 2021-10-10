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
        //let points = [{x: x, y: 0}, {x: x1, y: y}, {x: x2, y: y}];
        let points = `${x1},0 ${x2},0 ${x},${y}`;
        this.tri.attr("points", points);
        this.cursor
            .attr("x1", this.timeX(this.command.time))
            .attr("y1", 0)
            .attr("x2", this.timeX(this.command.time))
            .attr("y2", this.scrH);
        /*this.tri.data([points])
        .enter().append("polygon")
          .attr("points",function(d) { 
              return d.map(function(d) {
                  return [d.x,d.y].join(",");
              }).join(" ");
          });*/
    }
    //
    draw(ctx){
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
            ctx.beginPath();
            ctx.moveTo(0, 12 * n);//draw line from bottom to top at current x
            ctx.lineTo(this.scrW, 12 * n);
            ctx.stroke();
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