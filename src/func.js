export default class Profile{
    constructor(depth, xCoefs, yCoefs){//depth is number of derivative functions, xCoefs & yCoefs are parametric position coefficients
        this.paras = [new Para(1, xCoefs, yCoefs)];
        this.comps = [[this.paras[0]]];
        for(var n = 0; n < depth; n++){//generate derivatives
            xCoefs = [];
            let xTerms = this.paras[n].xFunc.terms//get terms of x function of last parametric function
            for(var a = 0; a < xTerms.length - 1; a++){//find coefficients for derivative function
                xCoefs.push(xTerms[a].coef * xTerms[a].power);
            }
            yCoefs = [];
            let yTerms = this.paras[n].yFunc.terms
            for(var a = 0; a < yTerms.length - 1; a++){
                xCoefs.push(yTerms[a].coef * yTerms[a].power);
            }
            //
            this.paras.push(new Para(1, xCoefs, yCoefs));
            this.comps.push([para]);//add current net function as top component
        }
    }
    //
    setOff(x, y){
        //
    }
    //
    draw(command, power, steps){
        let para = this.paras[this.paras.length - power - 1];//get para by power
        let dom = para.calcDomain(command);
        //
        para.steps = steps;
        para.draw(command, dom[0], dom[1]);//draw the para wherever it's on screen
    }
    //
    setPower(power, xCoefs, yCoefs){
        if(power >= this.paras.length - 1){
            this.paras.splice(0, 0, new Para(1, xCoefs, yCoefs));
            this.comps.push([this.paras[0]]);
        }else{//flawed, doesn't factor in variable components
            let idx = this.paras.length - power - 1;
            var sum;
            for(var n = xCoefs.length - 1; n >= 0; n++){//for every x coefficient of the x net
                sum = 0;
                for(var a = 1; a < this.comps[idx].length; a++){//for each component except the first at the current derivative power
                    let comp = this.comps[idx][a];
                    if(comp.xFunc.terms.length - 1 >= n){//check if coefficient exists in component
                        sum += comp.xFunc.terms[n].coef;//sum up the current power x coefficients from the components
                    }
                }
                this.comps[idx][0].setTermX(n, xCoefs[n] - sum);//set the current x coefficient of default component to value necessary to reach net goal
            }
            for(var n = yCoefs.length - 1; n >= 0; n++){//for every y coefficient of the y net
                sum = 0;
                for(var a = 1; a < this.comps[idx].length; a++){//for each component except the first at the current derivative power
                    let comp = this.comps[idx][a];
                    if(comp.yFunc.terms.length - 1 >= n){//check if coefficient exists in component
                        sum += comp.yFunc.terms[n].coef;//sum up the current power y coefficients from the components
                    }
                }
                this.comps[idx][0].setTermY(n, yCoefs[n] - sum);//set the current y coefficient of default component to value necessary to reach net goal
            }
        }
    }
    //addComp is flawed, derivatives don't take into account offset
    addComp(power, xCoefs, yCoefs, xOff = 0, yOff = 0){//power is descending (2, 1, 0) & length is 3
        let idx = this.paras.length - power - 1;//get list index of the power (derivative depth is derivative-list-length - power - 1)
        this.comps[idx].push(new Para(1, xCoefs, yCoefs, xOff, yOff));//push a new component to the desired power
        //
        var sum;
        for(var n = xCoefs.length - 1; n >= 0; n++){//for every x coefficient of the new component
            sum = 0;
            this.comps[idx].forEach(comp => {//for each component at the current derivative power
                if(comp.xFunc.terms.length - 1 >= n){//check if coefficient exists in component
                    sum += comp.xFunc.terms[n].coef;//sum up the current power x coefficients from the components
                }
            });
            this.paras[idx].setTermX(n, sum);//set the current x coefficient of index function to sum of component coefficients
        }
        for(var n = yCoefs.length - 1; n >= 0; n++){//for every y coefficient of the new component
            sum = 0;
            this.comps[idx].forEach(comp => {//for each component at the current power
                if(comp.yFunc.terms.length - 1 >= n){//check if coefficient exists in component
                    sum += comp.yFunc.terms[n].coef;//sum up the current power y coefficients from the components
                }
            });
            this.paras[idx].setTermY(n, sum);
        }
    }
}

