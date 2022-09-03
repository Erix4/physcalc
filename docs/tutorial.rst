########
Tutorial
########

.. _display:

Display
=======

On a computer, the largest feature of the website is the display.
It allows you view and control the physics calculator at the same time.
There are several things you can do on the display without needing to use other sections.

Adding objects
--------------

.. video:: vids/tutvid1.mov
    :autoplay:

When you open the website, you'll notice an object has been created for you.
It will look like a red circle in the middle of the grid.
If there is no object, you can press the add button or the a key on your keyboard to create one.
After adding an object, click somewhere on the grid to comfirm its initial location.
You can create as many objects as you like, but keep in mind that with too many objects (more than 10) performance will be affected.

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

There are a number of ways that you can change an object with the display alone.
Most simply, you can click and drag an object to change its current position. 
Moving an object at any point in time will also change its path of motion.
You can see an object's path of motion by the red curve behind the object.
The graph of an object's path will always match the color of the object.
You'll also notice, as you drag the object around, that some values in the properties menu to the left are updated automatically.
We'll go over this in more detail in :doc:`properties` section below.

On the object, there is an arrow protruding to the top right.
When an object is created, it is given a default velocity of 5 m/s on the x, and 5 m/s on the y.
An object is also affected by gravity (with a value of -9.81 m/s^2) by default.
The arrow attached to the object represents the object's current velocity.
You can change it's current velocity by clicking the white handle at the end of the arrow and dragging it to a new location.
Note that the displayed length of the arrow will always be four times shorter than its actual value.
As you change the velocity of the object, you can see the graph of its motion change to match.
The purpose of vector arrows is to help display an object's instanteneous motion and help you edit that more intuitively.

You can view the vector arrows for any one value, all the values simultaenously, or none of the values at all.
In the top left corner of the grid display, you'll see a drop down menu which is labelled "Arrows."
The menu should be set to "Velocity" by default.
You can click on this menu to change which arrows are shown on all objects.
If you choose to display all arrows, note that each arrow is colored differently.
The arrows are more lightly colored for higher order derivatives.
For instance, the arrow for Acceleration is more lightly colored than the arrow for Velocity.

Above the menu for arrows is an textbox which shows the current time.
You can click on this box to edit the current time in the calculator, and click on the menu to the right of it to change the units that time is measured in.
To run the calculator in real time, simply press the space bar, and the object will start moving according to kinematics in Newtonian physics.
Press the space bar again to stop the motion.
Time scrubbing and playback will be covered in more depth in :ref:`timeline` section below.

Finally, in the bottom left corner of the grid display, you'll see three buttons, labeled "f(t)", "x(t)", and "y(t)".
Every object's motion is dictated by two separate functions for the x and y component of its motion.
By default, both functions are shown together as a parametric function over a y vs. x grid space.
However, you can also view either function individually with relation to t, or time.
The "x(t)" button will show you the isolated x motion over time, while the "y(t)" button will show you the y motion over time.
The vector arrows will still be shown, but they will no longer indicate the magnitude of their value by length, and instead point in angle only.

.. _timeline:

The Timeline
============

About the use of the timeline

The Properties Menu
===================

About the use of the properties menu

The Settings Menu
=================

About the use of the settings menu