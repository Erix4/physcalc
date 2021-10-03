import Grid from "./grid";
import Input from "./input";
import Object from "./object";
import Para from "./func";
import Props from "./props";

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
        this.grid = new Grid(this, this.ctx, this.svg, 0, 0, 20);
        this.grid.calcSize();//get scales and things
        //
        this.gravity = -9.81;
        //
        this.vectorMode = 0;//status of vectors, 0 = hidden, 1 = velocity, 2 = acceleration
        //
        this.input = new Input(this);
        //
        this.objects = [];
    }
    //
    update(){//update entire field and redraw canvas
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.update();
            obj.draw(this.input);
        });
    }
    //
    draw(){//redraw canvas
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.draw(this.input);
        });
    }
    //
    objUpdate(obj){
        obj.update();
        this.draw();
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