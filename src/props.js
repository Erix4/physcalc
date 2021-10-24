export default class Props{
    constructor(command){
        this.command = command;
        //
        this.selected;
        //
        this.column = d3.select("#column");
        //
        this.head = d3.select("h2");
        this.t = d3.select("#t");
        this.posx = d3.select("#posx");
        this.posy = d3.select("#posy");
        this.velx = d3.select("#velx");
        this.vely = d3.select("#vely");
        this.accelx = d3.select("#accelx");
        this.accely = d3.select("#accely");
        //
        this.t.property("value", this.command.time.toFixed(3));
        //
        var self = this;
        //
        command.input.props(command, self);
    }
    //
    update(selected){
        this.selected = selected;
        //console.log("updating");
        //console.log(selected);
        if(this.selected != null){
            //console.log(this.selected);
            //
            this.head.text(`Object: ${this.selected.id + 1}`);
            this.posx.property("value", this.selected.xS[0].toFixed(3));
            this.posy.property("value", this.selected.yS[0].toFixed(3));
            this.velx.property("value", this.selected.xS[1].toFixed(3));
            this.vely.property("value", this.selected.yS[1].toFixed(3));
            this.accelx.property("value", this.selected.xS[2].toFixed(3));
            this.accely.property("value", this.selected.yS[2].toFixed(3));
            //
            var x1Str = "\\(x(t) = " + (this.selected.xS[2] / 2).toFixed(3) + "t^2" + "\\)";
            d3.select("#testeq").text(x1Str);
            //MathJax.Hub.Queue(["Typeset", MathJax.Hub, 'demo']);
        }
    }
    //
    retime(){
        this.t.property("value", this.command.time.toFixed(3));
    }
    //
    newObj(){
        this.column.append("p", "hope");
    }
}