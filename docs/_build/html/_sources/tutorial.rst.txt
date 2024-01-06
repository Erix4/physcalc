########
Tutorial
########

.. _display:

Display
=======

On a computer, the largest feature of the website is the display.
It allows you view and control the physics calculator at the same time.
There are several things you can do on the display without needing to use other sections.

.. _navigating:

Navigating the display
----------------------

Before we look at the objects within the calculator, it's worthwhile to familiarize ourselves with the display grid.
Like in a graph, the grid is a field with certain dimension.
The lines within the graph will scale as you zoom in and out.

To zoom in on the display, simply scroll up on your mouse pad or mouse wheel.
You can also pinch zoom on a mouse pad.
You can also zoom in on one dimesion, by holding shift and scrolling.
This will zoom in only on the x axis.
You can use :ref:`settings` to sqaure the zoom back to 1:1 between x and y.

To reposition the display, click on the grid and drag it around.
Once again, :ref:`settings` allows more detailed control about the position.

.. note::
    When repositioning the display, you must select a place in the grid without any objects or points,
    or else you will move them instead of the position of the display.

Adding objects
--------------

When you open the website, you'll notice an object has been created for you.
It will look like a red circle in the middle of the grid.
If there is no object, you can press the add button or the a key on your keyboard to create one.
After adding an object, click somewhere on the grid to comfirm its initial location.
You can create as many objects as you like, but keep in mind that with too many objects (more than 10) performance will be affected.

Selecting objects
-----------------

Selecting an object is as simple as clicking it.
Once an object is selected, details about it will appear in the properties menu.
To deselect on object, just click anywhere on the field.
If you want, you are allowed to select multiple objects.
There are a few ways to do this.
One way is to shift click an object you also want selected.
Shift clicking on object which is already selected will deselect it.
Another way to select mutliple objects is holding down shift and dragging over all the objects you want selected.

.. note::
    When you select multiple objects, the object details displayed in the property menu will stay on the object last selected.

Manipulating objects
--------------------

There are a number of ways that you can change an object with the display alone.

Object position
^^^^^^^^^^^^^^^

Most simply, you can click and drag an object to change its current position. 
Moving an object at any point in time will also change its path of motion.
You can see an object's path of motion by the red curve behind the object.
The graph of an object's path will always match the color of the object.
You'll also notice, as you drag the object around, that some values in the properties menu to the left are updated automatically.
We'll go over this in more detail in :ref:`properties` section below.

Object velocity
^^^^^^^^^^^^^^^

On the object, there is an arrow protruding to the top right.
When an object is created, it is given a default velocity of 5 m/s on the x, and 5 m/s on the y.
An object is also affected by gravity (with a value of -9.81 m/s^2) by default.
The arrow attached to the object represents the object's current velocity.
You can change it's current velocity by clicking the white handle at the end of the arrow and dragging it to a new location.
Note that the displayed length of the arrow will always be four times shorter than its actual value.
As you change the velocity of the object, you can see the graph of its motion change to match.

Vector Arrows
^^^^^^^^^^^^^

The arrow you used to adjust the velocity is called a vector arrow.
The purpose of vector arrows is to help display an object's instanteneous motion and help you edit that more intuitively.
You can view the vector arrows for any one value, all the values simultaenously, or none of the values at all.
In the top left corner of the grid display, you'll see a drop down menu which is labelled "Arrows."
The menu should be set to "Velocity" by default.
You can click on this menu to change which arrows are shown on all objects.
If you choose to display all arrows, note that each arrow is colored differently.
The arrows are more lightly colored for higher order derivatives.
For instance, the arrow for Acceleration is more lightly colored than the arrow for Velocity.

Extreme Points
^^^^^^^^^^^^^^

