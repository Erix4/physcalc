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
        this.vectorMode = 0;//0 is hidden, anything higher corresponds to power
        //
        this.px = this.command.scaleX.invert(px);//current values
        this.py = this.command.scaleY.invert(py);
        this.vx = 5;
        this.vy = 5;
        this.ax = 0;
        this.ay = 0;
        //
        this.profile = new Profile(this.command, 2, [this.ax / 2, this.vx, this.px], [this.ay / 2, this.vy, this.py]);
        this.profile.addComp(2, [0], [this.gravity]);
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
        this.self = this.svg.append("circle").style("fill", "dark-gray").style("stroke", "white").style("stroke-width", 4)
        .attr("r", 20)
        /*.style("visibility", "hidden")*/;
        //
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        //
        command.input.newObject(this);
        command.objUpdate(this);
    }
    //
    update(){
        this.px = this.profile.paras[0].calc(this.command.time)[0];
        this.py = this.profile.paras[0].calc(this.command.time)[1];
        //this.vx = this.profile.paras[1].calc(this.command.time)[0];
        //this.vy = this.profile.paras[1].calc(this.command.time)[1];
        this.profile.setOrigin();
        this.self.attr("cx", this.command.scaleX(this.px)).attr("cy", this.command.scaleY(this.py)).style("visibility", "visible");
        //this.pFunc.setOff(this.px, this.py);
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
        //
        //this.pxfunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);
        switch(this.vectorMode){
            case 1:
                /*this.vNet.update();
                this.vComps.forEach(comp => {
                    //comp.update();
                });*/
            case 2:
                /*this.aNet.update();
                this.aComps.forEach(comp => {
                    //comp.update();
                });*/
            default:
                //nothing
                break;
        }
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
    retime(){
        this.px = this.profile.paras[0].calc(this.command.time)[0];
        this.py = this.profile.paras[0].calc(this.command.time)[1];
        //
        this.command.objUpdate(this);
    }
    //
    reval(px, py){
        console.log("Reveling");
        this.nets[this.vectorMode - 1].reval(px, py);
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
        if((input.velConf || input.moveState == 3) && input.active != this){//new object is being created
            this.command.ctx.globalAlpha = 0.2;
            this.profile.draw(0, 1000);
            this.command.ctx.globalAlpha = 1.0;
            this.self.style("fill-opacity", 0.2).style("stoke-opacity", 0.2);
        }else if (!(input.moveState == 3 && input.active == this)){//if not being position confirmed
            this.profile.draw(0, 1000);
            this.self.style("fill-opacity", 1).style("stoke-opacity", 1.0);
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
        this.self.update();
    }
    //
    reval(px, py){
        let x = (this.command.scaleX.invert(px) - this.obj.px) / this.obj.arrStr;
        let y = (this.command.scaleY.invert(py) - this.obj.py) / this.obj.arrStr;
        //
        this.profile.setValues(this.depth, x, y);
        //this.command.draw();
        //this.obj.update();
        this.command.objUpdate(this.obj);
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
        this.self.update();
    }
    //
    reval(px, py){
        let x = (this.command.scaleX.invert(px) - this.obj.px) / this.obj.arrStr;
        let y = (this.command.scaleY.invert(py) - this.obj.py) / this.obj.arrStr;
        //
        this.profile.setCompVal(this.depth, this.idx, x, y);
        this.command.draw();
        this.obj.update();
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