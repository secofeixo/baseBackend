# BigFinite test

Code creating a simple api for making the test for bigfinite

1. Clone the repo: `https://github.com/secofeixo/baseBackend/tree/bigfinite`
2. Install packages: `npm install`
3. Install mongodb and create a database with name bigfinite
4. Install redis. Used as a cache of tokens not valids.
5. Change out the database configuration in config/database.js
6. Change out the email configuration in config/email.js. Use a google email account, but configuring that account in order to be able to send emails.
7. Launch: `npm run local`
8. Visit in your browser at: `http://localhost:1337`

## Docker

You can use it with docker, running `docker-compose up --build`.<br>
It will create the docker image for the node server, and then run the three images of the docker-compose file.<br>
Currently the database is not setup with a volume, so the data is not persistent. <br>
If you want to use with persistent data:
1. Uncomment the lines in the docker-compose file for the service mongo_db
2. Create the folder /mongo/data with the write permissions in order to write on it from the docker image.

Running the docker, it exposes the port 8080, so the url for testing is http://localhost:8080<br>
The docker runs the nodejs using pm2, with two instances of the API Rest. PM2 balance the calls sending them to one of the two instances of nodeJS. Also PM2, restart the process if there is any crash of the nodejs.

## Usage

First you must create some users<br>
`POST localhost:8080/user`<br>
`data: {
"username": "username",
"password": "12345678",
"email.addr": "email@email.com"
}
`
<br>
The sign up process must send an email with a token to the email specified by the user. If you don't receive it you can get new token to authenticate using:<br>
`GET localhost:8080//emailValidateProfile`<br>
`data: {
"email": "email@email.com"
}
`
<br>
To verify the user, the API call is: <br>
`GET localhost:8080/verifyProfile?token=token_received_in_the_email`<br>
You can get the token in the logs of node if there is any problem sending the email with the otken, or directly you can set the attribute `verified` to true in the collection users of database transaction<br>
<br>
A user must be logged in, in order to get the balance or to make a transaction.<br>
`POST localhost:8080/login`<br>
`data: {
	"email": "email@email.com",
	"password": "12345678"
}`<br>
It returns a token, and this token must be used in the other api calls in order to authenticate the user.<br>
All the api calls must include the header:<br>
Authorization: Bearer token_sent_after_login <br>
You can check if the is valid with:<br>
`GET localhost:8080/login`<br>
And adding to the header the token.
<br>
For logout the user<br>
`GET localhost:8080/logout`<br>
Adding to the header the token.
<br>
# Users
The CRUD functions for users are: <br>
1. GET localhost:8080/user<br> For getting the list of the users. The results are paginated by default every 30 elements.
2. GET localhost:8080/user/:idUser<br> For getting a user.
3. POST localhost:8080/user<br>For creating new user. The body must be a JSON object with the structure of the model user defined in the code.
4. PUT/PATCH localhost:8080/user/:idUser<br>For updating the user. The body must be a JSON object with the structure of the model.
5. DELETE localhost:8080/user/:idUser<br>For removing the user
6. DELETE localhost:8080/user<br>CAREFULLY. It removes all the users.
# Solutions
The CRUD functions for solutions are: <br>
1. GET localhost:8080/solutions<br> For getting the list of the solutions. The results are paginated by default every 30 elements.
2. GET localhost:8080/solutions/:idSolution<br> For getting a solution.
3. POST localhost:8080/solutions<br>For creating new solution. The body must be a JSON object with the structure of the model solution defined in the code.
4. PUT/PATCH localhost:8080/solutions/:idSolution<br>For updating the solutions. The body must be a JSON object with the structure of the model
5. DELETE localhost:8080/solutions/:idSolution<br>For removing the solution with _id equal to :idSolution
6. DELETE localhost:8080/solutions<br>CAREFULLY. It removes all the solutions.
# Screens
The CRUD functions for screens are: <br>
1. GET localhost:8080/screens<br> For getting the list of the screens. The results are paginated by default every 30 elements.
2. GET localhost:8080/screens/:idScreen<br> For getting a screen.
3. POST localhost:8080/screens<br>For creating new screen. The body must be a JSON object with the structure of the model screen defined in the code.
4. PUT/PATCH localhost:8080/screens/:idScreen<br>For updating the screens. The body must be a JSON object with the structure of the model
5. DELETE localhost:8080/screens/:idScreen<br>For removing the screen with _id equal to :idScreen
6. DELETE localhost:8080/screens<br>CAREFULLY. It removes all the screens.
# Widgets
The CRUD functions for widgets are: <br>
1. GET localhost:8080/widgets<br> For getting the list of the widgets. The results are paginated by default every 30 elements.
2. GET localhost:8080/widgets/:idWidget<br> For getting a widget.
3. POST localhost:8080/widgets<br>For creating new widget. The body must be a JSON object with the structure of the model widget defined in the code.
4. PUT/PATCH localhost:8080/widgets/:idWidget<br>For updating the widgets. The body must be a JSON object with the structure of the model
5. DELETE localhost:8080/widgets/:idWidget<br>For removing the widget with _id equal to :idWidget
6. DELETE localhost:8080/widgets<br>CAREFULLY. It removes all the widgets.
