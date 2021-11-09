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
        this.calcB = d3.select("#calcB");
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
        }
    }
    //
    renderEqs(){
        if(this.selected){
            var str = `x(t)=`;
            let para = this.selected.profile.pieces[this.selected.piece].paras[0];
            let len = para.xFunc.terms.length - 1;
            let num = 0;
            for(var n = len; n > 0; n--){
                num = para.getTermX(n);
                if(num >= 0 && n < len){
                    str += "+";
                }
                if(Math.abs(num) != 1){
                    str += `${round(num, 3)}`;
                }else if(num < 0){
                    str += "-";
                }
                str += `t`;
                if(n > 1){
                    str += `^${n}`;
                }
            }
            num = para.getTermX(0);
            if(num >= 0){
                str += "+";
            }
            str += `${round(num, 3)}`;
            //
            var math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select("#xeq").html(d3.select("#math").html());
            });
            //
            str = `y(t)=`;
            len = para.yFunc.terms.length - 1;
            for(var n = len; n > 0; n--){
                num = para.getTermY(n);
                if(num >= 0 && n < len){
                    str += "+";
                }
                if(Math.abs(num) != 1){
                    str += `${round(num, 3)}`;
                }else if(num < 0){
                    str += "-";
                }
                str += `t`;
                if(n > 1){
                    str += `^${n}`;
                }
            }
            num = para.getTermY(0);
            if(num >= 0){
                str += "+";
            }
            str += `${round(num, 3)}`;
            //
            math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select("#yeq").html(d3.select("#math").html());
            });
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

function round(number, places){
    return Math.round(Math.pow(10, places) * number) / Math.pow(10, places);
}