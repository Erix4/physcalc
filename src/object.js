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
    constructor(command, id, px, py, type=0){
        this.command = command;
        this.field = command.field;
        //
        this.id = id;
        this.toBeDeleted = false;
        this.type = type;//0 = as projectile, 1 = in free fall, 2 = at rest, 3 = at position/default after changes
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
        this.piece = 0;
        this.undef = false;//position is undefined due to incomplete piecewise profile
        //
        this.px = this.command.scaleX.invert(px);//current values
        this.py = this.command.scaleY.invert(py);
        this.xS = [];//refactor for expandable values, power ascends (0, 1, 2...)
        this.yS = [];
        const vx = 5;//starting values, not used later
        const vy = 5;
        const ax = 0;
        const ay = 0;
        //
        this.profile = new Profile(this.command, this.depth, [ax / 2, vx, this.px], [ay / 2, vy, this.py], this.color);
        this.profile.addComp(2, [0], [this.gravity]);//add gravity component to all pieces
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
        this.comps = [];//redo comp listing for better illustration
        for(var n = 1; n <= this.depth; n++){//make an arrow for every para except position
            this.nets.push(new netArrow(command, this, n, 0));
            var curPiece = this.profile.pieces[this.profile.getValIdx(this.command.time)];
            //
            let compPower = [];
            for(var a in curPiece.comps[n]){
                compPower.splice(0, 0, new compArrow(command, this, n, a, 0));//insert new comp arrow at beginning of power list
            }
            this.comps.push(compPower);
            //
            console.log(this.comps.slice());
        }
        this.updateVectors();
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
        });
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
    setPosCoefs(coefs){
        //
    }
    //
    //#region Illustration
    /**
     * Update all internal values by function
     */
    update(){
        if(this.command.time < this.profile.bounds[this.piece][0]){
            this.piece--;
            this.respawnArrows();
        }else if(this.command.time > this.profile.bounds[this.piece][1]){
            this.piece++;
            this.respawnArrows();
        }
        console.log(this.piece);
        //
        for(var n = 0; n <= this.depth; n++){
            this.xS[n] = this.profile.calc(n, this.command.time)[0];
            this.yS[n] = this.profile.calc(n, this.command.time)[1];
        }
        if(this.lock){
            this.setValue(0, this.px, this.py);//resolve function to shift the time
            this.command.retimeExtremes([this]);
        }
        //
        switch(this.command.viewType){
            case 0:
                this.px = this.profile.calc(0, this.command.time)[0];
                this.py = this.profile.calc(0, this.command.time)[1];
                break;
            case 1:
                this.px = this.command.time;
                this.py = this.profile.calc(0, this.command.time)[0];
                break;
            case 2:
                this.px = this.command.time;
                this.py = this.profile.calc(0, this.command.time)[1];
                break;
        }
        this.updateVectors();
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
     */
    draw(){
        switch(this.command.viewType){
            case 0:
                this.profile.draw(0, 300);
                break;
            case 1:
                for(var n = 0; n <= this.depth; n++){
                    if(!this.isStaticX(n)){//check if function is just zero
                        this.profile.paras[n].xFunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);
                    }
                }
                break;
            case 2:
                for(var n = 0; n <= this.depth; n++){
                    if(!this.isStaticY(n)){//check if function is just zero
                        this.profile.paras[n].yFunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);
                    }
                }
                break;
        }
    }
    //
    /**
     * check if the x function is just zero
     * @param {Number} depth depth to check static
     * @returns true if the x function is just zero
     */
    isStaticX(depth){
        return (this.profile.paras[depth].xFunc.terms.length == 1 && this.profile.paras[depth].xFunc.terms[0].coef == 0);
    }
    //
    /**
     * check if the y function is just zero
     * @param {Number} depth depth to check static
     * @returns true if the y function is just zero
     */
    isStaticY(depth){
        return (this.profile.paras[depth].yFunc.terms.length == 1 && this.profile.paras[depth].yFunc.terms[0].coef == 0);
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
    //
    /**
     * remake the net and component vectors for this piece
     */
    respawnArrows(){
        let curPiece = this.profile.pieces[this.profile.getValIdx(this.command.time)];
        //
        while(this.nets.length < curPiece.paras.length){//while the current piece is deeper than the number of net vectors
            this.nets.push(new netArrow(command, this, this.nets.length));//add a new net vector
        }
    }
    //
    /**
     * lock the object so it slide in time
     */
    toggleLock(){
        this.lock = !this.lock;
        if(this.lock){
            this.self.style("fill", "gray");
            this.profile.setOrigin(this.command.time);
        }else{
            this.self.style("fill", this.color);
        }
    }
    //
    /**
     * remove and respawn extreme points
     */
    spawnExtremes(){
        switch(this.command.viewType){
            case 0:
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
                break;
            case 1:
                this.extremes = this.profile.getExtremes();
                var n;
                for(n = 0; n < this.points.length && n < this.extremes.length; n++){//set position for every point that already exists
                    this.points[n].attr("val", this.extremes[n]).style("fill", this.color)
                        .attr("cx", this.command.scaleX(this.extremes[n]))//get x and y position at given time
                        .attr("cy", Math.round(this.command.scaleY(this.profile.calc(0, this.extremes[n])[0])));//
                }
                while(this.points.length < this.extremes.length){//add points until there are the same name number
                    this.points.push(this.svg.append("circle").style("fill", this.color)
                        .attr("r", 6)
                        .attr("cx", this.command.scaleX(this.extremes[n]))
                        .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[0])));
                    this.points[n].lower();
                    this.command.input.newObjPoint(this, this.points[this.points.length - 1]);
                    n++;
                }
                while(this.points.length > this.extremes.length){
                    this.points[this.points.length - 1].remove();
                    this.points.pop();
                }
                break;
            case 2:
                this.extremes = this.profile.getExtremes();
                var n;
                for(n = 0; n < this.points.length && n < this.extremes.length; n++){//set position for every point that already exists
                    this.points[n].attr("val", this.extremes[n]).style("fill", this.color)
                        .attr("cx", this.command.scaleX(this.extremes[n]))//get x and y position at given time
                        .attr("cy", Math.round(this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));//
                }
                while(this.points.length < this.extremes.length){//add points until there are the same name number
                    this.points.push(this.svg.append("circle").style("fill", this.color)
                        .attr("r", 6)
                        .attr("cx", this.command.scaleX(this.extremes[n]))
                        .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1])));
                    this.points[n].lower();
                    this.command.input.newObjPoint(this, this.points[this.points.length - 1]);
                    n++;
                }
                while(this.points.length > this.extremes.length){
                    this.points[this.points.length - 1].remove();
                    this.points.pop();
                }
                break;
        }
    }
    //
    /**
     * move all extreme points (when grid is shifted)
     */
    movePoints(){
        switch(this.command.viewType){
            case 0:
                for(var n = 0; n < this.points.length; n++){//set position for every point that already exists
                    this.points[n].attr("val", this.extremes[n])
                        .attr("cx", this.command.scaleX(this.profile.calc(0, this.extremes[n])[0]))//get x and y position at given time
                        .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1]));//
                }
                break;
            case 1:
                for(var n = 0; n < this.points.length; n++){//set position for every point that already exists
                    this.points[n].attr("val", this.extremes[n])
                        .attr("cx", this.command.scaleX(this.extremes[n]))//get x and y position at given time
                        .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[0]));//
                }
                break;
            case 2:
                for(var n = 0; n < this.points.length; n++){//set position for every point that already exists
                    this.points[n].attr("val", this.extremes[n])
                        .attr("cx", this.command.scaleX(this.extremes[n]))//get x and y position at given time
                        .attr("cy", this.command.scaleY(this.profile.calc(0, this.extremes[n])[1]));//
                }
                break;
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
        this.profile.setOrigin(this.command.time);
    }
    //
    /**
     * Set the value and reset the origin to a specific time
     * @param {power} power power of value to set
     * @param {time} time   time to set new value at
     * @param {xPos} xPos   x position to set value to in pixels
     * @param {yPos} yPos   y position to set value to in pixels
     */
    setValueTime(power, time, xPos, yPos){
        this.profile.setValTime(power, time, xPos, yPos);
        this.profile.setOrigin(time);
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
}

