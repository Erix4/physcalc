export default class Profile{
    constructor(command, depth, xCoefs, yCoefs){//depth is number of derivative functions, xCoefs & yCoefs are parametric position coefficients
        this.command = command;
        console.log(`--XX-- Making parametric function with x:[${xCoefs}] and y:[${yCoefs}]`);
        //console.log(arguments);
        //
        this.paras = [new Para(command.time, 1, xCoefs, yCoefs)];
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
            this.paras.push(new Para(0, 1, xCoefs, yCoefs));
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
        let dom = para.calcDomain(this.command);
        //console.log(`Domain: ${dom}`);
        //console.log(`Range from ${this.paras[power].calc(dom[0])} to ${this.paras[power].calc(dom[1])}`);
        //
        //console.log(`Origin at ${this.paras[power].calc(this.command.time)}`);
        //console.log(`X is at ${this.paras[power].xFunc.calc(this.command.time)}`);
        para.steps = steps;
        para.draw(this.command, dom[0], dom[1]);//draw the para wherever it's on screen
    }
    //
    setValues(power, x, y){
        //console.log(`Setting values at power ${power} to (${x.toFixed(2)}, ${y.toFixed(2)})`);
        //console.log(`--1. Set offset at t=${this.command.time} to (${x}, ${y})`);
        this.paras[power].setOff(this.command.time, x, y);//offset the functions at the desired power so current time returns desired values
        //console.log(`Complete, with x:[${this.paras[power].xFunc.getCoefs()}], y:[${this.paras[power].yFunc.getCoefs()}]`);
        //console.log(`Current pos: (${this.paras[0].xFunc.calc(this.command.time.toFixed(2))}, ${this.paras[0].yFunc.calc(this.command.time.toFixed(2))})`);
        //console.log(`--2. Setting power`);
        this.setPower(power, this.paras[power].xFunc.getCoefs().reverse(), this.paras[power].yFunc.getCoefs().reverse());//update components
        //console.log(`Complete, with comp 0 x:[${this.comps[power][0].xFunc.getCoefs()}], y:[${this.comps[power][0].yFunc.getCoefs()}]`);
        //console.log(`Current pos: (${this.paras[0].xFunc.calc(this.command.time.toFixed(2))}, ${this.paras[0].yFunc.calc(this.command.time.toFixed(2))})`);
        //console.log(`--3. Propagating at power ${power}`);
        this.propagate(power);//propagate new para to other powers
        //console.log(`Complete, with x:[${this.paras[0].xFunc.getCoefs()}], y:[${this.paras[0].yFunc.getCoefs()}]`);
        //console.log(`Current pos: (${this.paras[0].xFunc.calc(this.command.time.toFixed(2))}, ${this.paras[0].yFunc.calc(this.command.time.toFixed(2))})`);
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
    addComp(power, xCoefs, yCoefs){//power is descending (2, 1, 0) & length is 3
        //console.log(arguments);
        this.comps[power].push(new Para(this.command.time, 1, xCoefs, yCoefs));//push a new component to the desired power
        //console.log("New comp pushed succesfully");
        //
        var sum;
        for(var n = 0; n < xCoefs.length; n++){//for every x coefficient of the new component
            sum = 0;
            this.comps[power].forEach(comp => {//for each component at the current derivative power
                //console.log(`${comp.xFunc.terms.length} and n: ${n}`);
                if(n < comp.xFunc.terms.length){//check if coefficient exists in component
                    sum += comp.xFunc.terms[comp.xFunc.terms.length - 1 - n].coef;//sum up the current power x coefficients from the components
                }
            });
            this.paras[power].setTermX(n, sum);//set the current x coefficient of index function to sum of component coefficients
        }
        for(var n = 0; n < yCoefs.length; n++){//for every y coefficient of the new component
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
}

export class Para{
    constructor(time, steps, xCoefs, yCoefs){
        this.steps = steps;
        //
        this.color = "red";
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
    calcDomain(command){
        //console.log(`Find y roots for ${command.scaleY.domain()[0]} and ${command.scaleY.domain()[1]}`);
        var vals = this.xFunc.calcDomain(command.scaleX.domain()[0], command.scaleX.domain()[1]);//get x time domains
        //console.log(vals);
        //console.log(`Gives ${this.calc(vals[0])[0]} and ${this.calc(vals[1])[0]}`);
        this.yFunc.calcDomain(command.scaleY.domain()[0], command.scaleY.domain()[1]).forEach(val => {//get y time domains
            vals.push(val);//put them all in a list
            //console.log(val);
        });
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically
        return [vals[0], vals[vals.length - 1]];//return lowest and highest domain values
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
                console.log(yLength);
            }
            this.yFunc.terms.splice(0, 0, new Term(valy, yLength));
        }
    }
    //
    draw(command, start, end){
        var lp = this.calc(start);
        var np;
        let loop = (end- start) / this.steps;
        var t = start;
        //
        //console.log(end + " but " + loop + " from " + start);
        let ctx = command.ctx;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5; 
        //
        for(var n = 0; n < this.steps; n++){
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