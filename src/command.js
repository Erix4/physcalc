import Grid from "./grid";
import Input from "./input";
import Object from "./object";
import Profile from "./func";
import Props from "./props";
import {Para} from "./func";
import {Func} from "./func";
import Timeline from "./time";

export default class Command{
    constructor(loopStart, canvas, svg){
        this.darkMode = true;
        //
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.svg = svg;
        //
        this.scrW = parseInt(this.svg.style("width"));//return screen width in pixels
        this.scrH = parseInt(this.svg.style("height"));//return screen height in pixels
        //
        this.grid = new Grid(this, this.ctx, this.svg, 0, 0.1, 15);
        this.grid.calcSize();//get scales and things
        //
        this.lastTime = 0;
        //
        this.gravity = -9.81;
        this.time = 0;
        //
        this.running = false;
        this.loopStart = loopStart;
        //
        this.vectorMode = 0;//status of vectors, 0 = hidden, 1 = velocity, 2 = acceleration
        //
        this.idCount = 0;
        //
        this.selected = null;
        this.objects = [];
        //
        this.timeline = new Timeline(this, document.getElementById('tcan'), d3.select("#tsvg"), 300);
        console.log(this.time.scrH);
        //
        this.input = new Input(this);
        this.props = new Props(this);
        //
        //this.para = new Para(this.time, 1, [1,4],[2,1,3],0,0);
        //
        this.a = 1;
        console.log(this.a);
        this.a +=1;
        console.log(this.a);
        //
        this.sel = this.svg.append("circle").style("stroke", "#47a3ff").style("fill", "transparent").style("stroke-width", 4).style("stroke-opacity", .6)
        .attr("r", 25).style("visibility", "hidden");
        this.sels = [];
        this.selObs = [];
    }
    //
    update(){//update entire field and redraw canvas
        this.objects = this.objects.filter(obj => !obj.toBeDeleted);
        this.draw();
        this.move();
        this.timeline.move();
        this.timeline.draw(this.timeline.ctx);
    }
    //
    move(){
        this.selected = this.input.selected;
        this.objects.forEach(obj => {
            obj.update();
        });
        this.select(this.input.selected);
        //console.log(this.selected);
    }
    //
    draw(){//redraw canvas
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.draw(this.input);
        });
    }
    //
    objUpdate(obj, inputMode){
        obj.update();
        this.draw();
        if(arguments.length < 2 || !inputMode){
            this.props.update(obj);
            this.props.retime();
        }
        this.select(obj);
    }
    //
    updateVectors(object, mode){
        if(arguments.length == 0){
            this.objects.forEach(obj => {
                obj.updateVectors(this.vectorMode);
            });
        }else{
            object.updateVectors(mode);
        }
    }
    //
    zoom(c, px , py){
        this.grid.zoom(c, px, py);
        this.update();
    }
    //
    repos(px, py){
        this.grid.repos(px, py);
        this.update();
        this.selObs.forEach(obj => {
            //
        })
        this.props.update(this.selected);
    }
    //
    reposObj(px, py){
        this.selObs.forEach(obj => {
            console.log("Calling repos");
            obj.repos(px, py);
        });
        this.update();
        this.props.update(this.selected);
    }
    //
    retime(dt, inputMode){
        this.time += dt;
        this.update();
        this.props.update(this.selected);
        if(arguments.length < 2 || !inputMode){
            this.props.retime();
        }
    }
    //
    resize(){
        this.grid.resize();
        this.timeline.resize();
        this.update();
    }
    //
    newObject(px, py){
        this.input.moveState = 3;
        this.input.active = new Object(this, this.idCount, px, py);
        this.selected = this.input.active;
        this.selObs.push(this.input.active);
        this.objects.push(this.input.active);
        this.idCount++;
        this.sel.raise();
        this.selected.self.raise();
    }
    //
    select(obj){
        if(arguments.length == 0 || obj == null){
            this.sel.style("visibility", "hidden");
            this.sels.forEach(sell => {
                sell.remove();
                this.sels.slice(0, 1);
            });
            console.log("hiding");
        }else if(!this.input.shifting){
            this.sel.style("visibility", "visible")
                    .attr("cx", this.scaleX(obj.px))
                    .attr("cy", this.scaleY(obj.py));
            this.selObs = [obj];
            this.sels.forEach(sell => {
                sell.remove();
                this.sels.slice(0, 1);
            });
        }
    }
    //
    shiftSelect(obj){
        this.sels.push(this.svg.append("circle").style("stroke", "#47d7ff").style("stroke-width", 4).style("fill", "transparent").style("stroke-opacity", .6)
                        .attr("r", 25).style("visibility", "visible")
                        .attr("cx", this.scaleX(obj.px))
                        .attr("cy", this.scaleY(obj.py)));
        this.selObs.push(obj);
    }
}