export class Para{
    constructor(steps, xCoefs, yCoefs, xOff = 0, yOff = 0){
        this.steps = steps;
        //
        this.xOff = xOff;
        this.yOff = yOff;
        this.color = "red";
        //
        this.xFunc = new Func(this.steps, xCoefs);
        this.yFunc = new Func(this.steps, yCoefs);
    }
    //
    calc(t){
        return [this.xFunc.calc(t) + this.xOff, this.yFunc.calc(t) + this.yOff];
    }
    //
    calcDomain(command){
        var vals = this.xFunc.calcDomain(command.scaleX.domain()[0], command.scaleX.domain()[1]);//get x time domains
        this.yFunc.calcDomain(command.scaleY.domain()[0], command.scaleY.domain()[1]).forEach(val => {//get y time domains
            vals.push(val);//put them all in a list
        });
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically
        return [vals[0], vals[vals.length - 1]];//return lowest and highest domain values
    }
    //
    setOff(x, y){
        this.xOff = x;
        this.yOff = y;
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
        console.log(`Reterming to (${valx}, ${valy})`);
        this.setTermX(power, valx);
        //
        this.setTermY(power, valy);
    }
    //
    setTermX(power, valx){//assume descending power order (2,1,0), so power 2 correspondes to term length 3
        let xLength = this.xFunc.terms.length;
        if(xLength > power){
            this.xFunc.terms[xLength - power - 1].coef = valx;
        }else{
            while(xLength < power){
                this.xFunc.terms.splice(0, 0, new Term(0, xLength));
                xLength++;
            }
            this.xFunc.terms.splice(0, 0, new Term(valx, xLength));
        }
    }
    setTermY(power, valy){
        let yLength = this.yFunc.terms.length;
        if(yLength > power){
            this.yFunc.terms[yLength - power - 1].coef = valy;
        }else{
            while(yLength < power){
                this.yFunc.terms.splice(0, 0, new Term(0, yLength));
                yLength++;
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
            if(visibleLine(command, lp, np)){
                ctx.beginPath();
                ctx.moveTo(command.scaleX(lp[0]), command.scaleY(lp[1]));
                ctx.lineTo(command.scaleX(np[0]), command.scaleY(np[1]));
                ctx.stroke();
            }
            //
            lp = np;
            t += loop;
        }
    }
}

export class Func{
    constructor(steps, poly){//make new equation (called a function)
        console.log(arguments);
        //
        this.terms = [];//defaults
        this.steps = steps;
        this.Xoffset = 0;
        this.Yoffset = 0;
        //
        this.color = "blue";
        //
        var n = poly.length - 1;
        poly.forEach(coef => {//for each coefficient listed, make a new term with decending powers (i.e. c*x^2 + c*x^1 + c*x^0)
            this.terms.push(new Term(coef, n));
            n--;
        });
        console.log(this.terms);
    }
    //
    calc(input){//calculate the value of the equation given an input
        var sum = 0;
        this.terms.forEach(term => {//find the sum of each term at the input
            sum += term.calc(input);
        });
        return sum + this.Yoffset;
    }
    //
    calcDomain(start, end){
        var vals = [];//all values where the function touches the screen boundary
        vals.push(this.calcRoots(start));//length meaning: 0=function switches directions, end values will hold other domain, 1=one side of domain, 2=holds two domain
        vals.push(this.calcRoots(end));
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically
        return [vals[0], vals[vals.length - 1]];//return lowest and highest domain values
    }
    //
    calcRoots(val = 0){//faulty, assuming term powers are in descending order: 2, 1, 0
        switch(this.terms.length){
            case 1:
                return [];//because value is constant, there are either no roots or infinite roots
            case 2:
                return [-this.terms[1].coef / this.terms[0].coef];//simple algebra for linear function
            case 3:
                var roots = [];
                let a = this.terms[0].coef;//get quadratic coefficients
                let b = this.terms[1].coef;
                let c = this.terms[2].coef - val;
                let disc = Math.pow(b, 2) - (4 * a * c);//calculate discriminant
                for(var n = 0; n < 2; n++){
                    if(a == 0 || disc < 0){//break out if dividing by 0 or sqrting a negative number
                        continue;
                    }
                    //
                    console.log(`${disc} from (${a}, ${b}, ${c})`);
                    roots.push((-b + (Math.pow(-1, n)) * Math.sqrt(disc)) / 2 * a);
                }
                return roots;
            default:
                console.log("I can't do that yet!");
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
    setOff(Xoffset, Yoffset){//TODO: make this function change the constant value (last term) by magic
        console.log(`Setting to offset (${Xoffset}, ${Yoffset})`);
        var sum = 0;
        var pascal = [1,1];//pascal's triangle!
        for(var n = this.terms.length - 2; n >= 0; n--){//for each term starting with second to last (lowest coefficient is constant, x offset won't affect it and it screws up my pascal)
            let l = this.terms[n].power;
            //
            console.log(this.terms);
            let coefs = [];
            this.terms.forEach(term => {
                coefs.push(term.coef);
            })
            //this.terms[n].coef = 0;
            console.log(coefs);
            console.log(`Starting with term ${l}, expanding to ${pascal}`);
            for(var a = 0; a <= l; a++){//for every term of power less than or equal to current 
                console.log(`Changing term ${l - a} to ${coefs[n] * pascal[a] * Math.pow(-Xoffset, a)} from ${coefs[n]}*${pascal[a]}*${Math.pow(-Xoffset, a)}`);
                this.terms[n + a].coef += (coefs[n] * pascal[a] * Math.pow(-Xoffset, a));
                console.log(this.terms[n + a]);
                console.log(this.terms);
            }
            console.log(this.terms);
            //
            let tempPasc = [1,1];
            for(var a = 0; a < l; a++){//generate next layer in pascal's triangle
                console.log(pascal[a] + ", " + pascal[a + 1] + " => " + (pascal[a] + pascal[a + 1]));
                tempPasc.splice(a + 1, 0, pascal[a] + pascal[a + 1]);//adjust term based on polynomial generated from application of x offset
                //tempPasc[a] = pascal[a] + pascal[a + 1];
                console.log(tempPasc);
            }
            pascal = tempPasc.splice();
        }
        //
        this.terms[this.terms.length - 1].coef += Yoffset; 
    }
    //
    setColor(color){
        this.color = color;
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
    constructor(coef, power, Xoffset = 0){
        this.coef = coef;
        this.power = power;
        this.Xoffset = Xoffset;
    }
    //
    calc(input){//calculate value at input
        return this.coef * Math.pow((input - this.Xoffset), this.power);
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