class netArrow{
    constructor(command, obj, depth, pieceIdx){
        this.command = command;
        this.obj = obj;
        this.depth = depth;
        this.pIdx = pieceIdx;
        //
        this.profile = obj.profile;
        //
        this.pos = this.profile.calc(depth, command.time);
        console.log(this.pos);
        this.self = new Arrow(command, obj.px, obj.py, this.pos[0] * obj.arrStr, this.pos[1] * obj.arrStr, `hsl(${240 - (depth * 20)}, 100%, 50%)`);
        this.command.input.newArrow(this);
    }
    //
    update(){
        this.pos = this.profile.calc(this.depth, this.command.time, this.pIdx);
        //
        this.self.sx = this.obj.px;
        this.self.sy = this.obj.py;
        //
        switch(this.command.viewType){
            case 0:
                this.self.ex = this.pos[0] * this.obj.arrStr;
                this.self.ey = this.pos[1] * this.obj.arrStr;
                break;
            case 1:
                var s = this.pos[0];
                var x1 = Math.sqrt(Math.pow(this.obj.arrStr * 2, 2) / (1 + Math.pow(s, 2)));
                //
                this.self.ex = x1;
                this.self.ey = x1 * s;
                break;
            case 2:
                var s = this.pos[1];
                var x1 = Math.sqrt(Math.pow(this.command.scaleX.invert(this.obj.arrStr), 2) / (1 + Math.pow(s, 2)));
                //
                this.self.ex = x1;
                this.self.ey = x1 * s;
                break;
        }
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
        this.command.updateGrid([this.obj]);
        this.command.funcChange([this.obj]);
        this.obj.updateVectors(this.depth);
        this.obj.moveVectors(this.depth);
    }
}

