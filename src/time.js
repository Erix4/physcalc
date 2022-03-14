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
        //
        let self = this;
        d3.select('#norm').on('click', function(){
            self.normalize();
        });
    }
    //
    /**
     * Recalculate time scale (timeX)
     */
    calcSize(setProps = true){
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        let lf = (this.scale / -2) + this.cx;//get screen left and right in units
        let rt = lf + this.scale;
        //
        this.timeX = d3.scaleLinear().domain([lf, rt]).range([0, this.scrW]);
        this.conTime = d3.scaleLinear().domain([0, this.scrW]).range([0, this.scale]);
        //
        if(setProps){
            d3.select('#leftTimeBound').property('value', lf.toFixed(3));
            d3.select('#rightTimeBound').property('value', rt.toFixed(3));
        }
    }
    //
    /**
     * resize the timeline by changing one or more of the edges
     * @param {Number} [left]  the left boundary to change
     * @param {Number} [right] the right boundary to change
     */
    setSizeByEdge({left, right, setProps = false}={}){
        console.log(`resizing`);
        if(left == null){
            left = this.timeX.domain()[0];
        }else if(right == null){
            right = this.timeX.domain()[1];
        }
        //
        this.scale = right - left;
        this.cx = left + (this.scale / 2);
        this.calcSize(setProps);
        //
        while(this.getGridRes() < this.gridMin){
            this.res *= 4;
            this.superRes *= 4;
        }
        while(this.getGridRes() > this.gridMax){
            this.res /= 4;
            this.superRes /= 4;
        }
    }
    //
    normalize(){
        var extrs = [];
        this.timePoints.forEach(obj => {
            obj.forEach(point => {
                extrs.push(parseFloat(point.attr('val')));
            });
        });
        //
        var values = extrs.slice();
        //
        values.sort( function(a, b) {
            return a - b;
        });
        //
        /* Then find a generous IQR. This is generous because if (values.length / 4) 
        * is not an int, then really you should average the two elements on either 
        * side to find q1.
        */     
        var q1 = values[Math.floor(((values.length - 1) / 4))];
        // Likewise for q3. 
        console.log(`${((values.length - 1) * (3 / 4))} to ${Math.ceil((values.length * (3 / 4)))}`);
        var q3 = values[Math.ceil(((values.length - 1) * (3 / 4)))];
        var iqr = q3 - q1;
        //
        // Then find min and max values
        var maxValue = q3 + iqr*1.5;
        var minValue = q1 - iqr*1.5;

        // Then filter anything beyond or beneath these values.
        var filteredValues = values.filter(function(x) {
            return (x <= maxValue) && (x >= minValue);
        });
        //
        let buffer = (filteredValues[filteredValues.length - 1] - filteredValues[0]) / 4;
        //
        this.setSizeByEdge({left: filteredValues[0] - buffer, right: filteredValues[filteredValues.length - 1] + buffer, setProps: true});
        this.draw();
        this.move();
        this.command.retimeExtremes();
    }
    //
    /**
     * Reformat canvas on resize event
     */
    resize(){
        this.calcSize();
        this.canvas.width = this.scrW;
        this.canvas.height = this.scrH;
        this.move();
        this.movePoints();
        //
        //let fullH = d3.select("#scroll-i").style("height");
        //console.log(fullH);
        //if(this.command.objects.length * 12 > fullH){
            //console.log("Changing height");
            //this.canvas.height = this.command.objects.length * 12;
            //this.svg.style("height", this.command.objects.length * 12);
        //}else{
            //this.svg.style("height", fullH);
            //this.canvas.height = this.scrH;
        //}
    }
    //
    /**
     * shift the view position of the timeline
     * @param {Number} px 
     */
    shiftPos(cx){//reposition field
        this.cx -= cx;
        //
        this.calcSize();
    }
    //
    /**
     * zoom timeline view around mouse position
     * @param {Number} c  amount to change by (multiplier)
     * @param {Number} px x position to zoom around in pixels
     */
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
        let mx = this.timeX.invert(px);
        //
        this.cx = mx - ((mx - this.cx) * c);
        //
        this.calcSize();
    }
    /**
     * find the distance between grid units of res
     * @returns distance between grid lines in pixels
     */
    getGridRes(){
        return this.scrW / (this.scale / this.res);
    }
    //
    getNearTime(t){
        var timeSinks = [];
        //
        let res = this.res;
        //
        let xLeft = this.timeX.domain()[0];//get x left and right (in units)
        let xRight = this.timeX.domain()[1];
        //
        var curX = Math.ceil(xLeft / res) * res;//get first x line position
        for(var n = 0; n < ((xRight - xLeft) / res); n++){//loop for number of lines (if multiple of res, there will be a line at the left of the screen)
            timeSinks.push(curX);//add every grid line to timeSinks
            curX += res;//increment by grid line resolution
        }
        //
        this.command.objects.forEach(obj => {
            if(obj != this.command.selected){
                obj.extremes.forEach(extr => timeSinks.push(extr));
            }
        });
        //
        let nearTime = timeSinks.reduce((prev, curr) => {//find nearest time sink
            return Math.abs(curr - t) < Math.abs(prev - t) ? curr : prev;
        });
        //
        if(nearTime > xLeft && nearTime < xRight && Math.abs(nearTime - t) < (this.scale / 80)){
            return nearTime;
        }
        return t;
    }
    //
    getNextTime(t, before=false){
        var timeSinks = [];
        //
        this.command.objects.forEach(obj => {
            obj.extremes.forEach(extr => timeSinks.push(extr));
        });
        //
        if(before){
            timeSinks.sort((a, b) => a - b);
            return timeSinks.find(x => x > t) == undefined ? t : timeSinks.find(x => x > t);
        }else{
            timeSinks.sort((a, b) => b - a);
            return timeSinks.find(x => x < t) == undefined ? t : timeSinks.find(x => x < t);
        }
    }
    //
    /**
     * update cursor position
     */
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
    }
    //
    /**
     * move all the extreme points for certain objects
     * @param {Array<Number;} [objIs] list of indexs of objects
     */
    movePoints(objIs){
        if(!objIs){
            var objIs = this.command.findIdxs(this.command.objects);
        }
        //
        objIs.forEach(id => {
            this.command.objects[id].extremes = this.command.objects[id].profile.getExtremes();
            this.timePoints[id].forEach((point, n) => {
                point.attr("val", this.command.objects[id].extremes[n]).attr("cx", this.timeX(this.command.objects[id].extremes[n]));//convert time of extreme to x in pixels
            });
        });
    }
    //
    colorPoints(objIds){
        objIds.forEach(idx => {
            this.timePoints[idx].forEach((point, n) => {
                point.style("fill", this.command.objects[idx].points[n].style("fill"));
            });
        })
    }
    //
    /**
     * respawn extremes of given points in timeline
     * @param {Array<Number} objIds ids of all objects to respawn extremes for
     */
    spawnExtremes(objIds){
        objIds.forEach(idx => {
            let obj = this.command.objects[idx];
            if(idx < this.timePoints.length){//object has already been pointed
                var n;
                for(n = 0; n < this.timePoints[idx].length && n < obj.extremes.length; n++){//set position for every point that already exists
                    this.timePoints[idx][n].attr("val", obj.extremes[n]).style("fill", obj.points[n].style("fill"))
                        .attr("cx", this.timeX(obj.extremes[n]))//convert time of extreme to x in pixels
                        .attr("cy", 12 * idx + 12);//height from top depends on object index
                }
                while(this.timePoints[idx].length < obj.extremes.length){//add points until there are the same name number
                    this.timePoints[idx].push(this.svg.append("circle").style("fill", obj.points[n].style("fill")).attr("val", obj.extremes[n]).attr("ob", obj.id)
                    .attr("r", 5)
                    .attr("cx", this.timeX(obj.extremes[n]))//convert time of extreme to x in pixels
                    .attr("cy", 12 * idx + 12));//height from top depends on object index
                    n++;
                    this.command.input.newPoint(this.timePoints[idx][this.timePoints[idx].length - 1]);
                }
                while(this.timePoints[idx].length > obj.extremes.length){
                    this.timePoints[idx][this.timePoints[idx].length - 1].remove();
                    this.timePoints[idx].pop();
                }
            }else{//object has not yet been pointed
                var objPoints = [];
                obj.extremes.forEach((extr, n) => {
                    objPoints.push(this.svg.append("circle").style("fill", obj.points[n].style("fill")).attr("val", extr).attr("ob", obj.id)
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
    deleteExtreme(objIdx){
        console.log(`idx: ${objIdx}`);
        this.timePoints[objIdx].forEach(point => {
            point.remove();
        });
        this.timePoints.splice(objIdx, 1);
    }
    //
    /**
     * draw the grid lines on the timeline
     */
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