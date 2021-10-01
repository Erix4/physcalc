import Field from "./field";
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
        this.field = new Field(this, this.ctx, this.svg, 0, 0, 20);
        //
        new Input(this);
        //
        this.objects = [];
    }
    //
    resize(){
        this.field.resize();
    }
    //
    newObject(px, py){
        this.objects.push(new Object(this, px, py));
    }
}