/*
On creation, the following things can happen:
1. An object is created at the center of the screen
2. The user clicks and drags the object to where they want it or enter a few numbers for its position (enter for confirm)
    - at any time in inputs, the user can press tab to switch coord type to polar
    - during value process, text below object will prompt user to confirm position, velocity, acceleration
3. A vector for velocity appears, user can click and drag vector head or enter inputs in props (enter for confirm)
4. Component vector for acceleration appears, with unclickable gravity and net accel and clickable new acceleration
    - gravity component will only appear if gravity is toggled on
5. Based on inputs, the object will solve all other properties
If at any point the user clicks off the object (onto the grid) or off the props inputs (onto the left column),
    the remaining values will be negated, and the object will become UNSOLVED
An UNSOLVED object will have a warning at the top of props and will be static over time

After creation, the following things can happen:
    - the object's values can be changed at any time, leading to a resolve
    - the object's equations can be changed at any time, leading to a resolve
    - the object's Net force or mass can be changed at any time, leading to a resolve
        - the nongravity force component will affect nongravity acceleration component (a = F/m)
    - the object can be solved or resolved at any time with the Calc prop
    - the values of an object at a given time can be calculated at any time with the Calc prop (this will also change the current time)
    - a new component can be applied to any value with the Apply prop
*/

export default class Object{
    constructor(field){
        //
    }
}