class compArrow{
    constructor(command, obj, depth, idx, pieceIdx){
        this.command = command;
        this.obj = obj;
        this.depth = depth;
        this.idx = idx;//index in profile
        this.pIdx = pieceIdx;
        this.order = obj.profile.pieces[obj.profile.getValIdx(command.time)].comps[depth].length;
        //
        this.profile = obj.profile;
        //
        this.pos = this.profile.calcComp(depth, command.time, idx);
        this.self = new Arrow(command, 0, 0, 0, 0, `hsl(132, 100%, ${55 - (idx * 10)}%)`);
        this.self.tailSize = 20;
        //
        this.ex = 0;
        this.ey = 0;
        //
        if(this.idx > 0){
            this.command.input.newArrow(this);
        }
    }
    //
    update(){
        this.pos = this.profile.calcComp(this.depth, this.command.time, this.idx, this.pieceIdx);//find comp values at current depth and time
        //
        if(this.idx == this.obj.comps[this.depth - 1].length - 1){//if last comp...
            this.self.sx = this.obj.px;//set start to object position
            this.self.sy = this.obj.py;
        }else{
            this.self.sx = this.obj.comps[this.depth - 1][this.order - 1].ex;//set start of vector to end of last one
            this.self.sy = this.obj.comps[this.depth - 1][this.order - 1].ey;
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
        this.command.updateGrid([this.obj]);
        this.command.funcChange([this.obj]);
        this.obj.updateVectors(this.depth);
        this.obj.moveVectors(this.depth);
    }
    //
    show(){
        if(this.idx > 0){//head of default comp is never shown
            this.self.show();
        }else if(this.profile.pieces[this.pIdx].comps[this.depth].length > 1 && //there are more than one comps in this depth
                !this.profile.checkCompMatch(this.depth, this.idx, this.pIdx)){
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


/**
 * check whether a value is in a range
 * @param {Number} val          value to check
 * @param {Array<Number>} range start and end of range
 * @returns if value falls within the range
 */
function within(val, range){
    return val > range[0] && val < range[1];
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