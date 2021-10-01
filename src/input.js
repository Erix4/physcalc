export default class Input{
    constructor(command){
        var fieldMove = false;
        //
        var mX = 0;
        var mY = 0;
        //
        let canox = parseInt(d3.select("#leftcolumn").style("width"));
        let canoy = parseInt(d3.select("#header").style("height"));
        //
        window.addEventListener("resize", event => {
            command.field.resize();
        });
        //
        document.addEventListener("wheel", event => {
            command.field.zoom(Math.pow(2.7, event.deltaY / 700), mX, mY);
        })
        //
        command.svg.on("mousedown", function(){
            console.log("Click registered");
            fieldMove = true;
        });
        //
        d3.select("svg").on("mousemove", function(){
            let mouse = d3.mouse(this);
            //
            if(fieldMove){
                command.field.repos(mouse[0] - mX, mouse[1] - mY);
            }
            mX = mouse[0];
            mY = mouse[1];
        });
        //
        command.svg.on("mouseup", function(){
            fieldMove = false;
        });
    }
}