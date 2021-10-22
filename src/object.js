/*
On creation, the following things can happen:
1. An object is created at the center of the screen
2. The user clicks and drags the object to where they want it or enter a few numbers for its position (enter for confirm)
    - at any time in inputs, the user can press tab to switch coord type to polar
    - during value process, text below object will prompt user to confirm position, velocity, acceleration
3. A vector for velocity appears, user can click and drag vector head or enter inputs in props (enter for confirm)
4. Component vector for acceleration appears, with unclickable gravity and net accel and clickable new acceleration
    - gravity component will only appear if gravity is toggled on
5. Based on inputs, the object will solve all other properties
If at any point the user clicks off the object (onto the grid) or off the props inputs (onto the left column),
    the remaining values will be negated, and the object will become UNSOLVED
An UNSOLVED object will have a warning at the top of props and will be static over time

After creation, the following things can happen:
    - the object's values can be changed at any time, leading to a resolve
    - the object's equations can be changed at any time, leading to a resolve
    - the object's Net force or mass can be changed at any time, leading to a resolve
        - the nongravity force component will affect nongravity acceleration component (a = F/m)
    - the object can be solved or resolved at any time with the Calc prop
    - the values of an object at a given time can be calculated at any time with the Calc prop (this will also change the current time)
    - a new component can be applied to any value with the Apply prop

Object capabilities:
    - creation stages from input
    - unsolved status (dynamic, static)
    - resolve by values
    - resolve by equations
    - resolve by force
    - resolve by calc
    - calc at point
    - apply values, then resolve by value
    - contain motion profile (all function descriptors)
    - contain and calc visiblity domain on resize
*/

import Profile from "./func";

