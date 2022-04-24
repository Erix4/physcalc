//import { set } from "core-js/core/dict";

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
        this.headerHeight = parseFloat(d3.select('#header').style('height'));//initial state
        this.columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
        this.screenRatio = window.innerWidth / window.innerHeight;
        this.RATIOTHRESHOLD = 0.9;
        //
        this.windowResize();
        //
        this.head = d3.select("#propTitle");
        this.t = d3.select("#timeInput");
        this.tt = d3.select("#timeBarTime");
        //
        let self = this;
        //
        this.drops = d3.selectAll('.propdrop').nodes().slice(0, 14);//unit drop downs next to value fields
        this.fields = d3.selectAll('.propField').nodes().slice(0, 14);//first 14 field objects are for values
        //
        //console.log(d3.selectAll('.propField').nodes());
        //
        //#region event listeners
        //
        d3.selectAll('.propField').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        this.t.on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        this.tt.on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        this.fields.forEach((field, idx) => {
            d3.select(field).on('input', function(){
                if(isNumeric(this.value)){
                    let mult = self.idxToMult(self.getDropIdx(d3.select(self.drops[idx])));
                    let value = parseFloat(this.value) * mult;
                    let power = Math.floor(idx / 2);
                    let aMult;
                    let aValue;
                    //
                    if(idx % 2 == 0){//x field
                        aMult = self.idxToMult(self.getDropIdx(d3.select(self.drops[idx+1])));
                        aValue = parseFloat(d3.select(self.fields[idx+1]).property("value"));
                        command.selected.setValue(power, value, aValue * aMult);
                        command.objPosChange([command.selected], true);
                        self.renderEqs();
                    }else{//y field
                        aMult = self.idxToMult(self.getDropIdx(d3.select(self.drops[idx-1])));
                        aValue = parseFloat(d3.select(self.fields[idx-1]).property("value"))
                        command.selected.setValue(power, aValue * aMult, value);
                        command.objPosChange([command.selected], true);
                        self.renderEqs();
                    }
                    let prc = getPrecision(this.value);//this doesn't work
                    if(prc > self.precision){
                        self.precision = prc;
                    }
                    //
                    command.runAuto();
                }
            });
        });
        //
        this.drops.forEach((drop, idx) => {
            d3.select(drop).on('change', function(){
                drop.blur();
                let mult = self.idxToMult(self.getDropIdx(d3.select(drop)));
                d3.select(self.fields[idx]).property("value", (self.selected.getVals(Math.floor(idx / 2))[idx % 2] / mult).toFixed(self.precision));
                //
                command.runAuto();
            });
        });
        //
        d3.select('#solveType').on('change', function(){//change the solve type
            let solveIdx = self.getDropIdx(d3.select(this));
            if(solveIdx == 0){
                d3.select('#forPoint').style('display', 'block');
                d3.select('#forMotion').style('display', 'none');
                d3.select('#withoutTime').style('display', 'none');
            }else if(solveIdx == 1){
                d3.select('#forPoint').style('display', 'none');
                d3.select('#forMotion').style('display', 'block');
                d3.select('#withoutTime').style('display', 'none');
            }else{
                d3.select('#forPoint').style('display', 'none');
                d3.select('#forMotion').style('display', 'none');
                d3.select('#withoutTime').style('display', 'block');
            }
        });
        //
        d3.selectAll('.solveInput').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select('#forMotion').selectAll('.solveInput').on('input', function(d, i){
            if(this.value == ""){
                self.accessIdx(i, d3.select('#forMotion').selectAll('.solveCheck')).property('checked', false);
            }else if(isNumeric(this.value)){
                self.accessIdx(i, d3.select('#forMotion').selectAll('.solveCheck')).property('checked', true);
            }
        });
        //
        d3.select('#forMotion').selectAll('.solveCheck').on('change', function(d, i){
            if(this.checked && self.accessIdx(i, d3.select('#forMotion').selectAll('.solveInput')).property('value') == ""){
                self.accessIdx(i, d3.select('#forMotion').selectAll('.solveInput')).property('value', 0);
            }
        });
        //
        this.wtFields = d3.selectAll('.propField').nodes().slice(27, 33);
        d3.selectAll('.propField').nodes().slice(27, 33).forEach((elem, idx) => {
            //d3.select(elem).style('background-color', 'red');
            d3.select(elem).on('input', function(){
                let modIndicator = idx % 2;
                let checIndicator = elem.value != ""; //d3.select(d3.selectAll('.wtSolveCheck').nodes()[idx]).property('checked');
                console.log(`detected change on ${idx % 2 == 0 ? 'left' : 'right'}`);
                //
                d3.selectAll('.wtSolveCheck').nodes().forEach((elema, i) => {
                    if(i % 2 == modIndicator && checIndicator){
                        d3.select(elema).property('checked', true);
                        //
                        if(self.wtFields[i].value == ""){
                            d3.select(self.wtFields[i]).property('value', '0');
                        }
                    }
                });
            });
        });
        //
        d3.selectAll('.wtSolveCheck').on('change', function(d, i){
            d3.selectAll('.wtSolveCheck').nodes().forEach((elema, j) => {
                if(i % 2 == j % 2){
                    d3.select(elema).property('checked', this.checked);
                    //
                    if(this.checked && self.wtFields[j].value == ""){
                        d3.select(self.wtFields[j]).property('value', '0');
                    }
                }
            });
        });
        //
        d3.select('#calcButton').on('click', function(){
            if(command.selected){
                switch(self.getDropIdx(d3.select('#solveType'))){
                    case 0://for point
                        let drops = d3.select('#forPoint').selectAll('.propdrop').nodes();
                        let power = self.getDropIdx(d3.select(drops[0]));
                        let x = self.getDropIdx(d3.select(drops[1])) == 0;
                        //
                        let val;
                        if(d3.select('#solvePointInput').property('value') == ""){
                            alert("Please enter a value to check.");
                            return;
                        }else{
                            val = parseFloat(d3.select('#solvePointInput').property('value'));
                        }
                        console.log(`power: ${power}, x: ${x}, val: ${val}`);
                        //
                        let points = command.selected.profile.calcPointsAtValue(val, power, x);//x ? para.xFunc.calcRoots(val) : para.yFunc.calcRoots(val);
                        console.log(points);
                        //
                        let list = d3.select('.pointList').select('ul');
                        list.html("");
                        points.forEach(point => {
                            list.append('li').attr('class', 'noSelect solvedPoint').attr('val', point).html(`t: ${point.toFixed(3)}`);
                        });
                        //
                        d3.selectAll('.solvedPoint').on('click', function(){
                            command.setTime(parseFloat(d3.select(this).attr('val')));
                        });
                        //
                        if(points.length == 0){
                            alert("No points found.");
                        }
                        //
                        break;
                    case 1://for motion
                        let firstProp = d3.select('#forMotion').select('.propInput');
                        if(firstProp.selectAll('.solveCheck').nodes()[0].checked && firstProp.selectAll('.solveCheck').nodes()[1].checked){
                            console.log(`confirmed`);
                            let times = d3.select('#forMotion').selectAll('.timeInput').nodes().map(x => parseFloat(x.value));//get all the times values
                            let allPoints = d3.select('#forMotion').selectAll('.solveInput').nodes();//get all the points values
                            let xPoints = allPoints.filter((x, i) => i % 2 == 0);//get all the x points
                            let yPoints = allPoints.filter((x, i) => i % 2 == 1);//get all the y points
                            //
                            let xVals = [[parseFloat(xPoints[0].value), 0, times[0]]];
                            let yVals = [[parseFloat(yPoints[0].value), 0, times[0]]];
                            //
                            let powers = [0, self.getDropIdx(d3.select('#secondType')), self.getDropIdx(d3.select('#thirdType'))];
                            //
                            if(d3.selectAll('.solveCheck').nodes()[2].checked){
                                xVals.push([parseFloat(xPoints[1].value), powers[1], times[1]]);
                            }else if(d3.selectAll('.solveCheck').nodes()[4].checked && powers[2] == 2){
                                alert("To solve for x motion with acceleration, you need three points of x data.");
                                return;
                            }
                            //
                            if(d3.selectAll('.solveCheck').nodes()[3].checked){
                                yVals.push([parseFloat(yPoints[1].value), powers[1], times[1]]);
                            }else if(d3.selectAll('.solveCheck').nodes()[5].checked && powers[2] == 2){
                                alert("To solve for y motion with acceleration, you need three points of y data.");
                                return;
                            }
                            //
                            if(powers[1] == 0 && times[0] == times[1] && (xVals.length > 1 || yVals.length > 1)){
                                alert("You can't set the position twice at the same time");
                                return;
                            }
                            //
                            if(d3.selectAll('.solveCheck').nodes()[4].checked){//this case gaurentees third points of data
                                xVals.push([parseFloat(xPoints[2].value), powers[2], times[2]]);
                            }
                            //
                            if(d3.selectAll('.solveCheck').nodes()[5].checked){//this case gaurentees third points of data
                                yVals.push([parseFloat(yPoints[2].value), powers[2], times[2]]);
                            }
                            //
                            if(((powers[2] == 0 && times[0] == times[2] && (xVals.length > 1 || yVals.length > 1)) ||//third point is same as first point
                                    (powers[2] == powers[1] && times[1] == times[2] && (xVals.length > 2 || yVals.length > 2))) && (//third point is same as second point
                                    d3.selectAll('.solveCheck').nodes()[4].checked ||//there is data for the third point
                                    d3.selectAll('.solveCheck').nodes()[5].checked)){
                                alert("You can't set the position twice at the same time");
                                return;
                            }
                            //
                            command.selected.profile.resolve(command.selected.profile.getValIdx(command.time), xVals, yVals);
                            command.updateGrid([command.selected]);
                            command.drawGrid();
                            command.moveGrid([command.selected]);
                            command.spawnExtremes([command.selected]);
                            //
                        }else{
                            console.log(`denied`);
                            alert("Please specify an initial x and y position.");
                        }
                        break;
                    case 2://without time
                        let t1 = self.getDropIdx(d3.select('#wtTypeOne'));//x or v0
                        let t2 = self.getDropIdx(d3.select('#wtTypeTwo'));//v0 or v
                        let t3 = self.getDropIdx(d3.select('#wtTypeThree'));//v or a
                        //
                        let checks = d3.selectAll('.wtSolveCheck').nodes();
                        //
                        let type = (d3.select(checks[0]).property('checked') ? 1 : 0) + (d3.select(checks[1]).property('checked') ? 2 : 0);
                        console.log(`type: ${type}`);
                        //
                        console.log(`types: ${t1}, ${t2}, ${t3}`);
                        //
                        //step 1. Validation
                        if(t1 - t2 > 0 || t2 - t3 > 0){
                            alert('You cannot set the same value twice.');
                            return;
                        }
                        if(!checks[0].checked && ! checks[1].checked){
                            alert('You must give at least x or y values to solve.');
                            return;
                        }
                        //
                        let time0 = parseFloat(d3.select('#initialTime').property('value'));
                        let x0 = parseFloat(d3.select('#initX').property('value'));
                        let y0 = parseFloat(d3.select('#initY').property('value'));
                        //
                        let xs = [];
                        let ys = [];
                        d3.select('#withoutTime').selectAll('.solveInput').nodes().forEach((elem, i) => {
                            if(i % 2 == 0){
                                xs.push(type % 2 == 1 ? parseFloat(elem.value) : i == 0 ? x0 : 0);
                            }else{
                                ys.push(type > 1 ? parseFloat(elem.value) : i == 1 ? y0 : 0);
                            }
                        });
                        //
                        console.log(xs);
                        console.log(ys);
                        //
                        let profile = command.selected.profile;
                        //
                        let pIdx = profile.getValIdx(command.time);
                        let piece = profile.pieces[pIdx];
                        //
                        if(pIdx > 0 && profile.junctions[pIdx - 1] == 0){//if piece has a left juction and the junction is continuous
                            profile.junctions[pIdx - 1] = 1;//set the junction to discontinuous
                        }
                        if(pIdx < profile.pieces.length - 1 && profile.junctions[pIdx] == 0){//if piece has a right junction and the junction is continuous
                            profile.junctions[pIdx] = 1;//set the junction to discontinuous
                        }
                        //
                        if(t1 == 0 && t2 == 0 && t3 == 0){//x, v0, v
                            piece.setValTime(0, time0, x0, y0, false);
                            piece.setValTime(1, time0, xs[1], ys[1], false);
                            //
                            const getAcc = (x0, x, v0, v) => ((Math.pow(v, 2) - Math.pow(v0, 2)) / (2 * (x - x0)));
                            //
                            piece.setValTime(2, time0, getAcc(x0, xs[0], xs[1], xs[2]), getAcc(y0, ys[0], ys[1], ys[2]), false);
                        }else if(t1 == 0 && t2 == 0 && t3 == 1){//x, v0, a
                            piece.setValTime(0, time0, x0, y0, false);
                            piece.setValTime(1, time0, xs[1], ys[1], false);
                            piece.setValTime(1, time0, xs[2], ys[2], false);
                        }else if(t1 == 0 && t2 == 1 && t3 == 1){//x, v, a
                            piece.setValTime(0, time0, x0, y0, false);
                            //
                            const getVel = (x0, x, v, a) => (Math.sqrt(Math.pow(v, 2) + 2 * a * (x - x0)));
                            //
                            piece.setValTime(1, time0, getVel(x0, xs[0], xs[1], xs[2]), getVel(y0, ys[0], ys[1], ys[2]), false);
                            piece.setValTime(1, time0, xs[2], ys[2], false);
                        }else if(t1 == 1 && t2 == 1 && t3 == 1){//v0, v, a
                            piece.setValTime(0, time0, x0, y0, false);
                            piece.setValTime(1, time0, xs[0], ys[0], false);
                            piece.setValTime(1, time0, xs[2], ys[2], false);
                        }
                        //
                        piece.paras = piece.paras.slice(0, 3);//remove all but first three paras
                        //
                        command.updateGrid([command.selected]);
                        command.drawGrid();
                        command.moveGrid([command.selected]);
                        command.spawnExtremes([command.selected]);
                        //
                        break;
                }
            }
        });
        //
        this.t.on("input", function(){
            if(isNumeric(this.value)){
                let drop = d3.select('#timeValueDrop');
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
        d3.select('#xApply').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        d3.select('#yApply').on('click', function(){
            this.select();
            input.fieldClick(this);
        });
        //
        d3.select('#applyButton').on('click', function(){
            var power = self.getDropIdx(d3.select('#applyPower'));
            //
            let xField = d3.select('#xApply').property('value');
            let yField = d3.select('#yApply').property('value');
            //
            let xMult = self.idxToMult(self.getDropIdx(d3.select('#xApplyUnit')));
            let yMult = self.idxToMult(self.getDropIdx(d3.select('#yApplyUnit')));
            //
            let x = isNumeric(xField) ? parseFloat(xField) * xMult : 0;
            let y = isNumeric(yField) ? parseFloat(yField) * yMult : 0;
            //
            let selected = self.command.selected;
            //
            let stX = selected.xS.length > power ? selected.xS[power] : 0;
            let stY = selected.yS.length > power ? selected.yS[power] : 0;
            //
            selected.profile.setOrigin(self.command.time);
            //
            selected.setValue(power, stX + x, stY + y);//move object(s)
            self.command.objPosChange([selected]);//update corresponding displays
            //
            d3.select('#xApply').property('value', 0);
            d3.select('#yApply').property('value', 0);
            command.runAuto();
        });
        //
        d3.select('#gravitySet').on('click', function(){
            this.select();
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
                        self.renderEqs();
                    }
                });
                //
                command.updateGrid();
                command.moveGrid();
                command.drawGrid();
                command.spawnExtremes();
                //command.autoScale = false;
                //d3.select('#autoScaleCheck').property('checked', false);
                command.runAuto();
            }
        });
        //
        let storeGrav = 9.81;
        d3.select('#gravityCheck').on('click', function(){
            console.log(d3.select(this).property('checked'));
            if(d3.select(this).property('checked')){
                command.gravity = storeGrav;
                //
                command.objects.forEach(obj => {
                    if(obj.yS[2] == 0){//object still has default gravity
                        obj.setValue(2, 0, command.gravity);
                        command.objPosChange([obj], true);
                        self.renderEqs();
                    }
                });
                //
                command.updateGrid();
                command.moveGrid();
                command.drawGrid();
                command.spawnExtremes();
            }else{
                storeGrav = command.gravity;
                command.gravity = 0;
                //
                command.objects.forEach(obj => {
                    if(obj.yS[2] == storeGrav){//object still has default gravity
                        obj.setValue(2, 0, 0);
                        command.objPosChange([obj], true);
                        self.renderEqs();
                    }
                });
                //
                command.updateGrid();
                command.moveGrid();
                command.drawGrid();
                command.spawnExtremes();
            }
            command.runAuto();
        });
        //
        d3.select('#autoScaleCheck').on('click', function(){
            command.autoScale = d3.select(this).property('checked');
            command.runAuto();
        });
        //
        d3.select('#criticalCheck').on('click', function(){
            command.showExtremes = d3.select(this).property('checked');
            command.deleteAllExtremes();
            command.spawnExtremes();
        });
        //
        d3.select('#timeSnapCheck').on('click', function(){
            command.timeSnapping = d3.select(this).property('checked');
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
            command.objPosChange([command.selected]);
            self.renderEqs();
            self.update(command.selected);
        });
        //
        d3.selectAll('.vectorIcon').on('click', function(d, i){
            //if the index is less the the highestVector, toggle the vector to that index
            console.log(`click on ${i}`);
            if(i < command.highestVector + 1){
                command.toggleVectors(i);
            }else{
                command.toggleVectors(-1);
            }
            //
            d3.select(d3.select('#arrowDisplayDrop').selectAll('option').nodes()[command.vectorMode+1]).property('selected', 'selected');
        });
        //
        //#endregion
        //
        this.tooltipControls();
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
                let mult = this.idxToMult(this.getDropIdx(d3.select(this.drops[idx])));
                //console.log(selected.getVals(Math.floor(idx / 2))[idx % 2]);
                d3.select(field).property("value", (selected.getVals(Math.floor(idx / 2))[idx % 2] / mult).toFixed(this.precision));
            });
        }else{//nothing selected
            this.head.text(`No Object`);
            this.head.style('color', `white`);
            this.fields.forEach(field => {
                d3.select(field).property("value", "");
            });
            d3.select('.pointList').select('ul').html("");
        }
    }
    //
    //#region rendering
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
            d3.select('.pointList').select('ul').html("");
            //
            this.updateTabs();
            this.tabEvents();
        }else{
            d3.selectAll('.tabField').property('value', '');
            d3.selectAll('.juncType').selectAll('.discIcon').attr('class', (d,i) => i == 3 ? `sel discIcon` : `discIcon`);
            d3.selectAll('.tabField').attr('class', 'noField tabField');
            d3.select('.pointList').select('ul').html("");
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
            let mult = this.idxToMult(this.getDropIdx(d3.select('#eqUnitDrop')));
            //
            let curPara = curPiece.paras[power];
            //
            var str = this.buildEq(curPara.xFunc.getCoefs().reverse().map(coef => coef / mult), `x${devs}`);//get the coefficients, reverse them, and multiply them all
            //
            var math = MathJax.Hub.getAllJax("math")[0];
            MathJax.Hub.Queue(["Text", math, str]);
            //
            MathJax.Hub.Queue(function(){
                d3.select(elemx).html(d3.select("#math").html());
            });
            //
            str = this.buildEq(curPara.yFunc.getCoefs().reverse().map(coef => coef / mult), `y${devs}`);
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
            if(num >= 0 && n < len && befores > 0){
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
            befores++;
        }
        if(coefs[0] != 0 || len == 0){//if zero is the only coefficient or the coefficient isn't zero
            num = coefs[0];
            if(num >= 0 && len > 0){//if the last coefficient is positive and the length is greater than one
                str += "+";
            }
            str += `${round(num, 3)}`;
        }
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
    //#endregion
    //
    //#region tooltip
    //
    tooltipControls(){
        let self = this;
        //
        d3.select('#propTitle').on('mouseenter', function(){
            self.handleColTooltip(this, 0, "The object whose data is being displayed" + (self.selected == null ? " (currently none)" : "") + "</p><p class='ttpc'>[Click an object to select it]");
        });
        d3.select('#propTitle').on('mouseleave', function(){
            if(self.ttc == 0) self.removeTooltip();
        });
        //
        d3.selectAll('.tab').on('mouseenter', function(){
            if(self.selected == null) return;
            let pIdx = self.selected.piece;
            let val = parseFloat(d3.select(this).attr('val'));
            self.handleColTooltip(this, 1, `Function ${val} of the object's motion` + (pIdx == val-1 ? "" : `</p><p class='ttpc'>[Click to enter function]`));
        });
        d3.selectAll('.tab').on('mouseleave', function(){
            if(self.ttc == 1) self.removeTooltip();
        });
        //
        d3.select('#addTab').on('mouseenter', function(){
            if(self.selected == null) return;
            self.handleColTooltip(this, 0, "Add a new function to the object's motion </p><p class='ttpc'>[Click to add]");
        });
        d3.select('#addTab').on('mouseleave', function(){
            if(self.ttc == 0) self.removeTooltip();
        });
        //
        d3.selectAll('.juncType').on('mouseenter', function(){
            if(self.selected == null) return;
            self.handleJuncTooltip(this);
        });
        d3.selectAll('.juncType').on('mouseleave', function(){
            if(self.ttc == 1) self.removeTooltip();
        });
        //
        d3.selectAll('.tabField').on('mouseenter', function(){
            if(self.selected == null) return;
            self.handleTabFieldTooltip(this);
        });
        d3.selectAll('.tabField').on('mouseleave', function(){
            if(self.ttc == 2) self.removeTooltip();
        });
        //
        d3.selectAll('.undoButton').on('mouseenter', function(){
            if(self.selected == null) return;
            self.handleColTooltip(this, 3, "Set both values to 0 </p><p class='ttpc'>[Click to set]");
        });
        d3.selectAll('.undoButton').on('mouseleave', function(){
            if(self.ttc == 3) self.removeTooltip();
        });
        //
        d3.selectAll('.vectorToggle').on('mouseenter', function(){
            if(self.selected == null) return;
            self.handleColTooltip(this, 4, "Display the vector for these values </p><p class='ttpc'>[Click to display]");
        });
        d3.selectAll('.vectorToggle').on('mouseleave', function(){
            if(self.ttc == 4) self.removeTooltip();
        });
    }
    //
    handleJuncTooltip(elem){
        let pIdx = this.selected.piece;
        let bounds = this.selected.profile.bounds[pIdx];
        let junctions = this.selected.profile.junctions;
        //
        var desc;
        if(junctions.length > 0){//there are junctions
            if(elem.id == "firstJunc"){
                if(pIdx == 0){
                    if(isFinite(bounds[0])){
                        desc = `This function starts at ${+bounds[0].toFixed(5)}</p><p class='ttpc'>[Click to start function at -infinity]`;
                    }else{
                        desc = "This function starts at -infinity</p><p class='ttpc'>[Click to set a start point]";
                    }
                }else{
                    switch(junctions[pIdx-1]){
                        case 0:
                            desc = `This function starts connected to the previous function at ${+bounds[0].toFixed(5)}</p><p class='ttpc'>[Click to disconnect from previous function]`;
                            break;
                        case 1:
                            desc = `This function starts, disconnected, when the previous function ends at ${+bounds[0].toFixed(5)}</p><p class='ttpc'>[Click to separate from previous function]`;
                            break;
                        case 2:
                            desc = `This function starts at ${+bounds[0].toFixed(5)}</p><p class='ttpc'>[Click to connect to previous function]`;
                            break;
                    }
                }
            }else{
                if(pIdx == junctions.length){
                    if(isFinite(bounds[1])){
                        desc = `This function ends at ${+bounds[1].toFixed(5)}</p><p class='ttpc'>[Click to end function at infinity]`;
                    }else{
                        desc = "This function ends at infinity</p><p class='ttpc'>[Click to set an end point]";
                    }
                }else{
                    switch(junctions[pIdx]){
                        case 0:
                            desc = `This function ends connected to the next function at ${+bounds[1].toFixed(5)}</p><p class='ttpc'>[Click to disconnect from next function]`;
                            break;
                        case 1:
                            desc = `This function ends, disconnected, when the next function starts at ${+bounds[1].toFixed(5)}</p><p class='ttpc'>[Click to separate from next function]`;
                            break;
                        case 2:
                            desc = `This function ends at ${+bounds[1].toFixed(5)}</p><p class='ttpc'>[Click to connect to next function]`;
                            break;
                    }
                }
            }
        }else{
            if(elem.id == "firstJunc"){
                if(isFinite(bounds[0])){
                    desc = `This function starts at ${+bounds[0].toFixed(5)}</p><p class='ttpc'>[Click to start function at -infinity]`;
                }else{
                    desc = "This function starts at -infinity </p><p class='ttpc'>[Click to set a start point]";
                }
            }else{
                if(isFinite(bounds[1])){
                    desc = `This function ends at ${+bounds[1].toFixed(5)}</p><p class='ttpc'>[Click to end function at infinity]`;
                }else{
                    desc = "This function ends at infinity </p><p class='ttpc'>[Click to set an end point]";
                }
            }
        }
        this.handleColTooltip(elem, 1, desc);
    }
    //
    handleTabFieldTooltip(elem){
        let pIdx = this.selected.piece;
        let bounds = this.selected.profile.bounds[pIdx];
        //
        var desc;
        if(elem.id == "firstField"){
            desc = `This function starts at ${+bounds[0].toFixed(5)} </p><p class='ttpc'>[Type here to change start point]`;
        }else{
            desc = `This function ends at ${+bounds[1].toFixed(5)} </p><p class='ttpc'>[Type here to change end point]`;
        }
        this.handleColTooltip(elem, 2, desc);
    }
    //
    handleColTooltip(elem, ttc, desc){
        let elY = elem.getBoundingClientRect().y + elem.getBoundingClientRect().height / 2;
        this.ttc = ttc;
        this.setTooltip(this.columnWidth + 30, elY, desc);
    }
    //
    setTooltip(x, y, desc){
        let tooltip = d3.select('#tooltip');
        tooltip.select('p').html(desc);
        tooltip.style('display', 'block');
        //
        let pHeight = tooltip.node().getBoundingClientRect().height;
        tooltip.style('left', `${x}px`);
        tooltip.style('top', `${y - (pHeight / 2)}px`);
    }
    removeTooltip(){
        d3.select('#tooltip').style('display', 'none');
    }
    //
    //#endregion
    //
    tabEvents(){
        console.log(`calling tab events`);
        console.log(this.tabNum);
        let self = this;
        let input = this.command.input;
        //
        d3.selectAll('.tab').on('click', function(d, i){
            if(self.selected == null) return;
            //
            let selected = self.command.selected;
            if(this.attributes.id==null && selected != null){//not the add tab
                if(selected.profile.bounds.length > 1){
                    if(i == 0){
                        console.log(`setting to ${selected.profile.bounds[0][1]-1}`);
                        self.command.time = selected.profile.bounds[0][1]-.0001;
                        selected.update(true);//bypass lock if necessary
                        self.command.setTime(selected.profile.bounds[0][1]-.0001);
                    }else{
                        console.log(`setting to ${selected.profile.bounds[i][0]}`);
                        self.command.time = selected.profile.bounds[i][0]+.0001;
                        selected.update(true);
                        self.command.setTime(selected.profile.bounds[i][0]+.0001);
                    }
                }
            }else if(selected != null){//is the add tab
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
                self.command.time += .0001;
                selected.update();
                self.command.drawGrid();
                self.command.spawnExtremes([selected]);
                self.tabEvents();
            }
            self.updateTabs();
            self.tooltipControls();
        });
        //
        d3.selectAll('.juncType').on('click', function(d, i){//cycle the junction icons and enable/disable the bounds fields if necessary
            if(self.selected == null) return;
            //
            let pIdx = self.selected.piece;
            let bounds = self.selected.profile.bounds[pIdx];
            if(pIdx == 0 && i == 0){//leftmost piece and left junction
                if(isFinite(bounds[0])){//left bound is already a number
                    self.selected.profile.bounds[pIdx][0] = -Infinity;
                    //
                    self.command.selected.update();
                    self.command.drawGrid();
                    self.command.spawnExtremes([self.selected]);
                    self.updateTabs();
                    self.handleJuncTooltip(this);
                    self.tooltipControls();
                    return;
                }
                self.selected.profile.bounds[pIdx][0] = self.command.time;
                self.command.spawnExtremes([self.selected]);
            }else if (pIdx == self.selected.profile.pieces.length - 1 && i == 1){//rightmost piece and right junction
                if(isFinite(bounds[1])){//right bound is already a number
                    self.selected.profile.bounds[pIdx][1] = Infinity;
                    //
                    self.command.selected.update();
                    self.command.drawGrid();
                    self.command.spawnExtremes([self.selected]);
                    self.updateTabs();
                    self.handleJuncTooltip(this);
                    self.tooltipControls();
                    return;
                }
                self.selected.profile.bounds[pIdx][1] = self.command.time;
                self.command.spawnExtremes([self.selected]);
            }else{
                self.selected.profile.junctions[pIdx-1+i] = (self.selected.profile.junctions[pIdx-1+i] + 1) % 3;//cycle the junction type
                if(self.selected.profile.junctions[pIdx-1+i] == 0){
                    self.selected.profile.setOrigin(self.command.time);
                    self.selected.shiftValue(0, 0, 0);
                    self.command.spawnExtremes([self.selected]);
                }
            }
            //
            self.command.selected.update();
            self.command.drawGrid();
            self.updateTabs();
            self.handleJuncTooltip(this);
            self.tooltipControls();
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
                self.command.spawnExtremes([self.selected]);
                self.handleTabFieldTooltip(this);
            }
        });
        d3.select('.tabField:nth-child(4)').on('input', function(){
            if(isNumeric(this.value) && self.selected.piece != -1){
                console.log('calling right field input');
                self.selected.profile.reRightBoundPiece(self.selected.piece, parseFloat(this.value));
                self.command.objPosChange([self.command.selected], true);
                self.command.spawnExtremes([self.selected]);
                self.handleTabFieldTooltip(this);
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
    //
    idxToMult(idx){
        switch(idx){
            case 0:
                return .001;//mm
            case 1:
                return .01;//cm
            case 2:
                return 1;//m
            case 3:
                return 1000;//km
        }
    }
    //
    getDropIdx(drop){
        let idx = 0;
        while(!this.accessIdx(idx, drop.selectAll('option')).property('selected')) idx++;
        return idx;
    }
    //
    accessIdx(idx, selection){
        return d3.select(selection.nodes()[idx]);
    }
    //
    //#region resizing
    columnResize(newWidth){
        if(newWidth - (window.innerWidth / 10) > getExtra() && window.innerWidth - newWidth > getField()){//if new width is valid
            this.canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
            //
            d3.select('#leftcolumn').style('width', `${newWidth}px`);
            d3.select('#fieldcolumn').style('width', `${window.innerWidth - newWidth}px`);
            //initalX = newX;
            this.columnWidth = parseFloat(d3.select('#leftcolumn').style('width'));
            fitWidth(this.columnWidth);
            fitSolve(this.columnWidth);
            this.command.resize();
        }
    }
    //
    windowResize(){//can trigger a phone switch
        this.canox = parseInt(d3.select("#leftcolumn").style("width")) + parseInt(d3.select("#lefthandle").style("width"));
        this.canoy = parseInt(d3.select("#header").style("height"));
        //
        this.headerHeight = parseFloat(d3.select('#header').style('height'));
        this.screenRatio = window.innerWidth / window.innerHeight;
        //
        if(this.screenRatio > this.RATIOTHRESHOLD && this.command.phoneMode){
            this.phoneSwitch(true);
        }else if(this.screenRatio < this.RATIOTHRESHOLD && !this.command.phoneMode){
            this.phoneSwitch(false);
        }
        //
        if(this.screenRatio > this.RATIOTHRESHOLD){//horizontal
            d3.select('#title').style('font-size', `${this.headerHeight * 0.9}px`);
            d3.select('#title').style('margin-left', `${this.headerHeight / 8}px`);
            //
            this.columnWidth = .25 * window.innerWidth;
            //
            d3.select('#fieldcolumn').style('width', `${window.innerWidth - this.columnWidth}px`);
        }else{//vertical
            d3.select('#title').style('font-size', `${this.headerHeight * 1.1}px`);
            d3.select('#title').style('margin-left', `${this.headerHeight / 8}px`);
            //
            this.columnWidth = window.innerWidth;
        }
        //
        let heightFactor = 60;
        d3.select('#header').style('font-size', `${window.innerHeight / heightFactor}px`);//font resizing
        d3.select('#leftcolumn').style('font-size', `${this.columnWidth / 10}px`);
        d3.select('#fieldcolumn').style('font-size', `${window.innerHeight / heightFactor}px`);
        d3.select("#timeHead").style('font-size', `${window.innerHeight / heightFactor}px`);
        //
        fitWidth(this.columnWidth);
        fitSolve(this.columnWidth);
    }
    //
    phoneSwitch(horizontal){
        //adjust header font-size and hide field by screen ratio
        console.log(`Switching phone mode to ${!horizontal}`);
        if(horizontal){//horizontal
            console.log("Re-entering horizontal");
            d3.select('#title').html('Physics Calculator');
            d3.select('#settingsB').style('font-size', `250%`);
            d3.select('#leftcolumn').style('width', `25%`);
            d3.select('#fieldcolumn').style('display', 'flex');
            d3.select('#lefthandle').style('display', 'block');
            //
            d3.select('#propHead').style('display', 'block');
            d3.selectAll('.headerButton').style('display', 'block');
            //
            d3.select("#interface").style('height', '85%');
            d3.select("#time").style('height', '10%');
            d3.select("#timeHead").style('height', '25%');
            d3.select("#timeline").style('height', '75%').style('top', '25%');
            this.command.timeline.resize();
            //
            d3.select("#timeHead").selectAll('.range.cutout').style('display', 'flex');
            d3.select('#playback').style('width', '10%').style('margin-left', '45%');
        }else{//vertical
            d3.select('#title').html('Phys Calc');
            //d3.select('#settingsB').style('font-size', `150%`);
            d3.select('#leftcolumn').style('width', `100%`);
            d3.select('#fieldcolumn').style('display', 'none');
            d3.select('#lefthandle').style('display', 'none');
            //
            d3.select('#propHead').style('display', 'none');
            d3.selectAll('.headerButton').style('display', 'none');
            //
            d3.select("#interface").style('height', '80%');
            d3.select("#time").style('height', '15%');
            d3.select("#timeHead").style('height', '40%');
            d3.select("#timeline").style('height', '60%').style('top', '40%');
            this.command.timeline.resize();
            //
            d3.select("#timeHead").selectAll('.range.cutout').style('display', 'none');
            d3.select('#playback').style('width', '60%').style('margin-left', '20%');
        }
        //
        this.command.phoneMode = !horizontal;
    }
    //#endregion
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

function getWidth(id){//get width of any element, including margins
    let elem = d3.select(id);
    return parseFloat(elem.style('width')) + parseFloat(elem.style('margin-left')) + parseFloat(elem.style('margin-right'));
}

function getExtra(){//get the width of the non-field elements of the values section
    return getWidth('.expandCompIcon') + (2 * getWidth('.propParaLabel')) + (2 * getWidth('.propdrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getCalc(){//get the width of the non-field elements of the solver section
    return (2 * getWidth('.checkbox')) + (2 * getWidth('.readCalcLabel')) + (2 * getWidth('.readCalcDrop')) + parseFloat(d3.select('.valueContents').style('padding-left')) + 10;
}

function getField(){//get the width of the field
    if(d3.select('#settings').style('display') == 'none'){
        return getWidth('#leftfield') + 10;
    }else{
        return parseFloat(d3.select('#settings').style('width')) + getWidth('#leftfield') + 10;
    }
}

function fitWidth(columnWidth){//fit the input fields to the width of the left column
    let labelWidth = getExtra();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.fitWidth').style('width', `${fieldWidth}px`);
}

function fitSolve(columnWidth){//fit the input fields in the solve section
    let labelWidth = getCalc();
    let fieldWidth = (columnWidth - labelWidth) / 2;
    //
    d3.selectAll('.solveInput').style('width', `${fieldWidth}px`);
}