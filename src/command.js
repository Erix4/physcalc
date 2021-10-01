import Field from "./field";
import Input from "./input";

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
        this.input = new Input(this);
    }
    //
    resize(){
        //
        this.field.resize();
    }
}