export default class Object{
    constructor(command, id, px, py){
        this.command = command;
        this.field = command.field;
        //
        this.id = id;
        this.toBeDeleted = false;
        //
        this.hue = 35 * this.id;//0 = red
        this.color = `hsl(${this.hue}, 100%, 50%`;
        //
        this.gravity = command.gravity;
        //
        this.lock = false;
        //
        this.status = 0;//motion status, 0 = confirm position, 1 = confirm velocity, 2 = confirm acceleration, 3 = dynamic, 4 = static
        this.vectorMode = 0;//0 is hidden, anything higher corresponds to power
        //
        this.depth = 2;
        //
        this.px = this.command.scaleX.invert(px);//current values
        this.py = this.command.scaleY.invert(py);
        this.xS = [];//refactor for expandable values, power ascends (0, 1, 2...)
        this.yS = [];
        this.vx = 5;//starting values, not used later
        this.vy = 5;
        this.ax = 0;
        this.ay = 0;
        //
        this.profile = new Profile(this.command, this.depth, [this.ax / 2, this.vx, this.px], [this.ay / 2, this.vy, this.py], this.color);
        this.profile.addComp(2, [0], [this.gravity]);
        //
        this.extremes = [];
        this.points = [];//svg points that illustrate extremes
        //
        for(var n = 0; n <= this.depth; n++){
            this.xS.push(this.profile.calc(n, command.time)[0]);
            this.yS.push(this.profile.calc(n, command.time)[1]);
        }
        //
        this.arrStr = 1 / 4;//amount to stretch arrow vs real numbers
        this.nets = [];
        this.comps = [];
        for(var n = 1; n < this.profile.paras.length; n++){//make an arrow for every para except position
            this.nets.push(new netArrow(command, this, n));
            this.profile.comps[n].forEach(comp => {
                this.comps.push([]);
            });
            console.log(this.comps);
            for(var a = 0; a < this.profile.comps[n].length; a++){
                this.comps[n - 1][this.profile.comps[n].length - a - 1] = new compArrow(command, this, n, this.profile.comps[n].length - a - 1);
            }
        }
        this.comps.forEach(comp => {
            comp.forEach(arrow => {
                arrow.self.head.raise();
            });
        });
        this.nets.forEach(net => {
            net.self.neck.raise();
            net.self.tailA.raise();
            net.self.tailB.raise();
            net.self.head.raise();
        })
        //
        this.svg = command.svg;
        //
        this.self = this.svg.append("circle").style("fill", this.color).style("stroke", `hsl(${this.hue}, 65%, 20%`).style("stroke-width", 7)
        .attr("r", 20);
        /*.style("visibility", "hidden")*/;
        //
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        //
        command.input.newObject(this);
        command.drawGrid();
        command.drawTimeline();
    }
    //
    //#region Illustration
    /**
     * Update all internal values by function
     */
    update(){
        if(this.lock){
            this.setValue(0, this.px, this.py);//resolve function to shift the time
            this.command.retimeExtremes([this]);
        }
        this.px = this.profile.calc(0, this.command.time)[0];
        this.py = this.profile.calc(0, this.command.time)[1];
        for(var n = 0; n <= this.depth; n++){
            this.xS[n] = this.profile.calc(n, this.command.time)[0];
            this.yS[n] = this.profile.calc(n, this.command.time)[1];
        }
        //
        this.updateVectors();
        this.profile.setOrigin();
    }
    //
    /**
     * update all or one vector position(s)
     * @param {Number} [power] the power of the vectors to be updated (1=vel)
     */
    updateVectors(power){
        if(this.power){
            this.nets[power - 1].update();
            this.comps[power - 1].forEach(comp => {
                comp.update();
            });
        }else{
            this.nets.forEach(net => {
                net.update();
            });
            for(var n = 0; n < 2; n++){//repeat to propagate changes
                this.comps.forEach(comp => {
                    comp.forEach(arrow => {
                        arrow.update();
                    });
                });
            }
        }
    }
    //
    /**
     * Move the SVG element for the object
     */
    move(){
        this.self.attr("cx", this.command.scaleX(this.px))
                .attr("cy", this.command.scaleY(this.py))
                .style("visibility", "visible");
        //
        this.moveVectors();
    }
    //
    /**
     * move all SVG elements of all or one power of vectors
     * @param {Number} power power of vectors to move
     */
    moveVectors(power){
        if(power){
            this.nets[power - 1].move();
            this.comps[power - 1].forEach(comp => {
                comp.move();
            });
        }else{
            this.nets.forEach(net => {
                net.move();
            });
            this.comps.forEach(comp => {
                comp.forEach(arrow => {
                    arrow.move();
                });
            });
        }
    }
    //
    /**
     * Draw the function of the object
     * @param {Class} input input handler
     */
    draw(input){
        if((input.moveState == 3) && input.active != this){//new object is being created
            this.command.ctx.globalAlpha = 0.2;
            this.profile.draw(0, 500);
            //this.movePoints();
            //this.profile.drawPoints(this.extremes);
            this.command.ctx.globalAlpha = 1.0;
            this.self.style("fill-opacity", 0.2).style("stoke-opacity", 0.2);
        }else if (!(input.moveState == 3 && input.active == this)){//if not being position confirmed
            this.profile.draw(0, 500);
            //this.movePoints();
            //this.profile.drawPoints(this.extremes);
            this.self.style("fill-opacity", 1).style("stoke-opacity", 1.0);
        }
    }
    //
    /**
     * toggle/set the vector mode for this object
     * @param {number} mode vectormode to set object to
     */
    toggleVectors(mode){
        this.updateVectors(mode);
        this.moveVectors(mode);
        //
        this.vectorMode = mode;
        this.comps.forEach(comp => {
            comp.forEach(arrow => {
                arrow.self.hide();
            });
        });
        this.nets.forEach(net => {
            net.self.hide();
        });
        //
        if(this.vectorMode > 0){
            this.nets[this.vectorMode - 1].self.show();
            this.comps[this.vectorMode - 1].forEach(arrow => {
                arrow.show();
            });
        }
    }
    //#endregion
    //
    //#region Setting Values
    /**
     * shift the net value at a given power with pixels
     * @param {Number} power  power of value to shift (2=x^2)
     * @param {Number} xShift x shift in pixels
     * @param {Number} yShift y shift in pixels
     */
    shiftValue(power, xShift, yShift){
        let xPos = this.command.scaleX.invert(this.command.scaleX(this.px) + xShift);
        let yPos = this.command.scaleY.invert(this.command.scaleY(this.py) + yShift);
        this.setValue(power, xPos, yPos);
    }
    //
    /**
     * set the net value at a given power with units
     * @param {Number} power power of value to set
     * @param {Number} xPos  x value in units
     * @param {Number} yPos  y value in units
     */
    setValue(power, xPos, yPos){
        this.profile.setValues(power, xPos, yPos);
    }
    //
    /**
     * shift the value of a component (in pixels)
     * @param {Number} power  power of component
     * @param {Number} idx    index of component
     * @param {Number} xShift x shift amount in pixels
     * @param {Number} yShift y shift amount in pixels
     */
    shiftCompValue(power, idx, xShift, yShift){
        let xPos = this.command.scaleX.invert(this.command.scaleX(this.profile.comps[power][idx].getTermX(0)) + xShift);
        let yPos = this.command.scaleY.invert(this.command.scaleY(this.profile.comps[power][idx].getTermY(0)) + yShift);
        this.setCompValue(power, idx, xPos, yPos);
    }
    //
    /**
     * set the value of a component (in units)
     * @param {Number} power power of component
     * @param {Number} idx   index of component
     * @param {Number} xPos  new x position in units
     * @param {Number} yPos  new y position in units
     */
    setCompValue(power, idx, xPos, yPos){
        this.profile.setCompVal(power, idx, xPos, yPos);
    }
    //#endregion
    //
    /**
     * lock the object so it slide in time
     */
    toggleLock(){
        this.lock = !this.lock;
        if(this.lock){
            this.self.style("fill", "gray");
        }else{
            this.self.style("fill", this.color);
        }
    }
    //
    /**
     * remove and respawn extreme points
     */
    spawnExtremes(){
        this.extremes = this.profile.getExtremes();
        var n;
        for(n = 0; n < this.points.length && n < this.extremes.length; n++){//set position for every point that already exists
            this.points[n].attr("val", this.extremes[n]).style("fill", this.color)
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))//get x and y position at given time
                .attr("cy", Math.round(this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));//
        }
        while(this.points.length < this.extremes.length){//add points until there are the same name number
            this.points.push(this.svg.append("circle").style("fill", this.color)
                .attr("r", 6)
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))
                .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));
            this.points[n].lower();
            this.command.input.newObjPoint(this, this.points[this.points.length - 1]);
            n++;
        }
        while(this.points.length > this.extremes.length){
            this.points[this.points.length - 1].remove();
            this.points.pop();
        }
    }
    //
    /**
     * move all extreme points (when grid is shifted)
     */
    movePoints(){
        for(var n = 0; n < this.points.length; n++){//set position for every point that already exists
            this.points[n].attr("val", this.extremes[n])
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))//get x and y position at given time
                .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1]));//
        }
    }
    //
    /**
     * Delete this object and its SVG elements
     */
    delete(){
        this.toBeDeleted = true;
        //
        this.self.remove();
        //
        this.nets.forEach(net => {
            net.self.delete();
        });
        this.comps.forEach(comp => {
            comp.forEach(c => {
                c.self.delete();
            });
        });
        //
        this.points.forEach(point => {
            point.remove();
        });
        //
        this.command.deleteExtreme(this);
        this.command.updateGrid();
        this.command.drawGrid();
        this.command.drawTimeline();
        this.command.select();
    }
    //
    /*update(){
        if(!this.lock){
            this.px = this.profile.calc(0, this.command.time)[0];
            this.py = this.profile.calc(0, this.command.time)[1];
            for(var n = 0; n <= this.depth; n++){
                this.xS[n] = this.profile.calc(n, this.command.time)[0];
                this.yS[n] = this.profile.calc(n, this.command.time)[1];
            }
            //
            this.nets.forEach(net => {
                net.update();
            });
            this.comps.forEach(comp => {
                comp.forEach(arrow => {
                    arrow.update();
                });
            });
            this.comps.forEach(comp => {
                comp.forEach(arrow => {
                    arrow.update();
                });
            });
        }else{
            this.slideTime();
        }
        this.profile.setOrigin();
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        //this.pFunc.setOff(this.px, this.py);
        //this.movePoints();
        this.reposPoints();
        //
        //this.pxfunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);
        //
    }
    //
    slideTime(){
        this.profile.setValues(0, this.px, this.py);
        this.nets.forEach(net => {
            net.self.update();
        });
        this.comps.forEach(comp => {
            comp.forEach(arrow => {
                arrow.self.update();
            });
        });
    }
    //
    repos(px, py){
        this.px = this.command.scaleX.invert(px);
        this.py = this.command.scaleY.invert(py);
        this.profile.setValues(0, this.px, this.py);
        //
        this.command.objUpdate(this);
    }
    //
    rekey({power, xShift, yShift, xPos, yPos}={}){
        //console.log(xShift);
        if(xShift != undefined || yShift != undefined){
            if(xShift == undefined){
                xShift = 0;
            }
            if(yShift == undefined){
                yShift = 0;
            }
            xPos = this.command.scaleX(this.px) + xShift;
            yPos = this.command.scaleY(this.py) + yShift
        }else{
            if(xPos == undefined){
                xPos = this.command.scaleX(this.px);
            }
            if(yPos == undefined){
                yPos = this.command.scaleY(this.py);
            }
        }
        //
        this.movePoints();
        //
        this.px = this.command.scaleX.invert(xPos);
        this.py = this.command.scaleY.invert(yPos);
        this.profile.setValues(power, this.px, this.py);
    }
    //
    retime(){
        this.px = this.profile.paras[0].calc(this.command.time)[0];
        this.py = this.profile.paras[0].calc(this.command.time)[1];
        //
        this.command.objUpdate(this);
    }
    //
    reval(px, py){
        //console.log("Reveling");
        this.nets[this.vectorMode - 1].reval(px, py);
    }
    //
    toggleLock(){
        console.log("attempting to lock");
        this.lock = !this.lock;
        if(this.lock){
            this.self.style("fill", "gray");
        }else{
            this.self.style("fill", this.color);
        }
    }
    //
    movePoints(){
        //let idx = this.command.objects.indexOf(this);
        var n;
        for(n = 0; n < this.points.length && n < this.extremes.length; n++){//set position for every point that already exists
            console.log("repos point " + n + " bc " + this.extremes.length);
            console.log(this.extremes[n] + " to " + this.profile.calc(0, this.extremes[n])[1]);
            this.points[n].attr("val", this.extremes[n]).style("fill", this.color)
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))//get x and y position at given time
                .attr("cy", Math.round(this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));//
        }
        while(this.points.length < this.extremes.length){//add points until there are the same name number
            console.log("Adding points");
            this.points.push(this.svg.append("circle").style("fill", this.color)
                .attr("r", 6)
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))
                .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));
            this.points[n].lower();
            n++;
            this.command.input.newObjPoint(this.points[this.points.length - 1]);
            //this.command.input.newPoint(this.points[this.points.length - 1]);
        }
        while(this.points.length > this.extremes.length){
            this.points[this.points.length - 1].remove();
            //this.command.input.removePoint(this.points[idx][this.points[idx].length - 1]);
            this.points.pop();
            console.log("Removing circle");
        }
    }
    //
    reposPoints(){
        for(var n = 0; n < this.points.length; n++){//set position for every point that already exists
            this.points[n].attr("val", this.extremes[n])
                .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))//get x and y position at given time
                .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1]));//
        }
    }
    //
    updateVectors(mode){
        this.vectorMode = mode;
        this.comps.forEach(comp => {
            comp.forEach(arrow => {
                arrow.self.hide();
            });
        });
        this.nets.forEach(net => {
            net.self.hide();
        });
        //
        if(this.vectorMode > 0){
            this.nets[this.vectorMode - 1].self.show();
            this.comps[this.vectorMode - 1].forEach(arrow => {
                arrow.show();
            });
        }
    }
    */
}

