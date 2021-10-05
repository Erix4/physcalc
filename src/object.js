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
    constructor(command, px, py){
        this.command = command;
        this.field = command.field;
        //
        this.gravity = command.gravity;
        //
        this.status = 0;//motion status, 0 = confirm position, 1 = confirm velocity, 2 = confirm acceleration, 3 = dynamic, 4 = static
        this.vectorMode = 0;
        //
        this.px = this.command.scaleX.invert(px);//current values
        this.py = this.command.scaleY.invert(py);
        this.vx = 10;
        this.vy = 10;
        this.ax = 0;
        this.ay = this.gravity;
        //
        this.profile = new Profile(2, [this.ax / 2, this.vx, 0], [this.ay / 2, this.vy, 0])
        /*this.pFunc = new Para(1000, [this.vx, 0], [this.ay / 2, this.vy, 0], this.px, this.py);//make parametric functions for p, v, a
        this.pFuncComps = [new Para(1000, [this.vx, 0], [this.ay / 2, this.vy, 0], this.px, this.py)];//make parametric functions for p, v, a
        this.vFunc = new Para(1000, [this.vx], [this.ay, this.vy]);
        this.vFuncComps = [new Para(1000, [this.vx], [this.ay, this.vy])];
        this.aFunc = new Para(10, [0], [this.ay]);
        this.aFuncComps = [new Para(10, [0], [0]), new Para(10, [this.ax], [this.ay])];*/
        //
        this.arrStr = 1 / 4;//amount to stretch arrow vs real numbers
        this.vNet = new Arrow(command, this, this.vFunc, this.vx * this.arrStr, this.vy * this.arrStr);
        this.vComps = [new Arrow(command, this, this.vFuncComps[0], this.vx * this.arrStr, this.vy * this.arrStr)];//vector component starts out the same as the net, but is still a difference instance
        this.aNet = new Arrow(command, this, this.aFunc, this.ax * this.arrStr, this.ay * this.arrStr);
        this.aComps = [new Arrow(command, this, this.aFuncComps[0], 0, 0), new Arrow(command, this, this.aFuncComps[1], this.ax * this.arrStr, this.ay * this.arrStr)];
        //
        this.svg = command.svg;
        //
        this.self = this.svg.append("circle").style("fill", "dark-gray").style("stroke", "white").style("stroke-width", 4)
        .style("r", 20)
        .style("visibility", "hidden");
        //
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        //
        command.input.newObject(this);
    }
    //
    update(){
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        this.pFunc.setOff(this.px, this.py);
        //this.pxfunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);
        switch(this.vectorMode){
            case 1:
                this.vNet.update();
                this.vComps.forEach(comp => {
                    comp.update();
                });
            case 2:
                this.aNet.update();
                this.aComps.forEach(comp => {
                    comp.update();
                });
            default:
                //nothing
                break;
        }
    }
    //
    repos(px, py){
        this.px = this.command.scaleX.invert(px);
        this.py = this.command.scaleY.invert(py);
        //
        this.command.objUpdate(this);
    }
    //
    revel(vx, vy){
        console.log("Reveling");
        this.vx = (this.command.scaleX.invert(vx) - this.px) / this.arrStr;
        this.vy = (this.command.scaleY.invert(vy) - this.py) / this.arrStr;
        //
        var xSum = 0;
        var ySum = 0;
        this.pFuncComps.forEach(func => {
            xSum += func.getTermX(1);
            ySum += func.getTermY(1);
        });
        //
        this.pFunc.setTerm(1, this.vx, this.vy);
        this.vFunc.setTerm(0, this.vx, this.vy);
        //
        this.vNet.ex = this.vx * this.arrStr;
        this.vNet.ey = this.vy * this.arrStr;
        this.vComps[0].ex = this.vx * this.arrStr;
        this.vComps[0].ey = this.vy * this.arrStr;
        //
        this.command.objUpdate(this);
    }
    reaccel(ax, ay){
        this.ax = this.command.scaleX.invert(ax) / this.arrStr;
        this.ay = this.command.scaleY.invert(ay) / this.arrStr;
        this.pFunc = setTerm(2, this.ax / 2, this.ay / 2);
        this.vFunc = setTerm(1, this.ax, this.ay);
        this.aFunc = setTerm(0, this.ax, this.ay);
        //
        this.aNet.ex = this.ax * this.arrStr;
        this.aNet.ey = this.ay * this.arrStr;
        this.aComps[0].ex = this.ax * this.arrStr;
        this.aComps[0].ey = this.ay * this.arrStr;
        //
        this.command.objUpdate(this);
    }
    //
    draw(input){
        if((input.velConf || input.moveState == 3) && input.active != this){
            this.command.ctx.globalAlpha = 0.2;
            this.pFunc.draw(this.command, -10, 10);
            this.command.ctx.globalAlpha = 1.0;
            this.self.style("fill-opacity", 0.2).style("stoke-opacity", 0.2);
        }else if (!(input.moveState == 3 && input.active == this)){
            this.pFunc.draw(this.command, -10, 10);
            this.self.style("fill-opacity", 1).style("stoke-opacity", 1.0);
        }
    }
    //
    updateVectors(mode){
        this.vectorMode = mode;
        switch(mode){
            case 0:
                this.vNet.hide();
                this.aNet.hide();
                //
                this.vComps.forEach(comp => {
                    comp.hide();
                });
                this.aComps.forEach(comp => {
                    comp.hide();
                });
                break;
            case 1:
                console.log("Showing velocity vecors");
                this.vNet.update();
                this.vNet.show();
                this.aNet.hide();
                //
                console.log(this.vNet.neck.style("visibility"));
                if(this.vComps.length > 1){
                    this.vComps.forEach(comp => {
                        comp.update();
                        comp.show();
                    });
                }
                this.aComps.forEach(comp => {
                    comp.hide();
                });
                break;
            case 2:
                this.vNet.hide();
                this.aNet.update();
                this.aNet.show();
                //
                this.vComps.forEach(comp => {
                    comp.hide();
                });
                if(this.aComps.length > 1 + Math.ceil(Math.abs(this.gravity / 1000000))){
                    this.aComps.forEach(comp => {
                        comp.update();
                        comp.show();
                    });
                }
                break;
        }
    }
}

