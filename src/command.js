import Grid from "./grid";
import Input from "./input";
import Object from "./object";
import Profile from "./func";
import Props from "./props";
import {Para} from "./func";
import {Func} from "./func";
import Timeline from "./time";

export default class Command{
    constructor(canvas, svg){
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
        this.vectorMode = 0;//status of vectors, 0 = hidden, 1 = velocity, 2 = acceleration
        //
        this.selected = null;
        //
        this.timeline = new Timeline(this, document.getElementById('tcan'), d3.select("#tsvg"), 10);
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
        this.objects = [];
    }
    //
    update(){//update entire field and redraw canvas
        this.draw();
        this.move();
        this.timeline.move();
    }
    //
    move(){
        this.selected = this.input.selected;
        this.objects.forEach(obj => {
            obj.update();
        });
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
        this.props.update(this.selected);
    }
    //
    retime(dt, inputMode){
        console.log("Retiming");
        this.time += dt;
        this.update();
        this.props.update(this.selected);
        if(arguments.length < 2 || !inputMode){
            this.props.retime();
        }
    }
    //
    runTime(timeStamp){
        let deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;
        //
        this.retime(deltaTime);
        //
        if(this.time < 5){
            requestAnimationFrame(this.runTime);
        }
    }
    //
    resize(){
        this.grid.resize();
        this.update();
    }
    //
    newObject(px, py){
        this.input.moveState = 3;
        this.input.active = new Object(this, px, py);
        this.input.velConf = false;
        this.objects.push(this.input.active);
    }
}