class netArrow{
    constructor(command, obj, depth){
        this.command = command;
        this.obj = obj;
        this.depth = depth;
        //
        this.profile = obj.profile;
        //
        this.pos = this.profile.paras[depth].calc(command.time);
        console.log(this.pos);
        this.self = new Arrow(command, obj.px, obj.py, this.pos[0] * obj.arrStr, this.pos[1] * obj.arrStr, `hsl(${240 - (depth * 20)}, 100%, 50%)`);
        this.command.input.newArrow(this);
    }
    //
    update(){
        //console.log("updating");
        this.pos = this.profile.paras[this.depth].calc(this.command.time);
        //
        this.self.sx = this.obj.px;
        this.self.sy = this.obj.py;
        this.self.ex = this.pos[0] * this.obj.arrStr;
        this.self.ey = this.pos[1] * this.obj.arrStr;
    }
    //
    move(){
        this.self.move();
    }
    //
    reval(px, py){
        let x = (this.command.scaleX.invert(px) - this.obj.px) / this.obj.arrStr;
        let y = (this.command.scaleY.invert(py) - this.obj.py) / this.obj.arrStr;
        this.obj.setValue(this.depth, x, y);
        this.command.funcChange([this.obj]);
        this.obj.updateVectors(this.depth);
        this.obj.moveVectors(this.depth);
    }
}