class Arrow{
    constructor(command, obj, func, ex, ey){
        this.command = command;
        this.obj = obj;
        this.ex = ex;//ending x
        this.ey = ey;//ending y
        //
        this.func = func;
        //
        this.tailSize = 30;
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
            tx1 = this.tailSize * Math.cos(radians(theta + 135));//tail x displacement
            tx2 = this.tailSize * Math.cos(radians(theta - 135));//tail x displacement
            ty1 = this.tailSize * Math.sin(radians(theta + 135));//tail y displacement
            ty2 = this.tailSize * Math.sin(radians(theta - 135));//tail y displacement
        }
        //
        this.neck = command.svg.append("line").style("stroke", "white").style("stroke-width", 4)
                        .attr("x1", command.scaleX(obj.px))
                        .attr("y1", command.scaleY(obj.py))
                        .attr("x2", command.scaleX(obj.px + this.ex))
                        .attr("y2", command.scaleY(obj.py + this.ey));
        this.tailA = command.svg.append("line").style("stroke", "white").style("stroke-width", 4).style("stroke-linecap", "round")
                        .attr("x1", command.scaleX(obj.px + this.ex))
                        .attr("y1", command.scaleY(obj.py + this.ey))
                        .attr("x2", command.scaleX(obj.px + this.ex) + tx1)
                        .attr("y2", command.scaleY(obj.py + this.ey) - ty1);
        this.tailB = command.svg.append("line").style("stroke", "white").style("stroke-width", 4).style("stroke-linecap", "round")
                        .attr("x1", command.scaleX(obj.px + this.ex))
                        .attr("y1", command.scaleY(obj.py + this.ey))
                        .attr("x2", command.scaleX(obj.px + this.ex) + tx2)
                        .attr("y2", command.scaleY(obj.py + this.ey) - ty2);
        this.head = command.svg.append("circle").style("fill", "white")
                        .attr("cx", command.scaleX(obj.px + this.ex))
                        .attr("cy", command.scaleY(obj.py + this.ey))
                        .attr("r", this.headSize);
        //
        this.command.input.newArrow(this);
        this.hide();
    }
    //
    
    //
    update(){
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
            tx1 = this.tailSize * Math.cos(radians(theta + 135));//tail x displacement
            tx2 = this.tailSize * Math.cos(radians(theta - 135));//tail x displacement
            ty1 = this.tailSize * Math.sin(radians(theta + 135));//tail y displacement
            ty2 = this.tailSize * Math.sin(radians(theta - 135));//tail y displacement
        }
        //
        this.neck.attr("x1", this.command.scaleX(this.obj.px))
                .attr("y1", this.command.scaleY(this.obj.py))
                .attr("x2", this.command.scaleX(this.obj.px + this.ex))
                .attr("y2", this.command.scaleY(this.obj.py + this.ey));
        this.tailA.attr("x1", this.command.scaleX(this.obj.px + this.ex))
                .attr("y1", this.command.scaleY(this.obj.py + this.ey))
                .attr("x2", this.command.scaleX(this.obj.px + this.ex) + tx1)
                .attr("y2", this.command.scaleY(this.obj.py + this.ey) - ty1);
        this.tailB.attr("x1", this.command.scaleX(this.obj.px + this.ex))
                .attr("y1", this.command.scaleY(this.obj.py + this.ey))
                .attr("x2", this.command.scaleX(this.obj.px + this.ex) + tx2)
                .attr("y2", this.command.scaleY(this.obj.py + this.ey) - ty2);
        this.head.attr("cx", this.command.scaleX(this.obj.px + this.ex))
                .attr("cy", this.command.scaleY(this.obj.py + this.ey))
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