bike-usa
========

MEAN stack web app for planning and tracking my future bike trip across the USA.
More of an experiment at this stage, not much you can do with it :)

#### [Hosted on Heroku](http://bike-usa.herokuapp.com/)

### Installation

Download `bike-usa` and install dependency modules:

	$ git clone https://github.com/SergiuB/bike-usa.git bike-usa
	$ cd bike-usa
	$ npm install && bower install

On Windows npm install will an error because it tries to run bower install as a postinstall script. Just ignore and run manually bower install after.

### Run local

	$ node server

Open http://localhost:3000/