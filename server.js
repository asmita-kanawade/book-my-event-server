const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const mongoose = require("mongoose");
const EventsModel = require("./model/eventsModel");
const EventUsersModel = require("./model/eventUsersModel");
const BookedEventsModel = require("./model/bookedEventsModel");

const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { isValidPassword, authorizedUser } = require("./services/auth-services");


dotenv.config();
mongoose.set("useFindAndModify", false);

// -- create server --
const app = express();

// -- use body parser middleware to parse the req body --
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());

/*Render HTML */
app.get('/', function (req, res) {

  console.log("inside app.get:/");

  fs.readFile("view/index.html", function (err, data) {
    //res.send(data.toString())
    res.send("Hello world..!");
  })
});


/**--- Get/Search the event ---*/
app.post('/api/search-event', async (req, res) => {

  console.log("inside /api/search-event");

  try {
    let conditions = {to_date: { $gte: 20200511 }};
    console.log(`search conditions: ${JSON.stringify(conditions)}`);
    
    // let events = await EventsModel.find({}, null, {});
    const events = await EventsModel.find(conditions).sort({ title: 1 });

    res.send(events);
    
  } catch (error) {

    console.log(`Search events Error: ${error}`);
    res.send(error);

  }
  
});



//-----add event
app.post('/add-event',  async (req, res) => {    

    try {

        // get the user token from the header
        let token = req.headers.authorization || '';

        let email = await authorizedUser(token)
        
        let users = await EventUsersModel.find({email});

        if(users[0].user_type != 'ADMIN') {
          
          res.send({
            status: `failed`,
            message: `Unauthorized to add an event. Access Denied.`,
            email: users[0].email
          })
          
        }

        try {
          
          
          const event = req.body;
          //console.log(`Event: ${JSON.stringify(event)}`);
          
          const eventsSchema = new EventsModel(event);
          
          await eventsSchema.save();
          
          // res.redirect(307, "/api/search-events");
          res.send({
            status: `success`,
            message: `Event saved with title ${event.title}`
          });
          
        } catch (error) {
          res.send({
            status: `failed`,
            message: `Error while adding event: ${error.message}`
          })
        }

    } catch (error) {

      res.send({
        status: `failed`,
        message: "Unauthorized. Please login."
      })
  
    }

 
});


//---------update event
app.post('/update-event',  async (req, res) => {

  console.log("inside /api/update-event");
  
  const event = req.body;
  //console.log(`events: ${JSON.stringify(event)}`);
  
  
  try {

    await EventsModel.findByIdAndUpdate(event._id, 
      {
        title:event.title,
        city: event.city,
        category:event.category,
        from_date:event.from_date,
        from_time:event.from_time,
        to_date:event.to_date,
        to_time:event.to_time,
        occurrence:event.occurrence,
        price:event.price,
        favourites_count:event.favourites_count,
        imageUrl:event.imageUrl,
        showInBanner:event.showInBanner,
        isFeatured:event.isFeatured,
        artists:event.artists,
        description:{
        about:event.about,
        venue:event.venue,
        terms:event.terms 
      }
      });
     // res.redirect(307, "/api/search-event")
    res.send("updated..!"+ event.title,);
     
  } catch (err) {
 
    console.log(`Update Error: ${err}`);
    
    res.redirect("/");
  
  }
});


//-------Remove event
app.post(`/delete-event`, async (req, res) => {

  console.log("inside /api/delete-event");
  
  const event = req.body;

  try {

    await EventsModel.findByIdAndRemove(event._id);

   // res.redirect("307, /api/search-event");
   res.send("deleted..!");
 
  } catch (err) {
    console.log(`Delete Error: ${err}`);
   // res.redirect("/");
   res.send("not deleted..its an error..!")
  
  }

});
//events api end here
/***********************************************************************************************/


