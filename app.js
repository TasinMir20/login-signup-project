/*****###### Dependencies Start ######*****/

/* Dependencies Modules*/
const express = require('express');
const dotenv = require('dotenv'); // Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.
const mongoose = require('mongoose'); // Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment. Mongoose supports both promises and callbacks.
const morgan = require('morgan'); // Morgan is used to output request details on the console.
const chalk = require('chalk'); // Advantages of Chalk Module: It helps to customize the color of the output of the command-line output. It helps to improve the quality of the output by providing several color options like for warning message red color and many more.

/*****###### Dependencies End ######*****/

const app = express();
dotenv.config(); // called dotenv


// Import Routes
const authRoutes = require('./routes/authRoute');

// command to dev env set- set NODE_ENV=DEVELOPMENT
// console.log(process.env.NODE_ENV);
console.log(app.get("env") + " Environment");


// Setup view/template engine
app.set("view engine", "ejs");
app.set("views", "views");

// Middleware Array
const middleware = [
    morgan("dev"),
    express.static("public"),
    express.urlencoded({extended: true}),
    express.json()
];

app.use(middleware);


/*** Start to handle Request Response ***/
app.use("/", authRoutes);

app.get("/", (request, response) => {

    return response.redirect('/auth/login');
});




/****** START -- Error handling-----> *******/

// app.use((request, response, next) => {

//     return response.render("pages/error/404");
//     // return response.redirect('/auth/login');
// })

/**  if users visit random pages which pages are not available then this page Page will render to user front **/
app.use((request, response, next) => {
    let error = new Error("404 page not found");
    error.status = 404;
    next(error);
});

/**  if any error on server then this page Page will render to user front **/
app.use((error, request, response, next) => {
    if (error.status === 404) {
        return response.render("pages/error/404");
    }
    console.log(error);
    response.render("pages/error/500");
});
/****** END -- Error handling-----> *******/


/* Configuration */
const config = {
    PORT: process.env.PORT || 7000,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_USER_PASSWORD: process.env.DB_USER_PASSWORD,
    DATABASE_NAME: process.env.DATABASE_NAME
}

// const URL = `mongodb+srv://${config.DB_USERNAME}:${config.DB_USER_PASSWORD}@cluster0.h7kk2.mongodb.net/${config.DATABASE_NAME}`;
const URL = "mongodb://127.0.0.1:27017/nodejs-project-stack_email-verify";

mongoose.connect(URL, {useUnifiedTopology: true, useNewUrlParser: true})

.then(() => {
    console.log(chalk.hex('#9980FA')("Database connected"));

    app.listen(config.PORT, () => {
        console.log(chalk.hex('#38ada9')(`Server is Running on ${config.PORT}`));
    })
})
.catch(e => {
    return console.log(e);
})

