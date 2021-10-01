export default class Func{
    constructor(step, ...poly){//make new equation (called a function)
        //
        this.terms = [];//defaults
        this.step = step;
        this.Xoffest = 0;
        this.Yoffset = 0;
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
        this.terms.forEach(term => {//find the sum of each term at the input
            sum += term.calc(input);
        });
        return sum;
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
            this.terms[idx].Xoffest = Xoffset;
            this.terms[idx].Yoffset = Yoffset;
        }else{
            this.terms.forEach(term => {
                term.Xoffest = Xoffset;
                term.Yoffest = Yoffset;
                console.log(term.Yoffest);
            });
        }
    }
    //
    setColor(color){
        this.color = color;
    }
    //
    draw(field, ctx, start, end){//draw the function over a certain space
        var lastX = start;
        var lastV = this.calc(start);
        var nextX;
        var nextV;
        let loop = (end - start) / this.step;
        //
        console.log(end + " but " + loop + " from " + start);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        //
        for(var n = 0; n < loop; n++){
            nextX = lastX + this.step;
            nextV = this.calc(nextX);
            //
            //console.log(nextX);
            //
            if(inBounds(field.scaleY(lastV), 0, field.scrH) || inBounds(field.scaleY(nextV), 0, field.scrH)){
                //
                //console.log(`Start at (${field.scale(lastX)}, ${field.scrH - field.scale(lastV)})`);
                //
                ctx.beginPath();
                ctx.moveTo(field.scaleX(lastX), field.scaleY(lastV));
                ctx.lineTo(field.scaleX(nextX), field.scaleY(nextV));
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
    constructor(coef, power, Xoffset = 0, Yoffset = 0){
        this.coef = coef;
        this.power = power;
        this.Xoffest = Xoffset;
        this.Yoffset = Yoffset;
    }
    //
    calc(input){//calculate value at input
        return this.coef * Math.pow((input - this.Xoffest), this.power) + this.Yoffset;
    }
}

function inBounds(value, start, end){
    return (value > start && value < end);
}