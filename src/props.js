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
        this.posx.on("click", function(){
            this.select();
        });
        this.posy.on("click", function(){
            this.select();
        });
        this.velx.on("click", function(){
            this.select();
        });
        this.vely.on("click", function(){
            this.select();
        });
        this.accelx.on("click", function(){
            this.select();
        });
        this.accely.on("click", function(){
            this.select();
        });
        //
        this.posx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(0, parseFloat(this.value), command.selected.py);
                command.objUpdate(command.selected, true);
            }
        });
        //
        this.posy.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(0, command.selected.px, parseFloat(this.value));
                command.objUpdate(command.selected, true);
            }
        });
        //
        this.velx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(1, parseFloat(this.value), parseFloat(self.vely.property("value")));
                command.objUpdate(command.selected, true);
            }
        });
        //
        this.vely.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(1, parseFloat(self.velx.property("value")), parseFloat(this.value));
                command.objUpdate(command.selected, true);
            }
        });
        //
        this.accelx.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(2, parseFloat(this.value), parseFloat(self.accely.property("value")));
                command.objUpdate(command.selected, true);
            }
        });
        //
        this.accely.on("input", function(){
            if(isNumeric(this.value)){
                command.selected.profile.setValues(2, parseFloat(self.accelx.property("value")), parseFloat(this.value));
                command.objUpdate(command.selected, true);
            }
        });
    }
    //
    update(selected){
        this.selected = selected;
        console.log("updating");
        //console.log(selected);
        if(this.selected != null){
            //console.log(this.selected);
            //
            this.head.text(`Object: ${this.selected.id + 1}`);
            this.posx.property("value", this.selected.profile.paras[0].calc(this.command.time)[0].toFixed(2));
            this.posy.property("value", this.selected.profile.paras[0].calc(this.command.time)[1].toFixed(2));
            this.velx.property("value", this.selected.profile.paras[1].calc(this.command.time)[0].toFixed(2));
            this.vely.property("value", this.selected.profile.paras[1].calc(this.command.time)[1].toFixed(2));
            this.accelx.property("value", this.selected.profile.paras[2].calc(this.command.time)[0].toFixed(2));
            this.accely.property("value", this.selected.profile.paras[2].calc(this.command.time)[1].toFixed(2));
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

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}