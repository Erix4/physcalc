export default class Func{
    constructor(steps, ...poly){//make new equation (called a function)
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
    calcRoots(){
        switch(this.terms.length){
            case 1:
                return [];//because value is constant, there are either no roots or infinite roots
            case 2:
                return [-this.terms[1].coef / this.terms[0].coef];//simple algebra for linear function
            case 3:
                var roots = [];
                let a = this.terms[0].coef;//get quadratic coefficients
                let b = this.terms[1].coef;
                let c = this.terms[2].coef;
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
    setOff(Xoffset, Yoffset, idx){
        if(arguments.length > 2){
            this.terms[idx].Xoffset = Xoffset;
            this.Yoffset = Yoffset;
        }else{
            this.terms.forEach(term => {
                term.Xoffset = Xoffset;
            });
            this.Xoffset = Xoffset;
            this.Yoffset = Yoffset;
        }
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
                //
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

function inBounds(value, start, end){
    return (value > start && value < end);
}