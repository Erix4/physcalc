export default class Profile{
    constructor(command, depth, xCoefs, yCoefs, color){//depth is number of derivative functions, xCoefs & yCoefs are parametric position coefficients
        this.command = command;
        this.obj = command.objects[command.objects.length - 1];
        console.log(`--XX-- Making parametric function with x:[${xCoefs}] and y:[${yCoefs}]`);
        //console.log(arguments);
        //
        this.color = color;
        //
        this.paras = [new Para(command.time, 1, xCoefs, yCoefs, this.color)];
        this.comps = [[new Para(command.time, 1, xCoefs, yCoefs)]];
        for(var n = 0; n < depth; n++){//generate derivatives
            xCoefs = [];
            let xTerms = this.paras[n].xFunc.terms;//get terms of x function of last parametric function
            for(var a = 0; a < xTerms.length - 1; a++){//find coefficients for derivative function (but not for last)
                xCoefs.push(xTerms[a].coef * xTerms[a].power);
            }
            yCoefs = [];
            let yTerms = this.paras[n].yFunc.terms;
            for(var a = 0; a < yTerms.length - 1; a++){
                yCoefs.push(yTerms[a].coef * yTerms[a].power);
                //console.log(yTerms[a].coef * yTerms[a].power);
            }
            //
            if(xCoefs.length == 0){
                xCoefs.push(0);
            }
            if(yCoefs.length == 0){
                yCoefs.push(0);
            }
            this.paras.push(new Para(0, 1, xCoefs, yCoefs, this.color));
            this.comps.push([new Para(0, 1, xCoefs, yCoefs)]);//add current net function as top component
        }
        console.log(`Initialzing complete, with x:[${this.paras[0].xFunc.getCoefs()}] and y:[${this.paras[0].yFunc.getCoefs()}]`);
        console.log(`Current pos: (${this.paras[0].xFunc.calc(this.command.time.toFixed(2))}, ${this.paras[0].yFunc.calc(this.command.time.toFixed(2))})`);
        //
        console.log("Current profile:");
        console.log(this.paras);
        console.log(this.comps);
    }
    //
    draw(power, steps){
        let para = this.paras[power];//get para by power
        let dom = this.calcDomain();
        //
        dom.forEach(domain => {
            para.draw(this.command, domain[0], domain[1], steps / dom.length);//draw the para wherever it's on screen
        });
    }
    //
    calcDomain(){
        var vals = [];
        this.paras[0].xFunc.calcDomain(this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]).forEach(val =>{
            vals.push([val, 0])
        })
        this.paras[0].yFunc.calcDomain(this.command.scaleY.domain()[0], this.command.scaleY.domain()[1]).forEach(val => {//get y time domains
            vals.push([val, 1]);//put them all in a list
            //console.log(val);
        });
        //
        vals.sort((a,b)=>a[0]-b[0]);//sort domain values numerically by first element
        //
        var ranges = [];
        var x = false;
        var y = false;
        var visible = false;
        vals.forEach(val => {
            if(val[1] == 0){
                if(this.paras[1].xFunc.calc(val[0]) == 0){//discard value if derivative is 0
                    return;
                }
                x = !x;
            }else{
                if(this.paras[1].yFunc.calc(val[0]) == 0){//discard value if derivative is 0
                    return;
                }
                y = !y;
            }
            //
            if(x && y){
                ranges.push([val[0]]);
                visible = true;
            }else if((!x || !y) && visible && ranges.length > 0){
                ranges[ranges.length - 1].push(val[0]);
                visible = false;
            }
        });
        //
        return ranges;//return ranges where function is visible
    }
    //
    fullSet(x, y){
        console.log("Full set");
        for(var n = this.paras.length - 1; n >= 0; n--){
            this.setValues(n, x, y)
        }
    }
    //
    setValTime(power, t, x, y){
        this.paras[power].setOff(t, x, y);
        this.setPower(power, this.paras[power].xFunc.getCoefs().reverse(), this.paras[power].yFunc.getCoefs().reverse());
        this.propagate(power);
    }
    //
    setValues(power, x, y){
        this.paras[power].setOff(this.command.time, x, y);//offset the functions at the desired power so current time returns desired values
        this.setPower(power, this.paras[power].xFunc.getCoefs().reverse(), this.paras[power].yFunc.getCoefs().reverse());//update components
        this.propagate(power);//propagate new para to other powers
    }
    //
    setPower(power, xCoefs, yCoefs, xOff, yOff){//set the net functions for a given power and changes top component so sum matches
        //console.log(arguments);
        if(power >= this.paras.length){
            this.paras.splice(0, 0, new Para(this.command.time, 1, xCoefs, yCoefs));
            if(arguments.length > 3){
                this.paras[power].setTermX(this.paras[power].getTermX() + xOff - this.paras[power].calc(this.command.time)[0]);
                this.paras[power].setTermY(this.paras[power].getTermY() + yOff - this.paras[power].calc(this.command.time)[1]);
            }
            this.comps.push([this.paras[0]]);
        }else{
            //let idx = this.paras.length - power - 1;
            var sum;
            for(var n = xCoefs.length - 1; n >= 0; n--){//for every x coefficient of the x net
                sum = 0;
                for(var a = 1; a < this.comps[power].length; a++){//for each component except the first, at the current derivative power
                    let comp = this.comps[power][a];
                    if(comp.xFunc.terms.length - 1 >= n){//check if coefficient exists in component
                        sum += comp.xFunc.terms[n].coef;//sum up the current power x coefficients from the components
                    }
                }
                //this.comps[1][0].setTerm(n, xCoefs[n] - sum);
                this.comps[power][0].setTermX(n, xCoefs[n] - sum);//set the current x coefficient of default component to value necessary to reach net goal
                this.paras[power].setTermX(n, xCoefs[n]);//also flips the order (arguments are passed backwards for some reason)
            }
            for(var n = yCoefs.length - 1; n >= 0; n--){//for every y coefficient of the y net
                sum = 0;
                //console.log(`Setting terms at power ${n}`);
                for(var a = 1; a < this.comps[power].length; a++){//for each component except the first, at the current derivative power
                    let comp = this.comps[power][a];
                    if(comp.yFunc.terms.length - 1 >= n){//check if coefficient exists in component
                        sum += comp.yFunc.terms[n].coef;//sum up the current power y coefficients from the components
                    }
                }
                this.comps[power][0].setTermY(n, yCoefs[n] - sum);//set the current y coefficient of default component to value necessary to reach net goal
                this.paras[power].setTermY(n, yCoefs[n]);
            }
            if(arguments.length > 3){
                //console.log(this.paras[power].getTermY(0) + yOff - this.paras[power].calc(this.command.time)[1]);
                this.paras[power].setTermX(0, this.paras[power].getTermX(0) + xOff - this.paras[power].calc(this.command.time)[0]);
                this.paras[power].setTermY(0, this.paras[power].getTermY(0) + yOff - this.paras[power].calc(this.command.time)[1]);
                //
                //console.log(yOff);
                //console.log(this.paras[power].getTermY(0));
                //console.log(`Should be ${this.paras[power].calc(this.command.time)[1]}`);
                //
                sum = 0;
                for(var a = 1; a < this.comps[power].length; a++){//for each component except the first, at the current derivative power
                    let comp = this.comps[power][a];
                    sum += comp.xFunc.terms[0].coef;//sum up the current x constants from the components
                }
                this.comps[power][0].setTermX(0, this.paras[power].getTermX(0) - sum);
                //
                sum = 0;
                for(var a = 1; a < this.comps[power].length; a++){//for each component except the first, at the current derivative power
                    let comp = this.comps[power][a];
                    sum += comp.yFunc.terms[0].coef;//sum up the current y constants from the components
                }
                this.comps[power][0].setTermY(0, this.paras[power].getTermY(0) - sum);
            }
        }
    }
    //
    getExtremes(){
        var exts = [];
        //
        this.paras.forEach(para => {
            exts.push(...para.xFunc.calcRoots());
            exts.push(...para.yFunc.calcRoots());
        });
        //
        return exts;
    }
    //
    drawPoints(points){
        points.forEach(point => {
            this.paras[0].drawPoint(this.command, point);
        });
    }
    //
    setOrigin(time, power){
        if(power || power == 0){
            this.paras[power].xFunc.origin = time;
            this.paras[power].yFunc.origin = time;
        }else{
            this.paras.forEach(para => {
                para.xFunc.origin = time;
                para.yFunc.origin = time;
            });
        }
    }
    //
    addComp(power, xCoefs, yCoefs){//power is descending (2, 1, 0) & length is 3
        //console.log(arguments);
        this.comps[power].push(new Para(this.command.time, 1, xCoefs, yCoefs));//push a new component to the desired power
        //console.log("New comp pushed succesfully");
        //
        this.sumComps(power, xCoefs.length, yCoefs.length);
    }
    //
    setCompVal(power, idx, x, y){
        this.comps[power][idx].setTermX(0, x);
        this.comps[power][idx].setTermY(0, y);
        //
        this.sumComps(power, this.comps[power][idx].xFunc.terms.length, this.comps[power][idx].yFunc.terms.length);
    }
    //
    sumComps(power, xL, yL){
        var sum;
        for(var n = 0; n < xL; n++){//for every x coefficient of the new component
            sum = 0;
            this.comps[power].forEach(comp => {//for each component at the current derivative power
                //console.log(`${comp.xFunc.terms.length} and n: ${n}`);
                if(n < comp.xFunc.terms.length){//check if coefficient exists in component
                    sum += comp.xFunc.terms[comp.xFunc.terms.length - 1 - n].coef;//sum up the current power x coefficients from the components
                }
            });
            this.paras[power].setTermX(n, sum);//set the current x coefficient of index function to sum of component coefficients
        }
        for(var n = 0; n < yL; n++){//for every y coefficient of the new component
            sum = 0;
            this.comps[power].forEach(comp => {//for each component at the current power
                if(n < comp.yFunc.terms.length){//check if coefficient exists in component
                    //console.log(`Summing term ${comp.yFunc.terms[comp.yFunc.terms.length - 1 - n].coef}`);
                    sum += comp.yFunc.terms[comp.yFunc.terms.length - 1 - n].coef;//sum up the current power y coefficients from the components
                }
            });
            this.paras[power].setTermY(n, sum);
        }
        //
        this.propagate(power);
    }
    //
    propagate(power){//para powers ascend (0,1,2,3,4)
        //console.log(`Propogating from power ${power}`);
        //let depth = this.paras.length - power - 1;//also is index of changed para in net list
        let current = this.paras[power];
        for(var n = power - 1; n >= 0; n--){//integrate functions of higher power
            let para = this.paras[n];
            let timeOff = para.calc(this.command.time);//get offset at current time
            let newX = [para.xFunc.terms[para.xFunc.terms.length - 1].coef];
            for(var a = current.xFunc.terms.length - 1; a >= 0; a--){//for every term in currently integrated function
                let p = current.xFunc.terms.length - a;//get power of function being propagated to
                newX.push(current.xFunc.terms[a].coef / p);
            }
            //
            let newY = [para.yFunc.terms[para.yFunc.terms.length - 1].coef];
            //console.log(`Preserved constant is ${para.calc(this.command.time)[1]}`);
            for(var a = current.yFunc.terms.length - 1; a >= 0; a--){//for every term in current integrated function
                let p = current.yFunc.terms.length - a;//get power of function being propagated to
                //console.log(current.yFunc.terms[a].coef / p);
                newY.push(current.yFunc.terms[a].coef / p);
            }
            //console.log(newY);
            this.setPower(n, newX, newY, timeOff[0], timeOff[1]);//change function
            //
            current = this.paras[n];//get new function to be integrated
            //console.log("current at 0: " + current.yFunc.terms[0].coef);
            //console.log("current at 1: " + current.yFunc.terms[1].coef);
        }
        //
        //console.log("Deriving");
        current = this.paras[power];
        for(var n = power + 1; n < this.paras.length - 1; n++){//derive to lower powers
            let newX = [];
            //console.log(current);
            for(var a = current.xFunc.terms.length - 2; a >= 0; a--){//for every term except the last (the constant, which is discarded)
                let p = current.xFunc.terms.length - a - 1;//get power of function being propagated to
                newX.push(current.xFunc.terms[a].coef * p);
            }
            //
            let newY = [];
            for(var a = current.yFunc.terms.length - 2; a >= 0; a--){//for every term except the last (the constant, which is discarded)
                let p = current.yFunc.terms.length - a - 1;//get power of function being propagated to
                newY.push(current.yFunc.terms[a].coef * p);
                //console.log(`${current.yFunc.terms[a].coef * p} from ${current.yFunc.terms[a].coef} * ${p}`);
            }
            //
            if(newX.length == 0){
                newX.push(0);
            }
            if(newY.length == 0){
                newY.push(0);
            }
            //
            //console.log(newY);
            this.setPower(n, newX, newY);
            //
            current = this.paras[n];
            //console.log("current at 0: " + current.yFunc.terms[0].coef);
        }
    }
    //
    calc(power, time){
        return this.paras[power].calc(time);
    }
}

