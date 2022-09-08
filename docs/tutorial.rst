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
Words here

The Properties Menu
===================

About the use of the properties menu

.. _settings:

The Settings Menu
=================

About the use of the settings menu