/** --- Login API --- */
app.post('/login', async (req, res) => {

  console.log("inside /login");

  let event_user = req.body;

  try {
    
    //check if user is already registered
    let event_users = await EventUsersModel.find({email: event_user.email});
    //console.log(`Existing event_users: ${JSON.stringify(event_users)}`);

    // if user is not already registered
    if(event_users.length == 0) {
		   
      res.send({
        status: `failed`,
        message: `Invalid email or password`,
        email: event_user.email
      });
  
    }
    else {

      let passwordMatches = await isValidPassword(event_users[0].password, event_user.password) ;
		
      
      // if password does not match
      if(!passwordMatches) {
        //console.log('Incorrect Password');

        // send the response
        res.send({
          status: `failed`,
          message: `Incorrect Password`,
          email: event_user.email
        }); 

      }
      // if password matches
      else {

        // sign the jwt token
        token = jwt.sign({ email: event_user.email }, process.env.APP_SECRET);

		// Get user type
		let user_type = event_users[0].user_type;	
        // send the response
        res.send({
          status: `success`,
          message: `Logged in`,
          email: event_user.email,
          auth_token: token,
		  user_type:user_type
        });
  
      }


    }
    
  } catch (error) {

    console.log(`Event user Error: ${error}`);
    res.send("error");

  }
  
});



/** --- Signup/Registration API */
app.post('/signup',  async (req, res) => {

  console.log("inside /signup");
  
  const event_user = req.body;
  
  try {

    //check if user is already registered with same email
    let event_users = await EventUsersModel.find({email: event_user.email});
    //console.log(`Existing event_users: ${JSON.stringify(event_users)}`);
    
    // if user is not already registered
    if(event_users.length == 0)
    {
      // encrypt the password
      let passwordHash = await bcrypt.hash(event_user.password, 14);
      event_user.password = passwordHash;
      
      // build the mongoose schema
      const event_userSchema = new EventUsersModel(event_user);
 
      // register the user
      await event_userSchema.save();

      // sign the jwt token
      token = jwt.sign({ email: event_user.email }, process.env.APP_SECRET);
	 
   
      // send the response
      res.send({
        status: `success`,
        message: `registerd successfully`,
        email: event_user.email,
        auth_token: token,
		user_type:userType

      });
  
    }
    else // send the response
      res.send({
        status: `failed`,
        message: `Someone already registered with email: ${event_user.email}`,
        email: event_user.email
      })
 
  } catch (err) {
 
    //res.redirect("/");
    console.log(`Error occurred while signing up. Error: ${err}`);
    
    res.send(`Error occurred while signing up. Error: ${err}`);  
  }

});


/***********************************************************************************************/


/**----- Booked Events APIs : Starts Here ----- */

//----- Book an event ------
app.post('/book-event',  async (req, res) => {    

  try {

      // get the user token from the header
      let token = req.headers.authorization || '';

      let email = await authorizedUser(token)
      
      let users = await EventUsersModel.find({email});

      if(users.length == 0){

        res.send({
          status: `failed`,
          message: `Unauthorized. Access Denied.`
        });

      }
      else
      try {
           
        const event = req.body;
        //console.log(`Event: ${JSON.stringify(event)}`);
       
        event.email = email;

        const eventsSchema = new BookedEventsModel(event);
        
        await eventsSchema.save();
        
        // res.redirect(307, "/api/search-events");
        res.send({
          status: `success`,
          message: `Event booked with title ${event.title}`
        });
        
      } catch (error) {
        res.send({
          status: `failed`,
          message: `Error while booking event: ${error.message}`
        })
      }

  } catch (error) {

    res.send({
      status: `failed`,
      message: "Unauthorized. Please login."
    })

  }


});


//----- Search events booked by user ------
app.post('/search-booked-events',  async (req, res) => {    

  try {

      // get the user token from the header
      let token = req.headers.authorization || '';

      let email = await authorizedUser(token)
      
      let users = await EventUsersModel.find({email});

      if(users.length == 0){

        res.send({
          status: `failed`,
          message: `Unauthorized. Access Denied.`
        });

      }
      else
      try {
           
        let conditions = req.body || {};
        
        conditions.email = email;
        //console.log(`Conditions: ${JSON.stringify(conditions)}`);

        const events = await BookedEventsModel.find(conditions).sort({ title: 1 });

        res.send(events);
        
      } catch (error) {
        res.send({
          status: `failed`,
          message: `Error while searching events: ${error.message}`
        })
      }

  } catch (error) {

    res.send({
      status: `failed`,
      message: "Unauthorized. Please login."
    })

  }


});


/**----- Booked Events APIs : Ends Here ----- */


// --- connect to mongodb ---
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () => {
  console.log("Connected to mongoDB...");
});


// --- start the server ---
const PORT = process.env.PORT || 3002; 

app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}...`);
});