By default, Physics Calculator identifies various important points in the motion of your object.
These points could be x or y intercepts (where an object's position crosses an x or y axis),
or where any other aspect of its motion reaches zero.
For example, when an object is initially moving upward but later falls due to gravity,
there is a point in time where its velocity equals zero.
This is the highest point, or the vertex, of its arc (which in this case is a parabola).
Physics Calculator while illustrate this point with a small dot where it exists.
You can click on this dot to display its coordinates.
You can also click and drag the dot to move the corresponding object's path of motion with it.
This is useful if you want a event point to happen at a certain location, for instance having an object reach its maximum height at (5,5).

.. note::
    The visibility of these points can be disabled using the settings menu.
    This will be covered further in :ref:`settings` section below.

Value Snapping
^^^^^^^^^^^^^^

When moving an object (by dragging it or an extreme point), it is possible to snap the desired value to certain intervals.
To activate this feature, simply hold down the "ctrl" button while dragging.
The intervals the object will snap to are defined by the current zoom of the display (see :ref:`navigating`).

Changing the time
-----------------

Above the menu for arrows is an textbox which shows the current time.
You can click on this box to edit the current time in the calculator, and click on the menu to the right of it to change the units that time is measured in.
To run the calculator in real time, simply press the space bar, and the object will start moving!
Press the space bar again to stop the motion.
Time scrubbing and playback will be covered in more depth in :ref:`timeline` section below.

.. note::
    Physics Calculator is built on kinematics in newtonian physics, it is not capable of simulating einsteinian physics.

Component Views
---------------

Finally, in the bottom left corner of the grid display, you'll see three buttons, labeled "f(t)", "x(t)", and "y(t)".
Every object's motion is dictated by two separate functions for the x and y component of its motion.
By default, both functions are shown together as a parametric function over a y vs. x grid space.
However, you can also view either function individually with relation to t, or time.
The "x(t)" button will show you the isolated x motion over time, while the "y(t)" button will show you the y motion over time.
The vector arrows will still be shown, but they will no longer indicate the magnitude of their value by length, and instead point in angle only.

.. _timeline:

The Timeline
============

The timeline is a very useful portion of the website, located at the bottom.
It contains some basic playback tools, and well as a clear visualization of a object's motion path's extreme points.
The timeline is simpler than the display, but there are still several things you can do.

Navigating the timeline
-----------------------
To zoom in and out on the timeline, simply scroll up or down while hovering over it.
To scroll left or right, shift click anywhere on the timeline and drag left or right.
You can manually edit the current visible range of the timeline using the field on the upper right side of the timeline.
Additionally, you can change the unit the fields are in using the drop down next to it.
To the left of these fields is a button called rescale, which will automatically set the visible range of the timeline based on the important points in the objects path.

To set the current time, click anywhere on the timeline.
This will also move the time cursor to that position.
You can control click on the timeline to snap to specific intervals (for instance every 5 seconds) or to important points for any of the objects.

Objects on the timeline
-----------------------

When an object is present, a line corresponding with the color of the object will appear on the timeline.
This line will have small dots on it, representing the important (or critical) points in the object's motion.
For instance, when an object has zero velocity, or crosses the x axis, would both be considered critical points.

Clicking on a critical point will move the cursor and the object to that point in time.
You can then look at the properties menu for detailed information on the object's current position and motion.
You can click and drag the critical points on the timeline to move the function in time.
For instance, dragging a point to the left on the timeline would make that point happen sooner in time.
Holding control while dragging a point will snap it to time intervals or other objects' critical points.

The Properties Menu
===================

The properties menu is where you can manually control everything about each object.
As you hover over items in the properties menu, pop-ups will appear to explain their functionality.

The very top of the menu lists the number of the current object selected, in the color that the object appears in on the grid.
When no object is selected, this will read "no object".


Piecewise bar
-------------

Below the object header, there is a small section with a tab, labeled "1", and plus button next to it.
This section allows you to add additional equations to any object to describe it at different points in time.
For instance, you could have the object completely still until t=0, and then accelarate forward at t>0.
Essentially, they are piecewise equations.
If your piecewise equations do not describe an object's motion at a given point in time, the object will simply not move during that time.

To add a new piecewise equation, simply click the plus button.
With multiple piecewise equations, you can click on the corresponding tab to move to each equation.
The current time will automatically update to move the object to a point within that equation's time range.
Editing values while that tab is selected will update the equations of the tab selected.

Piecewise equations can have one of three relationships with its neighboring equation:
1. Continuous - the equation always ends at the starting position and time of the next equation
2. Discontinuous - the equation ends at the same time, but not necessarily the same position as the next equation
3. Disconnected -the equation does not necessarily end at the same time or position as the equation

When a new piecewise equation is created, it by default is continuous with its neighboring equation.
You can change the relationship, with either the left (earlier) or right (later) neighboring equation by clicking the icon to the left or right of the _<T<_ text.
If there is no equation on that side of the current equation, the icon can only be infinity- 
as in the equation continues to infinity, or disconnected- where the equation ends at a specific point in time.
If there is an equation on that side of the current equation, the icon can be only relationship except infinity.

When an icon does not read infinity, the text field next to the icon will light up, indicating you can specify the time when an equation starts or ends.
If that side of the relationship is not disconnected, updating the time will also update the time for neighboring equations.
When a neighboring equation is continuous, altering the current equation will alter the starting position- and there position values- of the neighboring equation.

.. note::
    When you click the plus button to create a new piecewise equation, it will always add an equation starting at your current point in time, and going to infinity, or the next equation.

Values section
--------------

The collaspable values section lists all the current values of the selected object.
Because all objects are described with parametric equations, every values has a set of x and y number associated with it.
The numbers also have units, which can be changed using the drop down next the the numbers.

As you move forward and backward in time, the values will automatically update according to the object's motion.
You can click on these values and edit them, which will in turn edit the motion of the object.
You can also click the circular arrow to the right of every set of values to set both to zero.
Click the diagonal arrow next to that will show the corresponding vector arrows in the visual display.

By default, three values are shown: position, velocity, and accelaration.
You can click on and expand the "More" drop down to also show jerk, snap, crackle, and pop, which are further derivatives.
These values will usually be zero, unless your object's motion is described by higher order polynomial functions.

When a new object is created, it's velocity with be +5 on the x and y axis, its position will be wherever you clicked and place the object, 
and its accelartion will be -9.81 on the y, unless you've changed the default gravity value in the settings.

The values will round to three decimals places by default, but if you add additional significant figures all value fields 
will increase to that number of significant figures.

Equations section
-----------------

The equations section shows the equations for the movement of the selected object.
The main equation is for the position, listed as two functions of its parametric motion: x(t) and y(t).

The velocity and acceleration are also listed as derivates of the main function: x'(t) and y'(t).

You can change the units the equations are in using the drop down at the top of the section.

.. _settings:

The Settings Menu
=================

About the use of the settings menu