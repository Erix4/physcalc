/**
 * The piece and profile classes should have an adaptive depth which changes depending on the length of terms
 *      - for terms without converging derivatives, set depth to convergence of convergin terms
 */

export default class Profile{
    constructor(command, depth, xCoefs, yCoefs, color){
        this.command = command;
        this.color = color;
        this.depth = depth;
        //
        this.pieces = [new Piece(command, xCoefs, yCoefs, color)];//list of pieces in piecewise equation
        //
        this.bounds = [[-Infinity, Infinity]];//list of bounds for each piece
        //console.log(this.bounds);
        this.junctions = [];//list of junctions between each piece (always one less than the number of peices), 0 = continous, 1 = discontinuous, 2 = incomplete
    }
    //
    newSplitPiece(pieceIdx){
        if(!pieceIdx && pieceIdx != 0){
            pieceIdx = this.getValIdx(this.command.time);
        }
        //
        console.log(`copying index ${pieceIdx}`);
        let curPara = this.pieces[pieceIdx].paras[0];
        this.newPiece(curPara.xFunc.getCoefs(), curPara.yFunc.getCoefs(), this.command.time, 0);
        console.log(this.bounds);
        console.log(this.pieces);
    }
    //
    /**
     * Push a new piece to the profile
     * @param {Array<Number>} xCoefs x coefficients of lowest power of piece
     * @param {Array<Number>} yCoefs y coefficients of lowest power of piece
     * @param {Number}        time   time at which piece is added
     * @param {Number}        j     junction type (0ctn, 1com, 2inc) at time
     */
    newPiece(xCoefs, yCoefs, time, j){
        let curIdx = this.getCurIdx(time);
        //console.log(`curIdx: ${curIdx}`);
        console.log(`x coefs:`);
        console.log(xCoefs);
        //
        if(curIdx == -1){//if there is no piece at the current time
            let nextIdx = this.getRightIdx(time);
            if(nextIdx == -1){//if time is after every piece
                if(this.pieces.length == 0){//if there are no other pieces
                    this.bounds.push([-Infinity, Infinity]);
                }else{//if there are other pieces (before the current)
                    this.bounds.push([this.bounds[this.bounds.length - 1][1], Infinity]);//add a new bound
                }
                this.pieces.push(new Piece(this.command, xCoefs, yCoefs, this.color));
                this.junctions[this.junctions.length - 1] = j;
                this.junctions.push(j);
            }else{
                if(nextIdx == 0){//if time is before every piece
                    this.bounds.push([-Infinity, this.bounds[nextIdx][0]]);//set new bound from -Infinity to the start of the next piece
                }else{
                    this.bounds.push([this.bounds[nextIdx - 1][1], this.bounds[nextIdx][0]]);//set new bound from the end of the previous piece to the start of the next piece
                }
                this.pieces.splice(nextIdx, 0, new Piece(this.command, xCoefs, yCoefs, this.color));
                this.junctions.splice(nextIdx, 0, j);
            }
        }else{
            console.log(`spliting in ${curIdx}`);
            this.pieces.splice(curIdx + 1, 0, new Piece(this.command, xCoefs, yCoefs, this.color));//add a new piece after the current piece
            //
            let curEnd = this.bounds[curIdx][1];//find the end of the current piece
            this.bounds[curIdx][1] = time;//set the current piece to end at the current time
            this.bounds.splice(curIdx + 1, 0, [time, curEnd]);//a a new bound starting at the current time and ending at the next time
            //
            this.junctions.splice(curIdx, 0, j);//add a new junction at the current time
            //
            let endPos = this.pieces[curIdx].calc(0, time);
            //this.pieces[curIdx + 1].setOrigin(time, 0);//set the new piece to the current value at the current time
            //this.pieces[curIdx + 1].setValTime(0, time, endPos[0], endPos[1], false);//set the new piece to the current value at the current time
            console.log(this.pieces[curIdx+1].paras[0].xFunc.getCoefs());
        }
        //
        //console.log(`new piece:`);
        //console.log(this.pieces[1]);
    }
    //
    /**
     * Set the bounds of a given piece and compress or expand neighbors
     * @param {Number} idx index of piece to set bounds
     * @param {Number} t1  time of start
     * @param {Number} t2  time of end
     */
    reLeftBoundPiece(idx, t1){//rebounding does not affect (but is affected by) the piece or the junction type
        if(idx != 0){//if not the first piece
            if(t1 < this.bounds[idx][0]){//if the new piece starts before the current piece (push)
                let stIdx = this.getCurIdx(t1);//get the index of the piece that contains the new time
                let compressIdx = this.getRightIdx(t1);//get the index of the piece directly to the right or containing the new time
                //
                if(stIdx != -1){//new bound ends in an existing piece
                    this.bounds[stIdx][1] = t1;//rebound the leftmost piece
                }
                for(var n = compressIdx + 1; n < idx; n++){//compress every piece between the leftmost and the current piece
                    this.bounds[n] = [t1, t1];
                }
            }else if(this.junctions[idx - 1] != 2){//if the new piece starts after the current piece and the left juction is complete (pull)
                this.bounds[idx - 1][1] = t1;//rebound the left neighbor to end at the current start
            }
        }
        this.bounds[idx][0] = t1;//rebound the current piece to start at the new start
        //
        if(this.command.time < t1){
            this.command.time = t1;
        }
        //console.log(`setting values to:`);
        //console.log(this.calc(0, t1, 1));
        this.setOrigin(t1, idx);
        this.setValTime(0, t1, ...this.calc(0, t1, idx));
    }
    //
    reRightBoundPiece(idx, t2){//rebounding does not affect (but is affected by) the piece or the junction type
        //
        console.log(`index given: ${idx}, bounds length: ${this.bounds.length}`);
        if(idx != this.bounds.length - 1){//if not the last piece
            console.log(`is ${t2} > ${this.bounds[idx][1]}`);
            if(t2 > this.bounds[idx][1]){//if the new piece ends after the current piece (push)
                let endIdx = this.getCurIdx(t2);//get the index of the piece that contains the new time
                let compressIdx = this.getLeftIdx(t2);//get the index of the piece directly to the left or containing the new time
                console.log(`compress index: ${compressIdx}`);
                //
                if(endIdx != -1){//new bound ends in an existing piece
                    this.bounds[endIdx][0] = t2;//rebound the rightmost piece
                }
                for(var n = compressIdx - 1; n > idx; n--){//compress every piece between the rightmost and the current piece
                    this.bounds[n] = [t2, t2];
                }
            }else if(this.junctions[idx] != 2){//if the new piece starts after the current piece and the right juction is complete (pull)
                console.log(`pulling piece ${idx + 1} to ${t2}`);
                this.bounds[idx+1][0] = t2;//rebound the right neighbor to end at the current start
            }
        }else{
            console.log(`the last piece?`);
        }
        this.bounds[idx][1] = t2;//rebound the current piece to end at the new end
        //
        if(this.command.time >= t2){
            this.command.time = t2 - .1;
        }
        //START HERE--------------------------BOZO------------------
        console.log(`setting origin in index ${idx} to ${this.bounds[idx][0]}`);
        if(isFinite(this.bounds[idx][0])){//if piece has a left bound
            this.setOrigin(this.bounds[idx][0], idx);//set origin to realign values
            this.setValTime(0, this.bounds[idx][0], ...this.calc(0, this.bounds[idx][0], idx));
        }else{
            this.setOrigin(this.bounds[idx][1]-.1, idx);//set origin slightly to the left of the right bound
            this.setValTime(0, this.bounds[idx][1]-.1, ...this.calc(0, this.bounds[idx][1]-.1, idx));
        }
    }
    //
    reorderPeice(idx, newIdx){//this will be very complicated
        this.pieces.splice(newIdx, 0, this.pieces.splice(idx, 1)[0]);
        this.bounds.splice(newIdx, 0, this.bounds.splice(idx, 1)[0]);
        //new junction here
    }
    //
    /**
     * draw the profile at a given power in a given resolution, only what's visible
     * @param {Number} power the power of the function to draw
     * @param {Number} steps the number of steps (or resolution) of the illustration
     */
    draw(power, steps){
        let mode = this.command.viewType;
        //console.log(`drawing`);
        let divy = steps / this.pieces.length;//number of steps for each piece
        //
        if(mode == 0){
            this.pieces.forEach((piece, idx) => {
                var doms = this.calcDomain(idx, power);//domains for this piece
                var divier = divy / doms.length;//number of steps for each domain in the piece
                //
                doms.forEach(dom => {//for every domain
                    piece.paras[power].draw(this.command, dom[0], dom[1], divier);//draw the given power for this piece at this domain
                });
            });
        }else{
            this.pieces.forEach((piece, idx) => {
                let reFunc = mode == 1 ? piece.paras[power].xFunc : piece.paras[power].yFunc;//the function to draw
                //
                var doms = this.calcDomain(idx, power, mode);//domains for this piece
                if(doms.length == 0){//if there are no domains
                    //reFunc.steps = 1;
                    //reFunc.draw(this.command, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1]);//draw the given power for this piece at this domain
                }
                var divier = divy / doms.length;//number of steps for each domain in the piece
                //
                doms.forEach(dom => {//for every domain
                    reFunc.steps = divier;
                    console.log(reFunc);
                    reFunc.draw(this.command, dom[0], dom[1]);//draw the given power for this piece at this domain
                });
            });
        }
    }
    //
    /**
     * Find the domain (time periods on screen) of a given piece
     * @param {Number} pIdx    index of piece
     * @param {Number} [power] power of function (0 by default)
     * @returns {Array<Number>} domain of piece
     */
    calcDomain(pIdx, power = 0, mode = 0){
        let doms;
        switch(mode){
            case 0:
                doms = this.pieces[pIdx].calcDomain(power);
                break;
            case 1:
                doms = this.pieces[pIdx].calcCompDomain(true, power);
                break;
            case 2:
                doms = this.pieces[pIdx].calcCompDomain(false, power);
                break;
        }
        //
        while(doms.length > 0 && doms[0][1] < this.bounds[pIdx][0]){//while right domain is less than left bound of piece
            doms.splice(0, 1);//remove this domain
        }
        if(doms.length == 0){//no visible domains for this piece
            return [];
        }
        if(doms[0][0] < this.bounds[pIdx][0]){//if left domain is less than the left bound
            doms[0][0] = this.bounds[pIdx][0];//set the left domain to the left bound
        }
        //
        while(doms.length > 0 && doms[doms.length - 1][0] > this.bounds[pIdx][1]){//while left domain is more than right bound of piece
            doms.pop();//remove this domain
        }
        if(doms.length == 0){//no visible domains for this piece
            return [];
        }
        if(doms[doms.length - 1][1] > this.bounds[pIdx][1]){//if right domain is more than the right bound
            doms[doms.length - 1][1] = this.bounds[pIdx][1];//set the right domain to the right bound
        }
        //
        //console.log(doms);
        return doms;
    }
    //
    setAllComps(comps, pIdx){
        //
    }
    //
    /**
     * add a component at a given power to one or all pieces
     * @param {Number} power  power to add the comp to
     * @param {Number} xCoefs x coefficients of the comp
     * @param {Number} yCoefs y coefficients of the comp
     * @param {Number} [pIdx] index of piece to add comp to, all pieces by default
     */
    addComp(power, xCoefs, yCoefs, pIdx){
        if(pIdx || pIdx == 0){
            this.pieces[pIdx].addComp(power, xCoefs, yCoefs);
        }else{
            this.pieces.forEach(piece => {
                piece.addComp(power, xCoefs, yCoefs);
            });
        }
    }
    //
    /**
     * Set the values at the given time and power
     * @param {Number} power         depth of the value to set
     * @param {Number} t             time  at which to set the value
     * @param {Number} x             x value to set
     * @param {Number} y             y value to set
     * @param {Number} [alignPower]  power to align the values to (default 0, position)
     * @param {Boolean} [propogator] whether to propagate the set values to other depths
     */
    setValTime(power, t, x, y, propagator = true, alignPower = 0){
        console.log(`setting values`);
        let curIdx = this.getLeftIdx(t);
        if(curIdx == -1){//time is left of every piece
            curIdx = 0;//set calc index to the last one
            t = this.bounds[0][0];//set time to the left bound
        }
        //
        //console.log(`setting index ${curIdx} at power ${power} at time ${t} to ${x}, ${y}`);
        //
        this.setPieceValTime(power, t, curIdx, x, y, propagator);
        var leftX = this.calc(alignPower, this.bounds[curIdx][0], curIdx)[0];
        var leftY = this.calc(alignPower, this.bounds[curIdx][0], curIdx)[1];
        for(var i = curIdx - 1; i >= 0 && this.junctions[i] == 0; i--){//pieces are to the left and the left juction is continous
            this.setOrigin(this.bounds[i][1], i);
            this.setPieceValTime(alignPower, this.bounds[i][1], i, leftX, leftY, false);//only propagate position
            leftX = this.calc(alignPower, this.bounds[i][0], i)[0];
            leftY = this.calc(alignPower, this.bounds[i][0], i)[1];
        }
        //
        leftX = this.calc(alignPower, this.bounds[curIdx][1], curIdx)[0];//sort this out
        leftY = this.calc(alignPower, this.bounds[curIdx][1], curIdx)[1];
        for(var i = curIdx + 1; i < this.pieces.length && this.junctions[i-1] == 0; i++){//pieces are to the left and the left juction is continous
            this.setOrigin(this.bounds[i][0], i);
            this.setPieceValTime(alignPower, this.bounds[i][0], i, leftX, leftY, false);//only propagate position
            leftX = this.calc(alignPower, this.bounds[i][1], i)[0];
            leftY = this.calc(alignPower, this.bounds[i][1], i)[1];
        }
        //
        //console.log(this.pieces[curIdx]);
        //
        let curPiece = this.pieces[curIdx];
        let curOrigin = curPiece.paras[power].xFunc.origin;//origin should be the same for x and y functions
        //
        //this loop sets moves each function so that they intersect with the given point given a point in time
        /**this.pieces.forEach(piece => {
            piece.setOrigin(curOrigin, power);//set origin to the origin of the current piece
            piece.setValTime(power, t, x, y, propagator);//set the value at the given time to the offset
        });**/
    }
    //
    /**
     * Set the values at the given time and power
     * @param {Number} power         depth of the value to set
     * @param {Number} t             time  at which to set the value
     * @param {Number} pIdx          the index of the piece to set the value at
     * @param {Number} x             x value to set
     * @param {Number} y             y value to set
     * @param {Boolean} [propogator] whether to propagate the set values to other depths
     */
    setPieceValTime(power, t, pIdx, x, y, propagator=true){
        this.pieces[pIdx].setValTime(power, t, x, y, propagator);
    }
    //
    /**
     * Set values at the current time and given power
     * @param {Number} power       depth of the values to set
     * @param {Number} x           x values to set
     * @param {Number} y           y values to set
     * @param {Boolean} propagator whether to propagate the new function to the rest of the depths
     */
    setValues(power, x, y, propagator = true){
        this.setValTime(power, this.command.time, x, y, propagator);
    }
    //
    /**
     * find the extreme values of the profile
     * @returns {Array<Number>} all extremes of the piecewise function
     */
    getExtremes(){
        let extrs = [];
        //
        this.pieces.forEach((piece, idx) => {
            extrs.push(...piece.getExtremes().filter(extr => {//get extremes for the piece
                if(this.bounds[idx][0] < extr && extr < this.bounds[idx][1]){//only get extremes that are within the bounds of the piece
                    return true;
                }
            }));
            this.bounds[idx].forEach((bound, i) => {
                if(Math.abs(bound) != Infinity && !extrs.includes(bound)){//only push piece bound if it exists (function doesn't go to infinity)
                    if(i == 1){
                        bound -= .001;
                    }
                    extrs.push(bound);
                }
            });
        });
        //
        return extrs;
    }
    //
    /**
     * set the shifting origin of one or all powers to a given time in one or all pieces
     * @param {Number} time    time to set the origin to
     * @param {Number} [pIdx] the piece to set the origin of
     * @param {Number} [power] the power of which to set the origins
     */
    setOrigin(time, pIdx, power){
        if(pIdx || pIdx == 0){
            this.pieces[pIdx].setOrigin(time, power);
        }else{
            this.pieces.forEach(piece => {//set the origin at the given power for every piece
                piece.setOrigin(time, power);
            }); 
        }
    }
    //
    /**
     * get the piece which the given time is in, if any
     * @param {Number} time the time to check
     * @returns {Number} the index of the piece, or -1 if the time is not in any piece
     */
    getCurIdx(time){
        let idx = 0;
        for(var bound of this.bounds){
            if(time >= bound[0] && time < bound[1]){
                return idx;
            }
            idx++;
        }
        return -1;//there is no piece for the current time
    }
    //
    //the following function is useful for inferring bounds for new pieces
    /**
     * get the piece which is to the right of or contains the current time
     * @param {Number} time the time to check
     * @returns the index of the piece, or -1 if the time is to the right of every piece
     */
    getRightIdx(time){
        if(time > this.bounds[this.bounds.length - 1][1]){//if time is after the last piece
            return -1;
        }
        for(var n = this.bounds.length - 1; n >= 0; n--){
            if(time > this.bounds[n][1]){//if time is before left bound
                return n + 1;
            }
        }
        return 0;//the current time is before every piece
    }
    //
    //the following function is useful for calculating values
    /**
     * get the piece which is to the left of or contains the current time
     * @param {Number} time the time to check
     * @returns the index of the piece, or -1 if the time is to the left of every piece
     */
    getLeftIdx(time){
        for(var n = 1; n < this.bounds.length; n++){
            if(time < this.bounds[n][0]){//if time is before left bound
                return n-1;
            }
        }
        return this.bounds.length - 1;//the current time is after every piece
    }
    //
    /**
     * return piece of the profile at the given time, accounting for incomplete pieces
     * @param {Number} time the time to check
     * @returns {Number} the index of the piece at the given time
     */
    getValIdx(time){
        let leftIdx = this.getLeftIdx(time);
        if(leftIdx == -1){
            return 0;
        }
        return leftIdx;
    }
    //
    checkCompMatch(power, idx, pIdx){
        return this.pieces[pIdx].paras[power].xFunc.getCoefs() == this.pieces[pIdx].comps[power][idx].xFunc.getCoefs() &&
                this.pieces[pIdx].paras[power].yFunc.getCoefs() == this.pieces[pIdx].comps[power][idx].yFunc.getCoefs();
    }
    //
    /**
     * calculate the x and y values at the given time and power
     * @param {Number} power  the power at which to calculate
     * @param {Number} time   the time at which to calculate
     * @param {Number} [pIdx] index of piece
     * @returns the calculated values at the given time and power in the appropriate piece
     */
    calc(power, time, pIdx){
        let curIdx;
        if(pIdx || pIdx == 0){//if piece is specified
            curIdx = pIdx;
        }else{
            curIdx = this.getCurIdx(time);
        }
        if(curIdx == -1){//time is not directly in a piece
            let leftIdx = this.getLeftIdx(time);
            if(leftIdx == -1){//time is left of every piece
                curIdx = 0;
                time = this.bounds[0][0];//return the value at the left bound
            }else{
                curIdx = leftIdx;
                time = this.bounds[leftIdx][1];//return the value at the right bound of the left applicable piece
            }
        }
        //console.log(`calc in ${curIdx}`);
        if(power >= this.pieces[curIdx].paras.length){
            return [0, 0];
        }else{
            return this.pieces[curIdx].paras[power].calc(time);//return the value of the applicable piece
        }
    }
    //
    /**
     * calculate the values of a component of the function at a given time (assumes the component exists for this piece)
     * @param {Number} power power at which to calculate
     * @param {Number} time  time to calculate at
     * @param {Number} idx   index of the component
     * @param {Number} [pIdx] index of piece
     * @returns the calculated number
     */
    calcComp(power, time, idx, pIdx){
        let curIdx;
        if(pIdx || pIdx == 0){//if no piece is specified
            curIdx = pIdx;
        }else{
            curIdx = this.getCurIdx(time);
            if(curIdx == -1){//time is not directly in a piece
                let leftIdx = this.getLeftIdx(t);
                if(leftIdx == -1){//time is left of every piece
                    return this.pieces[leftIdx].comps[power][idx].calc(this.bounds[0][0]);//return the value at the left bound
                }else{
                    return this.pieces[leftIdx].comps[power][idx].calc(this.bounds[leftIdx][1]);//return the value at the right bound of the left applicable piece
                }
            }
        }
        //
        return this.pieces[curIdx].comps[power][idx].calc(time);//return the value of the applicable piece
    }
}