export class Para{
    constructor(time, steps, xCoefs, yCoefs, color = "white"){
        this.steps = steps;
        //
        this.color = "red";
        if(arguments.length > 4){
            this.color = color;
        }
        //
        this.xFunc = (new Func(this.steps, xCoefs));
        this.yFunc = (new Func(this.steps, yCoefs));
        this.xFunc.setOff(time);
        this.yFunc.setOff(time);
    }
    //
    calc(t){
        return [this.xFunc.calc(t), this.yFunc.calc(t)];
    }
    //
    setOff(t, x, y){
        if(arguments.length > 1){
            this.xFunc.setOff(t, x);
            this.yFunc.setOff(t, y);
        }else{
            this.xFunc.setOff(t);
            this.yFunc.setOff(t);
        }
    }
    //
    getTermX(power){
        let length = this.xFunc.terms.length;
        if(length > power){
            return this.xFunc.terms[length - power - 1].coef;
        }else{
            return 0;
        }
    }
    getTermY(power){
        let length = this.yFunc.terms.length;
        if(length > power){
            return this.yFunc.terms[length - power - 1].coef;
        }else{
            return 0;
        }
    }
    //
    setTerm(power, valx, valy){//assume descending power order (2,1,0), so power 2 correspondes to term length 3
        //console.log(`Reterming to (${valx}, ${valy})`);
        this.setTermX(power, valx);
        //
        this.setTermY(power, valy);
    }
    //
    setTermX(power, valx){//assume descending power order (2,1,0), so power 2 correspondes to term length 3
        let xLength = this.xFunc.terms.length;
        if(xLength > power){//term already exists
            this.xFunc.terms[xLength - power - 1].coef = valx;
            if(valx == 0 && xLength - power - 1 == 0 && xLength > 1){//if setting top term to zero
                this.xFunc.terms.splice(0,1);//delete arbitrary first term
            }
        }else{//create term if necessary
            while(xLength < power){
                this.xFunc.terms.splice(0, 0, new Term(0, xLength));
                xLength++;
            }
            this.xFunc.terms.splice(0, 0, new Term(valx, xLength));
        }
    }
    setTermY(power, valy){
        let yLength = this.yFunc.terms.length;
        //console.log(`Setting term with power ${power} to ${valy} in length ${yLength}`);
        if(yLength > power){
            this.yFunc.terms[yLength - power - 1].coef = valy;
            if(valy == 0 && yLength - power - 1 == 0 && yLength > 1){//if setting top term to zero
                //console.log("Deleting arbitrary term");
                this.yFunc.terms.splice(0,1);//delete arbitrary first term
            }
        }else{
            while(yLength < power){
                this.yFunc.terms.splice(0, 0, new Term(0, yLength));
                yLength++;
                //console.log(yLength);
            }
            this.yFunc.terms.splice(0, 0, new Term(valy, yLength));
        }
    }
    //
    draw(command, start, end, steps){
        if(!steps){
            steps = this.steps;
        }
        //
        var lp = this.calc(start);
        var np;
        let loop = (end- start) / steps;
        var t = start;
        //
        //console.log(end + " but " + loop + " from " + start);
        let ctx = command.ctx;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5; 
        //
        for(var n = 0; n < steps; n++){
            np = this.calc(t + loop);
            //
            ctx.beginPath();
            //ctx.lineJoin = "round";
            ctx.moveTo(command.scaleX(lp[0]), command.scaleY(lp[1]));
            if(visibleLine(command, lp, np)){
                ctx.lineTo(command.scaleX(lp[0]), command.scaleY(lp[1]));
                ctx.lineTo(command.scaleX(np[0]), command.scaleY(np[1]));
            }
            ctx.stroke();
            //
            lp = np;
            t += loop;
        }
    }
    //
    drawPoint(command, val){
        let ctx = command.ctx;
        let lp = this.calc(val);
        //
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(command.scaleX(lp[0]), command.scaleY(lp[1]), 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export class Func{
    constructor(steps, poly){//make new equation (called a function)
        this.terms = [];//defaults
        this.steps = steps;
        //
        this.origin = 0;
        //
        this.color = "blue";
        //
        var n = poly.length - 1;
        poly.forEach(coef => {//for each coefficient listed, make a new term with decending powers (i.e. c*x^2 + c*x^1 + c*x^0)
            this.terms.push(new Term(coef, n));
            n--;
        });
    }
    //
    calc(input){//calculate the value of the equation given an input
        var sum = 0;
        //console.log(this.getCoefs());
        this.terms.forEach(term => {//find the sum of each term at the input
            sum += term.calc(input);
            //console.log(`Adding to ${sum} from ${term.coef} * ${input}^${term.power}`);
        });
        return sum;
    }
    //
    calcDomain(start, end){
        var vals = [];//all values where the function touches the screen boundary
        vals.push(...this.calcRoots(start));//length meaning: 0=function switches directions, end values will hold other domain, 1=one side of domain, 2=holds two domain
        vals.push(...this.calcRoots(end));
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically
        if(vals.length > 1){
            return [vals[0], vals[vals.length - 1]];//return lowest and highest domain values
        }else{
            return vals;
        }
    }
    //
    calcRoots(val = 0){//faulty, assuming term powers are in descending order: 2, 1, 0
        //console.log(`Find roots for value ${val} in case ${this.terms.length}`);
        switch(this.terms.length){
            case 1:
                return [];//because value is constant, there are either no roots or infinite roots
            case 2:
                if(this.terms[0].coef != 0){
                    return [(val - this.terms[1].coef) / this.terms[0].coef];//simple algebra for linear function
                }else{
                    return [];
                }
            case 3:
                var roots = [];
                let a = this.terms[0].coef;//get quadratic coefficients
                let b = this.terms[1].coef;
                let c = this.terms[2].coef - val;
                let disc = Math.pow(b, 2) - (4 * a * c);//calculate discriminant
                for(var n = 0; n < 2; n++){
                    if(a == 0 || disc < 0) continue;//break out if dividing by 0 or sqrting a negative number
                    //
                    //console.log(`${disc} from (${a}, ${b}, ${c})`);
                    roots.push((-b + (Math.pow(-1, n)) * Math.sqrt(disc)) / (2 * a));
                }
                return roots;
            default:
                //console.log("I can't do that yet!");
                return [];
        }
    }
    //
    calcDelta(rStart, rEnd){//calculate the differnce between two values
        var p1 = calc(rStart);
        var p2 = calc(rEnd);
        return p2 - p1;
    }
    //
    addTerm(coef, power){//add a new term to the equation
        this.terms.push(new Term (coef, power));
    }
    //
    setOff(Xoffset, Yoffset){
        if(arguments.length < 2){
            Yoffset = this.calc(this.origin);
        }else{
            //console.log(`Adding to Yoffset ${this.terms[this.terms.length - 1].coef} - ${this.calc(this.origin)}`)
            Yoffset += this.terms[this.terms.length - 1].coef - this.calc(this.origin);
        }
        let orxo = Xoffset;
        Xoffset -= this.origin;
        //console.log(this.getCoefs());
        //console.log(`Setting to offset (${Xoffset}, ${Yoffset})`);
        var sum = 0;
        //console.log(this.calc(0));
        this.terms[this.terms.length - 1].coef = 0
        var pascal = [1,1];//pascal's triangle!
        for(var n = this.terms.length - 2; n >= 0; n--){//for each term starting with second to last (lowest coefficient is constant, x offset won't affect it and it screws up my pascal)
            let l = this.terms[n].power;
            //
            let coefs = [];
            this.terms.forEach(term => {
                coefs.push(term.coef);
            });
            this.terms[n].coef = 0;
            //console.log(coefs);
            //console.log(`Starting with term ${l}, expanding to ${pascal}`);
            for(var a = 0; a <= l; a++){//for every term of power less than or equal to current 
                this.terms[n + a].coef += (coefs[n] * pascal[a] * Math.pow(-Xoffset, a));
                //console.log(`Changing term ${l - a} by ${coefs[n] * pascal[a] * Math.pow(-Xoffset, a)} to ${this.terms[n + a].coef} from ${coefs[n]}*${pascal[a]}*${Math.pow(-Xoffset, a)}`);
            }
            //
            let tempPasc = [1,1];
            for(var a = 0; a < l; a++){//generate next layer in pascal's triangle
                tempPasc.splice(a + 1, 0, pascal[a] + pascal[a + 1]);//adjust term based on polynomial generated from application of x offset
                //tempPasc[a] = pascal[a] + pascal[a + 1];
            }
            pascal = [...tempPasc];
        }
        //
        this.terms[this.terms.length - 1].coef += Yoffset;// - this.calc(Xoffset);
        //console.log(`Term changed to ${this.terms[this.terms.length - 1].coef} by ${Yoffset}`);
        this.origin = orxo;
        //console.log(`Function set to ${this.getCoefs()}`);
        //console.log(`New origin is ${this.origin}`);
    }
    //
    setColor(color){
        this.color = color;
    }
    //
    getCoefs(){
        var coefs = [];
        this.terms.forEach(term => {
            coefs.push(term.coef);
        });
        return coefs;
    }
    //
    draw(command, start, end){//draw the function over a certain space
        var lastX = start;
        var lastV = this.calc(start);
        var nextX;
        var nextV;
        let loop = (end - start) / this.steps;
        //
        //console.log(end + " but " + loop + " from " + start);
        let ctx = command.ctx;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5; 
        //
        for(var n = 0; n < this.steps; n++){
            nextX = lastX + loop;
            nextV = this.calc(nextX);
            //
            //console.log(nextX);
            //
            if(inBounds(command.scaleY(lastV), 0, command.scrH) || inBounds(command.scaleY(nextV), 0, command.scrH)){
                //
                //console.log(`Start at (${field.scale(lastX)}, ${field.scrH - field.scale(lastV)})`);
                //
                ctx.beginPath();
                ctx.moveTo(command.scaleX(lastX), command.scaleY(lastV));
                ctx.lineTo(command.scaleX(nextX), command.scaleY(nextV));
                ctx.stroke();
            }
            //
            lastX = nextX;
            lastV = nextV;
        }
    }
    //
    redraw(field, selection, start, end){
        /*
            1. (Optional) When necessary (after value change) bake visible lines
            2. Calc # of necessary lines for draw
            3. Add or remove excess lines
            4. Adjust position for lines
        */
    }
    //
    resolve(inputs){
        let X = this.approxMatrix(inputs);
        this.terms = [];
        //
        let len = X.length - 1;
        X.forEach((coef, idx) => {
            this.addTerm(coef, len - idx);
        });
    }
    //
    approxMatrix(inputs){
        let X = this.matrixCalc(inputs);
        //
        let c = 0;
        while(X.length == 0 && c < 5){
            //inputs.forEach(input => input[2] += .1);
            inputs[c][2] += .1;
            X = this.matrixCalc(inputs);
            c++;
        }
        if(X.length == 0){
            console.log("APPROX FAILED.");
        }
        console.log(X);
        return X;
    }
    //
    matrixCalc(inputs){
        //size of input list is number of inputs and size of matrix
        let len = inputs.length - 1;//also is the power of the solution
        //
        //for every input in inputs, [value, power, time]
        var powerSets = [[], []];//lists of inputs with the same power, within time != 0 and time == 0, like [[#, #, 1]], [[#, 3, #],[#, 3, #]], [[#, 2, #]], [], [[#, 0 , #]]
        for(var n = 0; n < len + 1; n++){
            powerSets[0].push([]);//cannot be done all at once because fill populates it with an identical reference list
            powerSets[1].push([]);
        }
        //
        inputs.forEach(input => {//reorder inputs in power sets with descending power
            if(input[2] == 0){//check if time is zero
                powerSets[1][len - input[1]].push(input);
            }else{
                powerSets[0][len - input[1]].push(input);
            }
        });
        //
        //let tlen = powerSets[0].length - 1;//record length of nonzero inputs - 1
        let tlen = -1;//tlen is index of last, not length
        powerSets[0].forEach(set => {tlen += (set.length > 0 ? 1 : 0)});//count number on nonempty lists in the nonzero power set
        console.log(tlen);
        //
        let orderedInputs = [];//list of inputs in order (ready to be converted to matrix)
        powerSets.forEach(time => {//make sure each set is order correctly
            /*if(set.length > 0 && set[0][2] == 0){//if first value in power set is set at time 0
                let len1 = set.length - 1;
                set.splice(len1, 0, ...set.splice(0, 1));//reposition the value to the last in the set
            }*/
            time.forEach(set => {
                orderedInputs.push(...set);
            })
        });
        //var orderedInputs = inputs.slice();
        console.log(orderedInputs.slice());
        //
        var A = [];
        orderedInputs.forEach(input => {//for each input (j is index), add a new row to the matrix
            var row = [];
            for(var i = 0; i <= len; i++){
                if(len - input[1] - i > 0){//make sure not taking 0 to a negative power
                    row.push(genDerMults(len, input[1], i) * Math.pow(input[2], len - input[1] - i));
                }else{
                    row.push(genDerMults(len, input[1], i));
                }
                console.log(`Pushed ${row[row.length - 1]} from ${genDerMults(len, input[1], i)} * ${Math.pow(input[2], len - input[1] - i)}`);
            }
            A.push(row);
        });
        //
        /*while(A[0][0] == 0){
            A.splice(0, 0, A.pop());
            //A.push(...A.splice(0, 1));
            orderedInputs.splice(0, 0, orderedInputs.pop());
            //orderedInputs.push(...orderedInputs.splice(0, 1));
        }*/
        //
        console.log("Initial matrix A:");
        console.log(A.slice());
        //LU Decompositon
        var U = A.slice();//set upper triangular matrix equal to current matrix
        var L = [];
        for(var n = 0; n <= len; n++){//set lower matrix to default values
            L.push(Array(len + 1).fill(0));//fill row with 0s
            L[n][n] = 1;//set diagonal to 1
        }
        //
        for(var i = 1; i <= len; i++){//i is row index (I know it's flipped, I did it by accident and can't change it)
            for(var j = 0; j < i; j++){
                let mult;
                if(U[j][j] == 0){
                    mult = 0;
                }else{
                    mult = U[i][j] / U[j][j];
                }
                console.log(`Multiplier: ${mult}, j: ${j}`);
                if(j < len && i < len){
                    var c = 0
                    console.log(`Check bc ${U[i][j + 1]} == ${(mult * U[j][j + 1])}, ${mult} * ${U[j][j + 1]}`);
                    console.log(`\tBut next  = ${U[i + 1][j + 1]}`);
                    while(U[i][j + 1] == (mult * U[j][j + 1]) && c < len && U[i + 1][j + 1] != 0){
                        console.log(`RO bc ${U[i][j + 1]} == ${(mult * U[j][j + 1])}, ${mult} * ${U[j][j + 1]}`);
                        console.log(`Evaluates ${U[i][j + 1] == (mult * U[j][j + 1])}`);
                        //
                        if(orderedInputs[i][2] != 0 && i < tlen){//if input time is nonzero and it's not the last in the nonzero list
                            U.splice(tlen, 0, ...U.splice(i, 1));//move row and corresponding input to last in nonzero list
                            orderedInputs.splice(tlen, 0, ...orderedInputs.splice(i, 1));
                        }else if(orderedInputs[i][2] == 0 && i < len){//if input time is zero and it's not the last in the list
                            U.push(...U.splice(i, 1));//move row and corresponding input to last in list
                            orderedInputs.push(...orderedInputs.splice(i, 1));
                        }else{
                            console.log("Uh oh");
                        }
                        //
                        if(U[j][j] == 0){
                            mult = 0;
                        }else{
                            mult = U[i][j] / U[j][j];
                        }
                        console.log(`Multiplier: ${mult}, j: ${j}`);
                        //
                        c++;
                    }
                    if(c == len){
                        console.log("Reorder failed");
                    }
                }
                L[i][j] = mult;
                U[i] = subRow(U[i], U[j], L[i][j]);//subtract row for Guassian Elimination
                console.log(U.slice());
                let zeroCheck = 0;
                U[i].forEach(val => {zeroCheck += val});
                if(zeroCheck == 0){
                    console.log("Processed failed. Exiting function.");
                    return [];
                }
            }
        }
        //
        console.log(L);
        console.log(U);
        //console.log("Check:");
        //console.log(multMatricis(L, U));//verified
        if(checkEqual(multMatricis(L, U), A)){
            console.log("CONFIRMED");
        }else{
            console.log("INCORRECT");
        }
        //
        //solve for Y temporary values
        var Y = [orderedInputs[0][0] / L[0][0]];
        for(var i = 1; i <= len; i++){
            Y.push(calcRowSolLower(orderedInputs[i][0], L, i, Y));
            console.log(Y[Y.length - 1]);
        }
        console.log(Y);
        //solve for solutions (X)
        var X = [Y[len] / U[len][len]];
        for(var i = len - 1; i >= 0; i--){
            X.splice(0, 0 , Math.round(calcRowSolUpper(Y[i], U, i, X), 5));
        }
        console.log("Solutions: ");
        console.log(X);
        //
        console.log("Check:");
        let check = true;
        orderedInputs.forEach((input, i) => {
            console.log(`Equation ${i} should be ${input[0]}`);
            var build = A[i][0] * X[0];
            var total = A[i][0] * X[0];
            for(var j = 1; j <= len; j++){
                build += " + " + A[i][j] * X[j];
                total += A[i][j] * X[j];
            }
            console.log(`Evaluates to ${total} from ${build}`);
            if(total != input[0]){
                check = false;
            }
        });
        if(check){
            console.log("SUCCESS!!");
        }else{
            console.log("FAILED.");
        }
        return X;
    }
}

function multMatricis(A, B){//assumes square matricies of the same size
    let len = A.length - 1;
    var P = [];
    for(var i = 0; i <= len; i++){//row loop
        var newRow = [];
        for(var j = 0; j <= len; j++){//column loop
            var sum = 0;
            for(var n = 0; n <= len; n++){
                sum += A[i][n] * B[n][j];
            }
            newRow.push(sum);
        }
        P.push(newRow);
    }
    return P;
}

function checkEqual(A, B){
    A.forEach((row, i) => {
        row.forEach((val, j) => {
            if(val != B[i][j]){
                return false;
            }
        });
    });
    return true;
}

function genDerMults(len, power, i){//length of matrix, power of input, and index of value in matrix
    if(len - i < power){
        return 0;//derivative is too high, term must be 0
    }else{
        return factorial(len - i, power);//basically (num - i)!/(num - power - i)!
    }
}

function subRow(row1, row2, mult){
    var newRow = [];
    row1.forEach((val, n) => {
        newRow.push(val - mult * row2[n]);
    });
    return newRow;
}

function calcRowSolution(input, sumList, idx, start, end, solutions){
    var sum = 0;
    for(var i = start; i <= end; i++){
        console.log(`Adding sum ${sumList[idx][i] * solutions[i]}`);
        sum += sumList[idx][i] * solutions[i];
    }
    //
    console.log(`from (i-s)/L to (${input} - ${sum}) / ${sumList[idx][idx]}`);
    return (input - sum) / sumList[idx][idx];
}

function calcRowSolLower(input, L, idx, Y){
    var sum = 0;
    for(var i = 0; i < idx; i++){
        console.log(`Adding sum ${L[idx][i] * Y[i]}`);
        sum += L[idx][i] * Y[i];
    }
    //
    console.log(`from (i-s)/L to (${input} - ${sum}) / ${L[idx][idx]}`);
    return (input - sum) / L[idx][idx];
}

function calcRowSolUpper(input, U, idx, X){
    var sum = 0;
    for(var i = idx + 1; i < U.length; i++){
        console.log(`Adding sum ${U[idx][i] * X[i - idx - 1]}`);
        sum += U[idx][i] * X[i - idx - 1];
    }
    //
    console.log(`from (i-s)/L to (${input} - ${sum}) / ${U[idx][idx]}`);
    return (input - sum) / U[idx][idx];
}

function factorial(num, len){//basically (num)!/(num - len)!, and 0! = 1, so factorial(4, 2) would be 4*3
    if (num == 0){
        return 1;
    }
    var val = 1;
    for(var n = 0; n < len; n++){
        val *= num - n;
    }
    return val;
}

function round(num, digits){
    return Math.round(num * digits) / digits;
}

class Term{//single coefficient and power of input (i.e. 4*x^3)
    constructor(coef, power){
        this.coef = coef;
        this.power = power;
    }
    //
    calc(input){//calculate value at input
        return this.coef * Math.pow(input, this.power);
    }
}

function visibleLine(command, firstPt, secPt){
    return (inBounds(command.scaleX(firstPt[0]), 0, command.scrW)
            && inBounds(command.scaleY(firstPt[1]), 0, command.scrH))
            || (inBounds(command.scaleX(secPt[0]), 0, command.scrW)
            && inBounds(command.scaleY(secPt[1]), 0, command.scrH));
}

function inBounds(value, start, end){
    return (value > start && value < end);
}