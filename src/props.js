export default class Props{
    constructor(command){
        this.command = command;
        let input = command.input;
        //
        this.selected = null;
        //
        this.column = d3.select("#column");
        //
        this.precision = 3;
        //
        this.head = d3.select("#propTitle");
        this.t = d3.select("#timeInput");
        this.tt = d3.select("#timeBarTime");
        //
        this.fields = d3.selectAll('.propField').nodes().slice(0, 14);//first 14 field objects are for values
        this.fields.forEach(field => {
            d3.select(field).on('click', function(){
                this.select();
                input.fieldClick(this);
            });
        });
        this.t.on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        this.tt.on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        let self = this;
        this.fields.forEach((field, idx) => {
            d3.select(field).on('input', function(){
                if(isNumeric(this.value)){
                    if(idx % 2 == 0){//x field
                        command.selected.setValue(Math.floor(idx / 2), parseFloat(this.value), parseFloat(d3.select(self.fields[idx+1]).property("value")));
                        command.objPosChange([command.selected], true);
                        self.renderEqs();
                    }else{//y field
                        command.selected.setValue(Math.floor(idx / 2), parseFloat(d3.select(self.fields[idx-1]).property("value")), parseFloat(this.value));
                        command.objPosChange([command.selected], true);
                        self.renderEqs();
                    }
                    let prc = getPrecision(this.value);//this doesn't work
                    if(prc > self.precision){
                        self.precision = prc;
                    }
                }
            });
        });
        //
        this.t.on("input", function(){
            if(isNumeric(this.value)){
                command.setTime(parseFloat(this.value), true);
            }
        });
        //
        d3.select('#addTab').on('click', function(){
            //self.command.selected.profile.newSplitPiece();
            self.command.selected.profile.newPiece([5, 0], [-9.81, 5, 0], 0, 0);//this breaks a lot of things
            self.command.drawGrid();
        });
        //
        this.calcB = d3.select("#calcB");
        //
        this.t.property("value", this.command.time.toFixed(3));
        this.tt.property("value", this.command.time.toFixed(3));
        //
        d3.selectAll('.undoButton').on('click', function(d, i){
            command.selected.setValue(i, 0, 0);
            self.update(command.selected);
            command.objPosChange([command.selected]);
        });
        //
        this.update();
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
            this.head.style('color', `hsl(${this.selected.hue}, 100%, 80%)`);
            this.fields.forEach((field, idx) => {
                d3.select(field).property("value", this.selected.getVals(Math.floor(idx / 2))[idx % 2].toFixed(this.precision));
            });
            //
        }else{
            this.head.text(`No Object`);
            this.head.style('color', `white`);
            this.fields.forEach((field, idx) => {
                d3.select(field).property("value", "");
            });
        }
    }
    //
    renderEqs(){
        if(this.selected){
            let eqs = d3.selectAll('.eq').nodes().slice(1);
            for(var n = 0; n < eqs.length / 2; n++){
                this.renderPowerEqs(n, eqs[2 * n], eqs[2 * n + 1]);
            }
        }else{
            let eqs = d3.selectAll('.eq').nodes().slice(1);
            for(var n = 0; n < eqs.length; n++){
                this.renderCustomEq("-", eqs[n]);
            }
        }
    }
    //
    renderCustomEq(str, elem){
        var math = MathJax.Hub.getAllJax("math")[0];
        MathJax.Hub.Queue(["Text", math, str]);
        //
        MathJax.Hub.Queue(function(){
            d3.select(elem).html(d3.select("#math").html());
        });
    }
    //
    renderPowerEqs(power, elemx, elemy){
        let curPiece = this.selected.profile.pieces[this.selected.profile.getValIdx(this.command.time)];
        var devs = '';
        for(var n = 0; n < power; n++){
            devs += '\'';
        }
        if(curPiece.paras.length > power){//para exists
            let curPara = curPiece.paras[power];
            var str = this.buildEq(curPara.xFunc.getCoefs().reverse(), `x${devs}`);
            //
            var math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select(elemx).html(d3.select("#math").html());
            });
            //
            str = this.buildEq(curPara.yFunc.getCoefs().reverse(), `y${devs}`);
            math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select(elemy).html(d3.select("#math").html());
            });
        }else{
            var str = this.buildEq([0], `x${devs}`);
            //
            var math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select(elemx).html(d3.select("#math").html());
            });
            //
            str = this.buildEq([0], `y${devs}`);
            math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select(elemy).html(d3.select("#math").html());
            });
        }
    }
    //
    /**
     * build a mathjax compatible equation
     * @param {Array<Number>} coefs coefficients of equation
     * @param {String} start x or y
     */
    buildEq(coefs, start){
        var str = `${start}(t)=`;
        let len = coefs.length - 1;
        let num = 0;
        //
        var befores = 0;
        //
        for(var n = len; n > 0; n--){
            num = coefs[n];
            if(num == 0){
                continue;
            }
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
        num = coefs[0];
        if(num >= 0 && len > 0){
            str += "+";
        }
        str += `${round(num, 3)}`;
        return str;
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

function getPrecision(number){
    if(number.split(".").length > 1){
        return number.split(".")[1].length;
    }else{
        return 0;
    }
}

function round(number, places){
    return Math.round(Math.pow(10, places) * number) / Math.pow(10, places);
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}