class compArrow{
    constructor(command, obj, depth, idx){
        this.command = command;
        this.obj = obj;
        this.depth = depth;
        this.idx = idx;
        //
        this.profile = obj.profile;
        //
        console.log(this.obj.comps);
        this.pos = this.profile.comps[depth][idx].calc(command.time);
        console.log(this.pos);
        console.log(`depth: ${depth}, idx: ${idx}, length: ${this.profile.comps[depth].length}`);
        if(this.idx == this.profile.comps[depth].length - 1){
            this.ex = obj.px + this.pos[0] * obj.arrStr;
            this.ey = obj.py + this.pos[1] * obj.arrStr;
            this.self = new Arrow(command, obj.px, obj.py, this.pos[0] * obj.arrStr, this.pos[1] * obj.arrStr, `hsl(132, 100%, ${55 - (idx * 10)}%)`);
        }else{
            console.log(this.obj.comps[depth - 2]);
            this.self = new Arrow(command, this.obj.comps[this.depth - 2][0].ex, this.obj.comps[this.depth - 2][0].ey, this.pos[0] * obj.arrStr, this.pos[1] * obj.arrStr, `hsl(132, 100%, ${55 - (idx * 10)}%)`);
            this.ex = this.self.sx + this.self.ex;
            this.ey = this.self.sy + this.self.ey;
        }
        this.self.tailSize = 20;
        //
        if(this.idx > 0){
            this.command.input.newArrow(this);
        }
    }
    //
    update(){
        //console.log("updating");
        this.pos = this.profile.comps[this.depth][this.idx].calc(this.command.time);
        //
        if(this.idx == this.profile.comps[this.depth].length - 1){
            this.self.sx = this.obj.px;
            this.self.sy = this.obj.py;
            this.ex = this.obj.px + this.pos[0] * this.obj.arrStr;
            this.ey = this.obj.py + this.pos[1] * this.obj.arrStr;
        }else{
            this.self.sx = this.obj.comps[this.depth - 1][this.idx + 1].ex;//set start of vector to end of last one
            this.self.sy = this.obj.comps[this.depth - 1][this.idx + 1].ey;
        }
        //
        this.self.ex = this.pos[0] * this.obj.arrStr;
        this.self.ey = this.pos[1] * this.obj.arrStr;
        this.ex = this.self.sx + this.self.ex;
        this.ey = this.self.sy + this.self.ey;
    }
    //
    move(){
        this.self.move();
    }
    //
    reval(px, py){
        let x = (this.command.scaleX.invert(px) - this.obj.px) / this.obj.arrStr;
        let y = (this.command.scaleY.invert(py) - this.obj.py) / this.obj.arrStr;
        //
        this.obj.setCompValue(this.depth, this.idx, x, y);
        this.command.funcChange([this.obj]);
        this.obj.updateVectors(this.depth);
        this.obj.moveVectors(this.depth);
    }
    //
    show(){
        if(this.idx > 0){
            this.self.show();
        }else if(this.profile.comps[this.depth].length > 1 && 
                this.profile.paras[this.depth].xFunc.getCoefs() != this.profile.comps[this.depth][this.idx].xFunc.getCoefs() &&
                this.profile.paras[this.depth].yFunc.getCoefs() != this.profile.comps[this.depth][this.idx].yFunc.getCoefs()){//head of default comp is never shown
            //
            this.self.neck.style("visibility", "visible");
            this.self.tailA.style("visibility", "visible");
            this.self.tailB.style("visibility", "visible");
        }
    }
}

