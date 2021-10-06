export default class Props{
    constructor(command){
        this.command = command;
        //
        this.selected;
        //
        this.column = d3.select("#column");
        //
        this.t = d3.select("#t");
        this.pos = d3.select("#pos");
        this.vel = d3.select("#vel");
        this.accel = d3.select("#accel");
    }
    //
    update(selected){
        this.selected = selected;
        //console.log(selected);
        if(this.selected != null){
            //console.log(this.selected);
            //
            this.t.text(`t = ${this.command.time.toFixed(1)}s`);
            this.pos.text(`p = <${this.selected.profile.paras[0].calc(this.command.time)[0].toFixed(2)}, ${this.selected.profile.paras[0].calc(this.command.time)[1].toFixed(2)}>`);
            this.vel.text(`v = <${this.selected.profile.paras[1].calc(this.command.time)[0].toFixed(2)}, ${this.selected.profile.paras[1].calc(this.command.time)[1].toFixed(2)}>`);
            this.accel.text(`a = <${this.selected.profile.paras[2].calc(this.command.time)[0].toFixed(2)}, ${this.selected.profile.paras[2].calc(this.command.time)[1].toFixed(2)}>`);
        }
    }
    //
    newObj(){
        this.column.append("p", "hope");
    }
}