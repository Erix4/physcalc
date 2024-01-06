# physcalc
A physics calculator website

Go [here](https://physcalc-docs.readthedocs.io/en/latest/index.html) for the official documentation.

# About the Project

This is a personal project of Eric Patton, intended to help solve kinematics problems using a visual interface.

The logic is written entirely in vanilla Javascript, using D3 and BigDecimal.
The components of the website (i.e. the timeline, grid and objects) each have their own classes and .js files.
The underlying math for object motion is in the func.js file, which describes arbitrarily high-order, parametric piecewise equations.
For the purposes of this website, the interface limits the user to sixth order polynomials (aka the "pop" value of the object).

In the func.js file, equations are broken down into layers of abstraction, in the following order:

1. Profile: piecewise set of parametric equations which describes the entire movement

2. Piece: a single parametric equation within the profile, with a set of corresponding derivate parametric equations, derived until further derivates are zero

3. Para: a single parametric equation, at some level of derivation within the piece

4. Func: one of two functions (x or y) within the parametric equation

5. Term: a single coefficient in the function and its power - lowest level

Note: in a future update the Term object will be removed, and its functionality replaced with the index of the coefficient in a list

## Root Approximation

An interesting component of the project, which comes at a consequence of dealing with higher-order polynomials, is root approximation.
When drawing the screen, functions/curves are drawn by breaking them into a number (at the time of writing 500) small segments and drawing these as straight lines.
In order to determine what parts of the function to draw, the program must first detect where it intersects with the edge of the screen.
Because the equations are parametric, they may enter and exit the screen any number of times.
In order to detect all these crossing points, we can- for each edge of the screen- shift the parametric equation until the edge of the screen is at zero.
Then, approximating the zeroes gives every instance where the line enters or exits the screen on that edge.
You can determine whether the equation is entering or exiting the screen using the sign of the first coefficient of the equation.

Because the equations are higher order, there is no single equation to find their roots.
As such, the roots must be approximated.
Initially, the Newton-Rhapson method was utilized for this, but it proved too inefficient.
Currently, I have implemented the Collins-Akritas algorithm, which is based on Descarte's Rule of Signs.
The implementation can be found on line 2060 of the func.js file
It effectively works by splitting the function into intervals where a single root must be.
Then the intervals are reduced continuously using Bisection until the root can approximated highly accurately.
