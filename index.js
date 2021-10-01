let canvas = document.getElementById("canvas");

let body = d3.select("body");
let svg = d3.select("#svg");

import Command from "./src/command";

new Command(canvas, svg);