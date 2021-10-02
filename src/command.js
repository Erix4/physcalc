import Grid from "./grid";
import Input from "./input";
import Object from "./object";

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
        new Input(this);
        //
        this.objects = [];
    }
    //
    draw(){
        this.grid.draw(this.ctx);
        this.objects.forEach(obj => {
            obj.update();
        });
    }
    //
    zoom(c, px , py){
        this.grid.zoom(c, px, py);
        this.draw();
    }
    //
    repos(px, py){
        this.grid.repos(px, py);
        this.draw();
    }
    //
    resize(){
        this.grid.resize();
        this.draw();
    }
    //
    newObject(px, py){
        this.objects.push(new Object(this, px, py));
    }
}