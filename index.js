const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MongoStoreClass = require('connect-mongodb-session')(session);

const UserModel = require( path.join(__dirname, 'models', 'User.js') );

//===================================================
// Set up Work
//===================================================
require('dotenv').config();         //Environment variables
const app = express();              //Express application

// Connect to the database
mongoose.connect( process.env.MONGO_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true   
}).then(()=> {
    console.log("Mongo Database connected at " + process.env.MONGO_URL);
});

//=================================
// Middlewares
//=================================

//  Pug Templating Engine to serve HTML
app.set('view engine', 'pug');
app.set('views', './views');

//  Serve Static files in the public directory
app.use('/public', express.static( path.join(__dirname, 'public') ) );

//  Parse form form data
app.use( express.urlencoded({
    extended: false
}));
app.use(express.text({
    limit: '7.5mb'
}));


/*
    Setting up the express session can be split into several main steps.

    1. Import everything you needed. You may need the following packages, this project is worked around MongoDB connection
        >   mongoose                (MongoDB's ORM)
        >   express-session         (The middleware for express to handle session for you)
        >   connect-mongodb-session (As store for the express-session)

    2. Connect-mongodb-session is initialized with the session middleware obtained earlier. As following:
                const MongoStoreClass = require('connect-mongodb-session')(session); 

       Note that this essentially returns a class for you to use, which is used to create an object for MongoDBStore

    3. Create an MongoDBStore object, passing in the Mongo connection string (mongodb://uri/database) and essential
       parameters to it. Like:
                const store = new MongoStoreClass({
                    uri: process.env.MONGO_URL,
                    collection: "Learning Authentication"
                });

    4. Apply the middleware to our express application, passing in required arguments and the store we created, as follows:
                app.use(session({
                    cookie: {
                        maxAge: 1000 * 60 * 60 * 24         
                    }, 
                    secret: process.env.SECRET,
                    resave: false,                          
                    saveUninitialized: false,               
                    store: store                           
                }));       

    5. Volia! For every request, the req.session is available for us to access!
*/

const store = new MongoStoreClass({
    uri: process.env.MONGO_URL,
    collection: "Active Sessions"
});

//  Set up Session for our express application
app.use(session({
    cookie: {
        maxAge: 1000 * 60 * 60              // Cookie expires in 1 hour
    }, 
    secret: process.env.SECRET,
    rolling: true,                          // Every time the request is sent, the expire time on cookie is reset
    resave: false,                          // Do not save the session back into session store if the session is unmodified
    saveUninitialized: false,               // A new session that is not modified shall never be saved. Useful especially for login
    store: store                            // If not use MongoDB store we set up earlier, it defaults to MemoryStore
}));


//=====================================================
//===========================================
//  ROUTES - VIEW
//===========================================
//=====================================================
app.get('/', (req,res)=> {
    //  User is still in session and logged in. Thus simply redirect to dashboard
    if (req.session.isAuth) 
        return res.status(303).redirect('/profile');

    // User not logged in. Redirect to login page
    res.status(303).redirect('/login');
});



//===========================================
//  LOGIN
//===========================================
app.get('/login', (req,res)=> {
    //  User is still in session and logged in. Thus simply redirect to dashboard
    if (req.session.isAuth)
        return res.status(303).redirect('./profile');

    // The query parameter may contain messageDanger and messageSuccess from other routes. In this case, render it
    res.status(200).render('login', req.query);
});

app.post('/login', async (req,res)=> {
    const { login_username, login_password } = req.body;

    // Incomplete data sent
    if (!(login_username && login_password))
        return res.json({error:"Request body incomplete. Please try again"});

    // Validation of the submission data
    let searchUser;
    try {
        searchUser = await UserModel.findOne({ username: login_username }).exec();
    } catch (e) {
        return res.json({error:e});
    }

    // No user with such username exists
    if (!searchUser)
        return res.render('login', {
            messageDanger: `No user with username "${login_username}" exists!`
        });

    // If the password is incorrect password
    if (!bcrypt.compareSync(login_password, searchUser.hashed_password))
        return res.render('login', {
            messageDanger: `Incorrect password`
        });

    // Successful login! Set session
    req.session.isAuth = true;
    req.session.username = searchUser.username;

    res.status(200).redirect('/profile');
});


//===========================================
//  REGISTER
//===========================================
app.get('/register', (req,res)=> {
    //  User is still in session and logged in. Thus simply redirect to dashboard
    if (req.session.isAuth)
        return res.status(303).redirect('./profile');

    // The query parameter may contain messageDanger and messageSuccess from other routes. In this case, render it
    res.status(200).render('register', req.query);
});

