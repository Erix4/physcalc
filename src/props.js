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
        this.t.on("input", function(){
            command.retime(this.value - command.time, true);
        });
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
            this.posx.property("value", this.selected.xS[0]);
            this.posy.property("value", this.selected.yS[0]);
            this.velx.property("value", this.selected.xS[1]);
            this.vely.property("value", this.selected.yS[1]);
            this.accelx.property("value", this.selected.xS[2]);
            this.accely.property("value", this.selected.yS[2]);
        }
    }
    //
    retime(){
        this.t.property("value", this.command.time.toFixed(1));
    }
    //
    newObj(){
        this.column.append("p", "hope");
    }
}