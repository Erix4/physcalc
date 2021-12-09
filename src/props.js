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
        this.tabNum = 1;
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
                self.tt.property("value", parseFloat(this.value).toFixed(3));
            }
        });
        this.tt.on("input", function(){
            if(isNumeric(this.value)){
                command.setTime(parseFloat(this.value), true);
                self.t.property("value", parseFloat(this.value).toFixed(3));
            }
        });
        //
        d3.select('#gravitySet').on('click', function(){
            input.fieldClick(this);
        });
        //
        d3.select('#gravitySet').on('input', function(){
            if(isNumeric(this.value)){
                let orGrav = command.gravity;
                command.gravity = parseFloat(this.value);
                command.objects.forEach(obj => {
                    if(obj.yS[2] == orGrav){//object still has default gravity
                        obj.setValue(2, 0, command.gravity);
                        command.objPosChange([command.selected], true);
                        self.renderEqs();
                    }
                });
            }
        });
        //
        this.tabEvents();
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
        if(this.selected != null){
            //console.log(this.selected);
            //
            this.head.text(`Object: ${this.selected.id + 1}`);
            this.head.style('color', `hsl(${this.selected.hue}, 100%, 80%)`);
            this.fields.forEach((field, idx) => {
                d3.select(field).property("value", selected.getVals(Math.floor(idx / 2))[idx % 2].toFixed(this.precision));
            });
        }else{
            this.head.text(`No Object`);
            this.head.style('color', `white`);
            this.fields.forEach(field => {
                d3.select(field).property("value", "");
            });
        }
    }
    //
    diffObj(selected){
        d3.selectAll('.newtab').remove();
        if(selected != null){
            this.update(selected);
            //
            this.tabNum = selected.profile.pieces.length;
            //
            let self = this;
            for(var n = 1; n < this.tabNum; n++){
                let newTab = d3.select('#tabs').append('div').attr('class', 'newtab tab').attr('val', self.tabNum);
                newTab.append('p').attr('class', 'tabText text').text(n+1);
            }
            //
            d3.select('#addTab').raise();
            if(this.tabNum == 10){
                d3.select('#addTab').style('display', 'none');
            }
            //
            this.updateTabs();
            this.tabEvents();
        }else{
            d3.selectAll('.tabField').property('value', '');
            d3.selectAll('.juncType').selectAll('.discIcon').attr('class', (d,i) => i == 3 ? `sel discIcon` : `discIcon`);
            d3.selectAll('.tabField').attr('class', 'noField tabField');
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
        this.tt.property("value", this.command.time.toFixed(3));
        if(this.selected != null){
            this.updateTabs();
        }
    }
    //
    newObj(){
        this.column.append("p", "hope");
    }
    //
    tabEvents(){
        console.log(`calling tab events`);
        console.log(this.tabNum);
        let self = this;
        let input = this.command.input;
        //
        d3.selectAll('.tab').on('click', function(d, i){
            let selected = self.command.selected;
            if(this.attributes.id==null){//not the add tab
                if(selected.profile.bounds.length > 1){
                    if(i == 0){
                        console.log(`setting to ${selected.profile.bounds[0][1]-1}`);
                        self.command.setTime(selected.profile.bounds[0][1]-.1);
                    }else{
                        console.log(`setting to ${selected.profile.bounds[i][0]}`);
                        self.command.setTime(selected.profile.bounds[i][0]);
                    }
                }
            }else{//is the add tab
                if(selected != null){
                    self.tabNum++;
                    console.log(`add tab`);
                    let newTab = d3.select('#tabs').append('div').attr('class', 'newtab tab').attr('val', self.tabNum);
                    newTab.append('p').attr('class', 'tabText text').text(self.tabNum);
                    d3.select(this).raise();
                    if(self.tabNum == 10){
                        d3.select(this).style('display', 'none');
                    }
                    //
                    selected.profile.newSplitPiece();
                    selected.update();
                    console.log(selected.getVals());
                    self.command.drawGrid();
                    self.tabEvents();
                    console.log(selected.piece);
                    self.updateTabs();
                }
            }
        });
        //
        d3.selectAll('.juncType').on('click', function(d, i){//cycle the junction icons and enable.disable the bounds fields if necessary
            if(self.selected != null){
                let pIdx = self.selected.piece;
                let bounds = self.selected.profile.bounds[pIdx];
                if(pIdx == 0 && i == 0){//leftmost piece
                    if(isFinite(bounds[0])){//left bound is already a number
                        self.selected.profile.bounds[pIdx][0] = -Infinity;
                        //
                        self.command.selected.update();
                        self.command.drawGrid();
                        self.updateTabs();
                        return;
                    }
                    self.selected.profile.bounds[pIdx][0] = self.command.time;
                }else if (pIdx == self.selected.profile.pieces.length - 1 && i == 1){//rightmost piece
                    if(isFinite(bounds[1])){//right bound is already a number
                        self.selected.profile.bounds[pIdx][1] = Infinity;
                        //
                        self.command.selected.update();
                        self.command.drawGrid();
                        self.updateTabs();
                        return;
                    }
                    self.selected.profile.bounds[pIdx][1] = self.command.time;
                }
                self.selected.profile.junctions[pIdx-1+i] = (self.selected.profile.junctions[pIdx-1+i] + 1) % 3;
                if(self.selected.profile.junctions[pIdx-1+i] == 0){
                    self.selected.shiftValue(0, 0, 0);
                }
                //
                self.command.selected.update();
                self.command.drawGrid();
                self.updateTabs();
            }
        });
        //
        d3.selectAll('.tabField').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select('.tabField').on('input', function(){
            if(isNumeric(this.value) && self.selected.piece != -1){
                console.log('calling left field input');
                self.selected.profile.reLeftBoundPiece(self.selected.piece, parseFloat(this.value));
                self.command.objPosChange([self.command.selected], true);
            }
        });
        d3.select('.tabField:nth-child(4)').on('input', function(){
            if(isNumeric(this.value) && self.selected.piece != -1){
                console.log('calling right field input');
                self.selected.profile.reRightBoundPiece(self.selected.piece, parseFloat(this.value));
                self.command.objPosChange([self.command.selected], true);
            }
        });
    }
    //
    updateTabs(){
        let pIdx = this.selected.piece;
        let bounds = this.selected.profile.bounds[pIdx];
        d3.selectAll('.tabField').property("value", (d, i) => isFinite(bounds[i]) ? bounds[i].toFixed(3) : "");//the fanciest line of code I've ever written
        d3.selectAll('.tab').attr('class', (d, i, j) => d3.select(j[i]).attr('class').split(' ')[0] == 'selt' ? d3.select(j[i]).attr('class').split(' ').slice(1).join(' ') : d3.select(j[i]).attr('class'));
        //console.log(pIdx);
        let cNode = d3.select(d3.selectAll('.tab').nodes()[pIdx]);
        cNode.attr('class', `selt ${cNode.attr('class')}`);
        //
        var junc = [0, 0];//0 is cont, 1 is disc, 2 is inc, 3 in inf
        //
        if(pIdx == 0){//leftmost piece
            junc[0] = isFinite(bounds[0]) ? 2 : 3;//set left junction by value
        }else{
            junc[0] = this.selected.profile.junctions[pIdx-1];
            //console.log(this.selected.profile.junctions);
            //console.log(`junction left: ${this.selected.profile.junctions[pIdx-1]}`);
        }
        //
        if(pIdx == this.selected.profile.pieces.length - 1){//rightmost piece
            junc[1] = isFinite(bounds[1]) ? 2 : 3;//set junction by right value
        }else{
            junc[1] = this.selected.profile.junctions[pIdx];
            //console.log(`junction right: ${this.selected.profile.junctions[pIdx]}`);
        }
        //
        d3.selectAll('.juncType').nodes().forEach((juncBut, idx) => {
            d3.select(juncBut).select('.sel').attr('class', `discIcon`);
            d3.select(d3.select(juncBut).selectAll('.discIcon').nodes()[junc[idx]]).attr('class', `sel discIcon`);
            //
            d3.selectAll('.tabField').attr('class', (d, i) => junc[i] == 3 ? 'noField tabField' : 'tabField');
        });
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