app.post('/register', async (req,res)=> {
    const { register_username, register_password, register_confirm_password } = req.body;

    // Incomplete data sent
    if (!(register_username && register_password && register_confirm_password)) 
        return res.json({error:"Request body incomplete."});

    // Validation of the submission data
    if (register_password !== register_confirm_password)
        return res.json({error:"Password and Confirm Password Does not Match!"});

    // Check if the user already exists
    try {
        if( await UserModel.findOne({ username: register_username }).exec() )
            return res.json({error:`Username ${register_username} is already taken!`});
    } catch (e) {
        return res.json({error: e});
    }

    // Checks passed. Store the newly registered user into the database.
    const salt = bcrypt.genSaltSync( Number.parseInt(process.env.SALT_ROUNDS) );
    // Save the newly registered user into database and return success message
    await new UserModel({
        username: register_username,
        hashed_password: bcrypt.hashSync(register_password, salt)
    }).save();

    res.json({success: true});
});


//===========================================
//  PROFILE
//===========================================
app.get('/profile', async (req,res)=> {
    if (!req.session.isAuth)
        return res.status(401).redirect('/login?messageDanger=Please+login+into+your+profile+first!');

    // Obtain the user information from the database
    let searchUser;
    try {
        searchUser = await UserModel.findOne({ username: req.session.username }).exec();
    } catch (e) {
        return res.status(500).json({error:e});
    }

    // Some kind of error causes such user does not exist. Destroy session and redirect to login page
    if (!searchUser) {
        req.session.destroy(()=> {
            return res.status(404).redirect('/login?messageDanger=404+Error+User+cannot+be+found');
        });
    }

    let avatarUrl = searchUser.profile_pic? searchUser.profile_pic: '/public/image/user.svg';

    res.status(200).render('profile', {
        username: searchUser.username,
        status: searchUser.status,
        profileAvatar: avatarUrl
    });
});

// API call to change status of a user
app.post('/profile/changeStatus', async (req,res)=> {
    if (!req.session.isAuth)
        return res.status(401).json({error:"Unauthorized. Please log in to fix this problem"});

    if (req.body.profile__chgStatus.length > 500)
        return res.status(400).json({error:"New status too long. Do not exceed 500 characters"});

    // Obtain the user information from the database
    let updateQuery;
    try {
        updateQuery = await UserModel.updateOne({
            username: req.session.username
        }, {
            $set: { status: req.body.profile__chgStatus }
        });
    } catch (e) {
        return res.status(500).json({error:e});
    }

    // Somehow no body are updated. Return error
    if (updateQuery.nModified === 0)
        return res.status(500).json({error: `Unable to update status for user ${req.session.username}`});

    //  Otherwise update is successful.
    res.status(200).json({success: true, newStatus: req.body.profile__chgStatus });
});



// API Call to Change Profile Picture of a User. Saved in MongoDB as base64 encoded image
app.post('/profile/changeProfilePic', async (req,res)=> {
    if (!req.session.isAuth)
        return res.status(401).json({error:"Unauthorized. Please log in to fix this problem"});

    const imgData = req.body;

    // Data Base64 url is not valid image
    if (!imgData.startsWith('data:image/'))
        return res.status(400).json({error: "New profile picture is not a valid image!"});

    // Data Base64 url is too large
    if (imgData.length > 5242880)
        return res.status(400).json({error: "Image too large! Make sure it is less than ~5MB"});

    // Obtain the user information from the database
    let updateQuery;
    try {
        updateQuery = await UserModel.updateOne({
            username: req.session.username
        }, {
            $set: { profile_pic: imgData }
        });
    } catch (e) {
        return res.status(500).json({error:e});
    }

    // Somehow no body are updated. Return error
    if (updateQuery.nModified === 0)
        return res.status(500).json({error: `Unable to change profile picture for user ${req.session.username}`});

    //  Otherwise update is successful.
    res.status(200).json({success: true});
});



//===========================================
//  LOGOUT
//===========================================
app.get('/logout', (req,res)=> {
    req.session.destroy(()=> {
        res.status(200).redirect('/login?messageSuccess=Successfully+Logged+Out!');
    });
});



//=====================================================


app.listen( process.env.PORT || 3000, ()=> {
    console.log(`Web server started at port ${process.env.PORT || 3000}`);
});