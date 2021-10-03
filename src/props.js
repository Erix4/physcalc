export default class Props{
    constructor(command){
        this.command = command;
        //
        this.column = d3.select("#column");
    }
    //
    newObj(){
        this.column.append("p", "hope");
    }
}