class Arrow{
    constructor(command, sx, sy, ex, ey, color){
        this.command = command;
        this.sx = sx;
        this.sy = sy;
        this.ex = ex;//ending x
        this.ey = ey;//ending y
        //
        this.color = color;
        //
        this.tailSize = 30;
        this.tailAng = 60;
        this.headSize = 8;
        let tx1;
        let tx2;
        let ty1;
        let ty2;
        //
        if(ex == 0 && ey == 0){
            tx1 = 0;
            tx2 = 0;
            ty1 = 0;
            ty2 = 0;
        }else{
            let theta = atan(ey, ex);
            tx1 = this.tailSize * Math.cos(radians(theta + (90 + this.tailAng)));//tail x displacement
            tx2 = this.tailSize * Math.cos(radians(theta - (90 + this.tailAng)));//tail x displacement
            ty1 = this.tailSize * Math.sin(radians(theta + (90 + this.tailAng)));//tail y displacement
            ty2 = this.tailSize * Math.sin(radians(theta - (90 + this.tailAng)));//tail y displacement
        }
        //
        this.neck = command.svg.append("line").style("stroke", this.color).style("stroke-width", 4)
                        .attr("x1", command.scaleX(this.sx))
                        .attr("y1", command.scaleY(this.sy))
                        .attr("x2", command.scaleX(this.sx + this.ex))
                        .attr("y2", command.scaleY(this.sy + this.ey));
        this.tailA = command.svg.append("line").style("stroke", this.color).style("stroke-width", 4).style("stroke-linecap", "round")
                        .attr("x1", command.scaleX(this.sx + this.ex))
                        .attr("y1", command.scaleY(this.sy + this.ey))
                        .attr("x2", command.scaleX(this.sx + this.ex) + tx1)
                        .attr("y2", command.scaleY(this.sy + this.ey) - ty1);
        this.tailB = command.svg.append("line").style("stroke", this.color).style("stroke-width", 4).style("stroke-linecap", "round")
                        .attr("x1", command.scaleX(this.sx + this.ex))
                        .attr("y1", command.scaleY(this.sy + this.ey))
                        .attr("x2", command.scaleX(this.sx + this.ex) + tx2)
                        .attr("y2", command.scaleY(this.sy + this.ey) - ty2);
        this.head = command.svg.append("circle").style("fill", "white")
                        .attr("cx", command.scaleX(this.sx + this.ex))
                        .attr("cy", command.scaleY(this.sy + this.ey))
                        .attr("r", this.headSize);
        //
        this.hide();
    }
    //
    move(){
        let tx1;
        let tx2;
        let ty1;
        let ty2;
        if(this.ex == 0 && this.ey == 0){
            tx1 = 0;
            tx2 = 0;
            ty1 = 0;
            ty2 = 0;
        }else{
            let theta = atan(this.ey, this.ex);
            tx1 = this.tailSize * Math.cos(radians(theta + (90 + this.tailAng)));//tail x displacement
            tx2 = this.tailSize * Math.cos(radians(theta - (90 + this.tailAng)));//tail x displacement
            ty1 = this.tailSize * Math.sin(radians(theta + (90 + this.tailAng)));//tail y displacement
            ty2 = this.tailSize * Math.sin(radians(theta - (90 + this.tailAng)));//tail y displacement
        }
        //
        this.neck.attr("x1", this.command.scaleX(this.sx))
                .attr("y1", this.command.scaleY(this.sy))
                .attr("x2", this.command.scaleX(this.sx + this.ex))
                .attr("y2", this.command.scaleY(this.sy + this.ey));
        this.tailA.attr("x1", this.command.scaleX(this.sx + this.ex))
                .attr("y1", this.command.scaleY(this.sy + this.ey))
                .attr("x2", this.command.scaleX(this.sx + this.ex) + tx1)
                .attr("y2", this.command.scaleY(this.sy + this.ey) - ty1);
        this.tailB.attr("x1", this.command.scaleX(this.sx + this.ex))
                .attr("y1", this.command.scaleY(this.sy + this.ey))
                .attr("x2", this.command.scaleX(this.sx + this.ex) + tx2)
                .attr("y2", this.command.scaleY(this.sy + this.ey) - ty2);
        this.head.attr("cx", this.command.scaleX(this.sx + this.ex))
                .attr("cy", this.command.scaleY(this.sy + this.ey))
                .attr("r", this.headSize);
    }
    //
    hide(){
        this.neck.style("visibility", "hidden");
        this.tailA.style("visibility", "hidden");
        this.tailB.style("visibility", "hidden");
        this.head.style("visibility", "hidden");
    }
    //
    show(){
        this.neck.style("visibility", "visible");
        this.tailA.style("visibility", "visible");
        this.tailB.style("visibility", "visible");
        this.head.style("visibility", "visible");
    }
    //
    delete(){
        this.neck.remove();
        this.tailA.remove();
        this.tailB.remove();
        this.head.remove();
    }
}

function atan(y, x){
    let angle = degrees(Math.atan(y / x));
    if(x < 0){
        angle += 180;
    }
    return angle;
}

function degrees(angle){
    return angle * 180 / Math.PI;
}

function radians(angle){
    return angle * Math.PI / 180;
}