export class Piece{
    constructor(command, xCoefs, yCoefs, color){//depth is number of derivative functions, xCoefs & yCoefs are parametric position coefficients
        this.command = command;
        //
        this.color = color;
        //
        console.log(`new peice with x coefs: `);
        console.log(xCoefs);
        this.paras = [new Para(command.time, 500, xCoefs, yCoefs, this.color)];
        this.comps = [[new Para(command.time, 500, xCoefs, yCoefs)]];
        while(this.paras[this.paras.length-1].xFunc.terms.length > 1 || this.paras[this.paras.length-1].yFunc.terms.length > 1){//while there are more derivatives
            this.newDerivatives();//generate new derivatives
        }//basically, keep making new derivatives until the base functions are constants
    }
    //
    newDerivatives(){
        var xCoefs = [];
        let xTerms = this.paras[this.paras.length - 1].xFunc.terms;//get terms of x function of last parametric function
        for(var a = 0; a < xTerms.length - 1; a++){//find coefficients for derivative function (but not for last)
            xCoefs.push(xTerms[a].coef * xTerms[a].power);
        }
        var yCoefs = [];
        let yTerms = this.paras[this.paras.length - 1].yFunc.terms;
        for(var a = 0; a < yTerms.length - 1; a++){
            yCoefs.push(yTerms[a].coef * yTerms[a].power);
        }
        //
        if(xCoefs.length == 0){
            xCoefs.push(0);
        }
        if(yCoefs.length == 0){
            yCoefs.push(0);
        }
        this.paras.push(new Para(0, 300, xCoefs, yCoefs, this.color));
        this.comps.push([new Para(0, 300, xCoefs, yCoefs)]);//add current net function as top component
    }
    //
    draw(power, steps){
        let para = this.paras[power];//get para by power
        let dom = this.calcDomain(power);
        //
        dom.forEach(domain => {
            para.draw(this.command, domain[0], domain[1], steps / dom.length);//draw the para wherever it's on screen
        });
    }
    //
    calcDomain(power = 0){
        var vals = [];
        let xCrosses = 0;
        this.paras[power].xFunc.calcDomain(this.command.scaleX.domain()[0], this.command.scaleX.domain()[1], true).forEach(val =>{
            vals.push([val, 0]);
            xCrosses++;
        });
        let yCrosses = 0;
        this.paras[power].yFunc.calcDomain(this.command.scaleY.domain()[0], this.command.scaleY.domain()[1], true).forEach(val => {//get y time domains
            vals.push([val, 1]);//put them all in a list
            yCrosses++;
        });
        //
        if(xCrosses == 0){//no place where x crosses the visible boundary
            if(this.paras[power].xFunc.terms.length == 1 && inBounds(this.paras[power].xFunc.terms[0].coef, this.command.scaleX.domain()[0], this.command.scaleX.domain()[1])){
                vals.forEach(val => {
                    vals.push([val[0], 0]);
                });
            }else{
                return [];
            }
        }
        if(yCrosses == 0){
            if(this.paras[power].yFunc.terms.length == 1 && inBounds(this.paras[power].yFunc.terms[0].coef, this.command.scaleY.domain()[0], this.command.scaleY.domain()[1])){
                vals.forEach(val => {
                    vals.push([val[0], 1]);
                });
            }else{
                return [];
            }
        }
        //
        vals.sort((a,b)=>a[0]-b[0]);//sort domain values numerically by first element
        //
        var ranges = [];
        var x = false;
        var y = false;
        var visible = false;
        if(this.paras.length > power + 1){//if there are more derivatives
            vals.forEach(val => {
                if(val[1] == 0){//x domain
                    if(this.paras[power + 1].xFunc.calc(val[0]) == 0 && xCrosses != 0){//discard value if derivative is 0
                        return;
                    }
                    x = !x;
                }else{//y domain
                    if(this.paras[power + 1].yFunc.calc(val[0]) == 0 && yCrosses != 0){//discard value if derivative is 0
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
        }else{//no derivative available
            vals.forEach(val => {
                if(val[1] == 0){
                    x = !x;
                }else{
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
        }
        //
        return ranges.slice();//return ranges where function is visible
    }
    //
    /**
     * get domain for x and y components of para
     * @param {Boolean} xComp   whether checking the x component
     * @param {Number} power    the power to get the domain for
     * @returns {Array<Number>} return all ranges where component is visible
     */
    calcCompDomain(xComp, power = 0){
        var vals = [];
        let crosses = 0;
        let reFunc = xComp ? this.paras[power].xFunc : this.paras[power].yFunc;
        //
        reFunc.calcDomain(this.command.scaleY.domain()[0], this.command.scaleY.domain()[1], true).forEach(val =>{
            vals.push(val);
            crosses++;
        });
        //
        if(crosses == 0){//no place where x crosses the visible boundary
            if(reFunc.terms.length == 1 && inBounds(reFunc.terms[0].coef, this.command.scaleY.domain()[0], this.command.scaleY.domain()[1])){
                vals.push(this.command.scaleX.domain()[0]);
                vals.push(this.command.scaleX.domain()[1]);
            }else{
                return [];
            }
        }
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically by first element
        //
        var visible = false;
        var ranges = [];
        if(this.paras.length > power + 1){//if there are more derivatives
            let uRefunc = xComp ? this.paras[power + 1].xFunc : this.paras[power + 1].yFunc;
            //
            vals.forEach(val => {
                if(uRefunc.calc(val) == 0 && crosses != 0){//discard value if derivative is 0
                    return;
                }
                if(!visible){
                    ranges.push([val]);
                }else{
                    ranges[ranges.length - 1].push(val);
                }
                visible = !visible;
            });
        }else{//no derivative available
            vals.forEach(val => {
                if(!visible){
                    ranges.push([val]);
                }else{
                    ranges[ranges.length - 1].push(val);
                }
                visible = !visible;
            });
        }
        if(ranges.length == 0){
            return [];
        }
        //
        var newRanges = ranges.slice();
        for(var i = 0; i < ranges.length && ranges[i][1] < this.command.scaleX.domain()[0]; i++){
            newRanges.splice(0, 1);
        }
        if(newRanges[0][0] < this.command.scaleX.domain()[0]){
            newRanges[0][0] = this.command.scaleX.domain()[0];
        }
        //
        for(var i = ranges.length - 1; i >= 0 && ranges[i][0] > this.command.scaleX.domain()[1]; i--){
            newRanges.pop();
        }
        if(newRanges[newRanges.length - 1][1] > this.command.scaleX.domain()[1]){
            newRanges[newRanges.length - 1][1] = this.command.scaleX.domain()[1];
        }
        //
        return newRanges.slice();//return ranges where function is visible
    }
    //
    setAllComps(comps){//format: level>list>xy>terms
        this.comps = [];//delete all
        comps.forEach((level, power) => {
            let levelComps = [];
            var xMax = 0;
            var yMax = 0;
            level.forEach(comp => {
                levelComps.push(new Para(0, 1, comp[0].map(Number), comp[1].map(Number)));
                //console.log(comp[0].map(Number));
                if(comp[0].length > xMax){
                    xMax = comp[0].length;
                }
                if(comp[1].length > yMax){
                yMax = comp[1].length;
                }
            });
            //
            this.comps.push(levelComps);
            //
            this.sumComps(power, xMax, yMax, false);
            this.setValues(power, this.paras[power].calc(this.command.time)[0], this.paras[power].calc(this.command.time)[1], false);
        });
    }
    //
    fullSet(x, y){
        //console.log("Full set");
        for(var n = this.paras.length - 1; n >= 0; n--){
            this.setValues(n, x, y)
        }
    }
    //
    setValTime(power, t, x, y, propogator = true){
        while(power >= this.paras.length){
            console.log(`New derivatives, set to ${x}, ${y}`);
            this.newDerivatives();
        }
        //console.log(`setting this piece at power ${power} to ${x}, ${y} at t = ${t}`);
        this.paras[power].setOff(t, x, y);
        //console.log(this.paras[0].xFunc.getCoefs());
        this.setPower(power, this.paras[power].xFunc.getCoefs().reverse(), this.paras[power].yFunc.getCoefs().reverse());
        //console.log(this.paras[0].xFunc.getCoefs());
        if(propogator){
            this.propagate(power);
        }
        //console.log(this.paras[0].xFunc.getCoefs());
    }
    //
    setValues(power, x, y, propogator = true){//set value at current time
        this.setValTime(power, this.command.time, x, y, propogator);
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
            //
            while(xCoefs.length < this.paras[power].xFunc.terms.length){//if there are fewer coefficients given then already exist:
                xCoefs.push(0);//set every higher coefficient to 0
            }
            //
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
            //
            while(yCoefs.length < this.paras[power].yFunc.terms.length){//if there are fewer coefficients given then already exist:
                yCoefs.push(0);//set every higher coefficient to 0
            }
            //
            for(var n = yCoefs.length - 1; n >= 0; n--){//for every y coefficient of the y net
                sum = 0;
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
        switch(this.command.viewType){
            case 0:
                this.paras.forEach(para => {
                    exts.push(...para.xFunc.calcRoots());
                    exts.push(...para.yFunc.calcRoots());
                });
                break;
            case 1:
                this.paras.forEach(para => {
                    exts.push(...para.xFunc.calcRoots());
                });
                exts.push(0);
                break;
            case 2:
                this.paras.forEach(para => {
                    exts.push(...para.yFunc.calcRoots());
                });
                exts.push(0);
                break;
        }
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
        if(power || power == 0){//if power is specified
            this.paras[power].setOrigin(time);
        }else{
            this.paras.forEach(para => {
                para.setOrigin(time);
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
    sumComps(power, xL, yL, propogator = true){
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
        if(propogator){
            this.propagate(power);
        }
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
        this.color = color;
        //
        this.xFunc = (new Func(this.steps, xCoefs));
        this.yFunc = (new Func(this.steps, yCoefs));
        this.xFunc.color = color;
        this.yFunc.color = color;
    }
    //
    calc(t){
        return [this.xFunc.calc(t), this.yFunc.calc(t)];
    }
    //
    reset(){
        this.xFunc.terms = [];
        this.yFunc.terms = [];
    }
    //
    setOrigin(t){
        this.xFunc.origin = t;
        this.yFunc.origin = t;
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
    calcDomain(start, end, getAll=false){
        var vals = [];//all values where the function touches the screen boundary
        vals.push(...this.calcRoots(start));//length meaning: 0=function switches directions, end values will hold other domain, 1=one side of domain, 2=holds two domain
        vals.push(...this.calcRoots(end));
        //
        vals.sort((a,b)=>a-b);//sort domain values numerically
        if(getAll){
            return vals;
        }
        if(vals.length > 1){
            return [vals[0], vals[vals.length - 1]];//return lowest and highest domain values
        }else{
            return vals;
        }
    }
    //
    removeArbs(){
        while(this.terms.length > 1 && this.terms[0].coef == 0){
            this.terms.splice(0, 1);
        }
    }
    //
    calcRoots(val = 0){//faulty, assuming term powers are in descending order: 2, 1, 0
        this.removeArbs();
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
                let shiftEq = this.getCoefs();
                shiftEq[shiftEq.length - 1] -= val;//shift equation to desired value
                return findRealRoots(shiftEq);
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
            //
            for(var a = 0; a <= l; a++){//for every term of power less than or equal to current 
                this.terms[n + a].coef += (coefs[n] * pascal[a] * Math.pow(-Xoffset, a));
            }
            //
            let tempPasc = [1,1];
            for(var a = 0; a < l; a++){//generate next layer in pascal's triangle
                tempPasc.splice(a + 1, 0, pascal[a] + pascal[a + 1]);//adjust term based on polynomial generated from application of x offset
            }
            pascal = [...tempPasc];
        }
        //
        this.terms[this.terms.length - 1].coef += Yoffset;// - this.calc(Xoffset);
        this.origin = orxo;
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
            //console.log("APPROX FAILED.");
        }
        //console.log(X);
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
        //console.log(tlen);
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
        //console.log(orderedInputs.slice());
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
                //console.log(`Pushed ${row[row.length - 1]} from ${genDerMults(len, input[1], i)} * ${Math.pow(input[2], len - input[1] - i)}`);
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
        //console.log("Initial matrix A:");
        //console.log(A.slice());
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
                //console.log(`Multiplier: ${mult}, j: ${j}`);
                if(j < len && i < len){
                    var c = 0
                    //console.log(`Check bc ${U[i][j + 1]} == ${(mult * U[j][j + 1])}, ${mult} * ${U[j][j + 1]}`);
                    //console.log(`\tBut next  = ${U[i + 1][j + 1]}`);
                    while(U[i][j + 1] == (mult * U[j][j + 1]) && c < len && U[i + 1][j + 1] != 0){
                        //console.log(`RO bc ${U[i][j + 1]} == ${(mult * U[j][j + 1])}, ${mult} * ${U[j][j + 1]}`);
                        //console.log(`Evaluates ${U[i][j + 1] == (mult * U[j][j + 1])}`);
                        //
                        if(orderedInputs[i][2] != 0 && i < tlen){//if input time is nonzero and it's not the last in the nonzero list
                            U.splice(tlen, 0, ...U.splice(i, 1));//move row and corresponding input to last in nonzero list
                            orderedInputs.splice(tlen, 0, ...orderedInputs.splice(i, 1));
                        }else if(orderedInputs[i][2] == 0 && i < len){//if input time is zero and it's not the last in the list
                            U.push(...U.splice(i, 1));//move row and corresponding input to last in list
                            orderedInputs.push(...orderedInputs.splice(i, 1));
                        }else{
                            //console.log("Uh oh");
                        }
                        //
                        if(U[j][j] == 0){
                            mult = 0;
                        }else{
                            mult = U[i][j] / U[j][j];
                        }
                        //console.log(`Multiplier: ${mult}, j: ${j}`);
                        //
                        c++;
                    }
                    if(c == len){
                        //console.log("Reorder failed");
                    }
                }
                L[i][j] = mult;
                U[i] = subRow(U[i], U[j], L[i][j]);//subtract row for Guassian Elimination
                //console.log(U.slice());
                let zeroCheck = 0;
                U[i].forEach(val => {zeroCheck += val});
                if(zeroCheck == 0){
                    //console.log("Processed failed. Exiting function.");
                    return [];
                }
            }
        }
        //
        //console.log(L);
        //console.log(U);
        //console.log("Check:");
        //console.log(multMatricis(L, U));//verified
        if(checkEqual(multMatricis(L, U), A)){
            //console.log("CONFIRMED");
        }else{
            //console.log("INCORRECT");
        }
        //
        //solve for Y temporary values
        var Y = [orderedInputs[0][0] / L[0][0]];
        for(var i = 1; i <= len; i++){
            Y.push(calcRowSolLower(orderedInputs[i][0], L, i, Y));
            //console.log(Y[Y.length - 1]);
        }
        //console.log(Y);
        //solve for solutions (X)
        var X = [Y[len] / U[len][len]];
        for(var i = len - 1; i >= 0; i--){
            X.splice(0, 0 , calcRowSolUpper(Y[i], U, i, X));
        }
        //console.log("Solutions: ");
        //console.log(X);
        //
        //console.log("Check:");
        let check = true;
        orderedInputs.forEach((input, i) => {
            //console.log(`Equation ${i} should be ${input[0]}`);
            var build = A[i][0] * X[0];
            var total = A[i][0] * X[0];
            for(var j = 1; j <= len; j++){
                build += " + " + A[i][j] * X[j];
                total += A[i][j] * X[j];
            }
            //console.log(`Evaluates to ${total} from ${build}`);
            if(total != input[0]){
                check = false;
            }
        });
        if(check){
            //console.log("SUCCESS!!");
        }else{
            //console.log("FAILED.");
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

function calcRowSolLower(input, L, idx, Y){
    var sum = 0;
    for(var i = 0; i < idx; i++){
        //console.log(`Adding sum ${L[idx][i] * Y[i]}`);
        sum += L[idx][i] * Y[i];
    }
    //
    //console.log(`from (i-s)/L to (${input} - ${sum}) / ${L[idx][idx]}`);
    return (input - sum) / L[idx][idx];
}

function calcRowSolUpper(input, U, idx, X){
    var sum = 0;
    for(var i = idx + 1; i < U.length; i++){
        //console.log(`Adding sum ${U[idx][i] * X[i - idx - 1]}`);
        sum += U[idx][i] * X[i - idx - 1];
    }
    //
    //console.log(`from (i-s)/L to (${input} - ${sum}) / ${U[idx][idx]}`);
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

function countSignChanges(func){//count number of sign changes
    var signChanges = 0;
    for(var i = 1; i < func.length; i++){
        if(func[i] * func[i-1] < 0){
            signChanges += 1;
        }
    }
    return signChanges;
}

function calcFunc(func, x){//find value of function for a given x
    var sum = 0;
    for(var i = 0; i < func.length; i++){
        sum += func[func.length-1-i] * Math.pow(x, i);
    }
    return sum;
}

function findRoot(func, derFunc, x0){//find root for a given guess
    var x = x0;
    for(var i = 0; i < 500; i++){
        x = x - calcFunc(func, x) / calcFunc(derFunc, x)
        if(Math.abs(calcFunc(func, x)) < 1e-10){
            return x;
        }
    }
    return x;
}

function numSimilar(num1, num2){//check if two numbers are similar
    return Math.abs(num1 - num2) < 1e-7;
}

function numInList(num, list){//check if a number is in a list}
    var bool = false;
    list.forEach(i => {
        if(numSimilar(i, num)){
            bool = true;
            return;
        }
    });
    return bool;
}

function findRealRoots(func){//find real roots of a function
    func.forEach((val, i) => func[i] += val == 0 ? .00001 : 0);//add .00001 if number is 0 to prevent dividing by zero
    //
    var nFunc = func.slice();
    var posRoots = countSignChanges(func)
    for(var i = func.length; i >= 0; i -= 2){
        nFunc[i] *= -1
    }
    var negRoots = countSignChanges(nFunc)
    //
    var derFunc = []
    for(var i = 0; i < func.length - 1; i++){
        derFunc.push(func[i]*(func.length-1-i));
    }
    //
    let testNum = 200;
    //
    var guess = 0;
    var roots = [];
    var posRootsFound = 0;
    var negRootsFound = 0;
    for(var i = 0; i < testNum; i++){
        var root = findRoot(func, derFunc, guess)
        if(!numInList(root, roots)){
            roots.push(root);
            if(root >= 0){
                posRootsFound += 1;
            }else{
                negRootsFound += 1;
            }
        }
        if(posRootsFound == posRoots && negRootsFound == negRoots){
            break;
        }
        guess += 1;
    }
    //
    guess = -1
    for(var i = 0; i < testNum; i++){
        root = findRoot(func, derFunc, guess)
        if(!numInList(root, roots)){
            roots.push(root);
            if(root >= 0){
                posRootsFound += 1;
            }else{
                negRootsFound += 1;
            }
        }
        //
        if(posRootsFound == posRoots && negRootsFound == negRoots){
            break;
        }
        guess -= 1;
    }
    //
    return roots;
}