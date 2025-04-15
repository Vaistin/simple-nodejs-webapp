const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));

//Setting up Oracle
const actors = require('./actor_table.json');
const oracledb = require('oracledb');

const dbConfig = {
    user: 'your_user',
    password: 'your_password',
    connectString: 'localhost:your_port',
    privilege: oracledb.SYSDBA
};

//Setting up passport
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    {
        username: 'username',
        password: 'password'
    },
    async (username, password, done) => {
        try{
            const user = await get_User(username);
            if(user == null)
                return done(null, false, {message: 'Incorrect username'});
            if(user.password != password)
                return done(null, false, {message: 'Incorrect password'});
            return done(null, user);
        }
        catch(err){
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, user.username);
    })
})

passport.deserializeUser((username, done) => {
    process.nextTick(async () => {
        const user = await get_User(username);
        return done(null, user);
    })
})

app.use(session({
    secret:'your_secret',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

//Routes that don't require authentication

app.get('/', (req, res) => {
    res.redirect('/login')
})

app.get('/login', (req, res) => {
    res.render('Users/login.ejs')
})

app.get('/sign_up', (req, res) => {
    res.render('Users/signup.ejs', {error: ''})
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
}), (req, res) =>{
    console.log(req.user, ' ', req.isAuthenticated())
    res.redirect('/Read/JSON')
})

app.get('/sign_up_req', async (req, res) => {
    const user = await get_User(req.query.username)
    if(user == null)
    {
        const command = `BEGIN insert_user(:username_, :password_); END;`;
        const username = req.query.username;
        const password = req.query.password;
        const parameters = [username, password];
        execute_oracledb_command(command, parameters, ()=>{console.log('Created user:', username)});
        req.logIn({username: username, password: password}, ()=>{res.redirect('/Read/SQL')})
    }
    else
    {
        res.render('Users/signup.ejs', {error:'Username already in use, try another.'})
    }
})

app.get('/logout', (req, res) => {
    req.logOut(() => {
        res.redirect('/login')
    });
})

const checkAuthenticated = function (req, res, next){
    if(req.isAuthenticated())
        return next();
    console.log('not authenticated')
    res.redirect('/login')
}

const checkAuthorized = function (req, res, next){
    if(req.user.access_level === 'Admin')
        return next();
    console.log(req.user.username, 'not authorized')
    res.redirect('/login')
}

//Sets up middleware to make all subsequent routs accessible only to authenticated users
app.use(checkAuthenticated)


//Serving SQL and JSON data

app.get('/api/actors', (req, res) =>{
    res.json(actors)
});

app.get('/api/actorsSQL', (req, res)=>{
    const command = 'select * from Actor order by ActorID';
    execute_oracledb_command(command, [], (result)=>{
        const jsonArray = [];
        result.rows.forEach(element => {
            const actor ={
                "ActorID": element[0],
                "FirstName": element[1],
                "LastName": element[2],
                "Gender": element[3],
                "Oscar": element[4]
            }
            jsonArray.push(actor);
        })
        res.json(jsonArray);
    })
})

app.get('/api/oscarsByAward', (req, res)=>{
    command = 
    `SELECT o.Award, count(*)
    FROM Oscar o
    group by o.Award`;
    execute_oracledb_command(command, [], (result) => {
        const jsonArray = [];
        result.rows.forEach(row => {
            const data = {
                Award: row[0],
                Count: row[1]
            }
            jsonArray.push(data);
        });
        res.json(jsonArray);
    })
})

app.get('/api/oscarsPer5Years', (req,res) => {
    const command = 
    `SELECT o.Year_Recieved, count(*)
    FROM Oscar o
    GROUP BY o.Year_Recieved
    ORDER BY o.Year_Recieved`;

    execute_oracledb_command(command, [], (result)=>{
        // Find the first year_point (rounding down to devisible by 5)
        const minPoint = result.rows[0][0] - result.rows[0][0] % 5; 
        const maxPoint = result.rows[result.rows.length-1][0] - result.rows[result.rows.length-1][0] % 5;
        const year_points = [];
        for(let i=minPoint; i<=maxPoint; i+=5){
            year_points.push({
                "Year": i,
                "OscarNum": 0
            })
        }
        result.rows.forEach(row => {
            const year = row[0] - row[0] % 5;
            const oscarNum = row[1];
            year_points[(year - minPoint) / 5]["OscarNum"] += oscarNum;
        });
        res.json(year_points);
    })
})

app.get('/api/oscars', (req,res)=>{
    const command = `SELECT * FROM Oscar ORDER BY ActorID, Year_recieved`;
    execute_oracledb_command(command, [], (result) => {
        const oscars = []
        result.rows.forEach(row =>{
            const oscar ={
                "ActorID": row[0],
                "Year_recieved": row[1],
                "Award": row[2]
            }
            oscars.push(oscar);
        })
        res.json(oscars)
    })
})

app.get('/api/actors_oscars', (req,res)=>{
    const command = 
    `SELECT a.ActorID, a.FirstName, a.LastName, a.Gender, a.Oscar, o.Year_recieved, o.Award
    FROM Actor a LEFT JOIN Oscar o ON a.ActorID=o.ActorID
    ORDER BY a.ActorID`;
    execute_oracledb_command(command, [], (result) => {
        const actors_oscars = [];
        result.rows.forEach(row => {
            const actor_oscar = {
                ActorID: row[0],
                FirstName: row[1],
                LastName: row[2],
                Gender: row[3],
                Oscar: row[4],
                Year_recieved: row[5],
                Award: row[6]
            }
            actors_oscars.push(actor_oscar);
        });
        res.json(actors_oscars);
    })
})

app.get('/api/users_search', (req, res) => {
    if(req.user.access_level !== 'Admin')
    {
        req.logOut()
        res.redirect('/login')
    }
    const command =
    `SELECT username_, access_level_
    FROM Users_CRUD`
    const parameters = [];
    execute_oracledb_command(command, parameters, (result) => {
        const users = [];
        result.rows.forEach(row => {
            const user = {
                username: row[0],
                access_level: row[1]
            }
            users.push(user);
        });
        res.json(users)
    })
})

app.get('/api/user/:username', async (req, res)=> {
    const username = req.params.username;
    const user = await get_User(username);
    res.json(user)
})
    

//POST requests

app.post('/edit', (req,res) =>{
    const actor_submited = {
        "ActorID": parseInt(req.body.ActorIDInputed),
        "FirstName": req.body.FirstName,
        "LastName": req.body.LastName,
        "Gender": req.body.Gender,
        "Oscar": parseInt(req.body.Oscar)
    }
    if(req.body.DataSource==='SQL')
    {
        
        const command = `BEGIN update_Actor(:ActorID, :FirstName, :LastName, :Gender, :Oscar); END; `;
        const arguments = {
            ActorID: actor_submited["ActorID"], 
            FirstName: actor_submited["FirstName"],
            LastName: actor_submited["LastName"],
            Gender: actor_submited["Gender"],
            Oscar: actor_submited["Oscar"]
        };
        execute_oracledb_command(command, arguments, (result)=>{});
        res.redirect('/Read/SQL');
    }
    else
    {
        write_json_data((data)=>{
            const jsonArray = JSON.parse(data);
            for(let [i, actor] of jsonArray.entries()){
                if(actor.ActorID===actor_submited.ActorID){
                    jsonArray[i]=actor_submited;
                    break;
                }
            }
            return JSON.stringify(jsonArray, null, 2);
        })
        res.redirect('/Read/JSON')
    }
})

app.post('/submit', (req, res)=>{
    const actor_submited = {
        "ActorID": parseInt(req.body.ActorID),
        "FirstName": req.body.FirstName,
        "LastName": req.body.LastName,
        "Gender": req.body.Gender,
        "Oscar": parseInt(req.body.Oscar)
    }
    
    if(req.body.DataSource==='SQL'){
        const command = `BEGIN insert_Actor(:ActorID, :FirstName, :LastName, :Gender, :Oscar); END; `
        const parameters = {
            ActorID: actor_submited["ActorID"], 
            FirstName: actor_submited["FirstName"],
            LastName: actor_submited["LastName"],
            Gender: actor_submited["Gender"],
            Oscar: actor_submited["Oscar"]
        };
        execute_oracledb_command(command, parameters, (result)=>{});
        res.redirect('/Read/SQL');
    }
    else{
        write_json_data((data)=>{
            const jsonArray = JSON.parse(data);
            jsonArray.splice(actor_submited["ActorID"]-1, 0, actor_submited)
            return JSON.stringify(jsonArray, null, 2);
        })
        res.redirect('/Read/JSON');
    }
})

app.post('/delete', (req,res)=>{
    const id_to_delete = parseInt(req.body.id_to_delete);
    const DataSource = req.body.DataSource;
    if(DataSource==='SQL')
    {
        const command = `BEGIN delete_Actor(:id_to_delete); END;`;
        execute_oracledb_command(command, [id_to_delete], (result) =>{})
        res.redirect('/Read/SQL');
    }
    else
    {
        console.log('Usao u json delete')
        write_json_data((data) => {
            let jsonArray = JSON.parse(data);
            for(let [i, actor] of jsonArray.entries())
                if(actor.ActorID===id_to_delete){
                    jsonArray.splice(i, 1);
                    break;
                }
            return JSON.stringify(jsonArray, null, 2);
        })
        res.redirect('/Read/JSON');
    }
})

app.post('/promote_user', (req,res) => {
    const username_inputed = req.body.search_bar;
    const command = `BEGIN promote_user(:username); END;`
    const parameters = [username_inputed];
    execute_oracledb_command(command, parameters, ()=>{console.log('Promoted user:', username_inputed)});
    res.redirect('/ManageUsers')
})

app.post('/remove_user', (req,res) => {
    const username_inputed = req.body.username;
    console.log(req.body.username)
    const command = `BEGIN remove_user(:username); END;`
    const parameters = [username_inputed];

    execute_oracledb_command(command, parameters, ()=>{
        console.log('Deleted user: ', username_inputed)
    });
    
    res.redirect('/ManageUsers')
})


//Serving js and css

app.get('/public/js/functions.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'functions.js'));
});

app.get('/public/js/validation.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'validation.js'));
});

app.get('/public/js/line.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'line.js'));
});

app.get('/public/js/pie.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'pie.js'));
});

app.get('/public/js/manage.js', (req, res) => {
    if(req.user.access_level !== 'Admin')
    {
        req.logOut()
        res.redirect('/login')
    }
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'js', 'manage.js'));
})

app.get('/public/css/common.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'public', 'css', 'common.css'));
});

app.get('/style.css/:my_path', (req,res) =>{
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'views', req.params.my_path, 'style.css'));
})


//Serving html (GET requests)
//Routes that require only authentication

app.get('/Read/:DataSource', (req, res) => {
    const DataSource = req.params.DataSource;
    res.render('Read/index.ejs', { title: 'Read', DataSource: DataSource, my_path: 'Read', head: req.user.access_level});
});

//Charts

app.get('/PieChart', (req, res)=>{
    res.render('Charts/pie.ejs', {title: 'Pie Chart', my_path: 'Charts', head: req.user.access_level})
})

app.get('/LineChart', (req, res)=>{
    res.render('Charts/line.ejs',{title: 'Line Chart', my_path: 'Charts', head: req.user.access_level})
})

//Filters

app.get('/Actor_filter', (req, res)=>{
    res.render('Filters/actor.ejs', {title: 'Filter actors', my_path: 'Filters', head: req.user.access_level})
})

app.get('/Oscar_filter', (req, res)=>{
    res.render('Filters/oscar.ejs', {title: 'Filter oscars', my_path: 'Filters', head: req.user.access_level})
})

app.get('/Oscars_by_actor', (req, res)=>{
    res.render('Filters/oscars_by_actor.ejs', {title: 'Oscars by actor', my_path: 'Filters', head: req.user.access_level})
})

app.get('/Actors_by_oscar', (req, res)=>{
    res.render('Filters/actors_by_oscar.ejs', {title: 'Actors_by_oscar', my_path: 'Filters', head: req.user.access_level})
})

app.get('/Combined_search', (req, res)=>{
    res.render('Filters/combined_search.ejs', {title: 'Combined search', my_path: 'Filters', head: req.user.access_level})
})

//Routes that require authorization
app.use(checkAuthorized)

app.get('/Create/:DataSource', (req, res) => {
    const DataSource = req.params.DataSource;
    counterFunction(DataSource, (counter) => {
        if (counter==0) 
            return;
        res.render('Create/index.ejs', { title: 'Create', actorID: counter , DataSource: DataSource, my_path: 'Create'});
    });
});

app.get('/Update/:DataSource', (req, res) => {
    const DataSource = req.params.DataSource;
    res.render('Update/index.ejs', { title: 'Update', DataSource:DataSource, my_path: 'Update'});
});

app.get('/edit_request', (req,res)=>{
    const id_to_edit = req.query.id_to_edit;
    const DataSource = req.query.DataSource;
    res.render('Update/larger_form',{title: 'Edit', id: id_to_edit, DataSource:DataSource, my_path: 'Update'})
})

app.get('/Delete/:DataSource', (req, res) => {
    const DataSource = req.params.DataSource;
    res.render('Delete/index.ejs', { title: 'Delete', DataSource:DataSource, my_path:'Delete'});
});

app.get('/ManageUsers', (req, res) => {
    res.render('Users/manage.ejs', {title: 'Manage users', my_path: 'Users'})
})

app.listen(PORT, () => {
    console.log('we\'re in business');
});

//Functions

function execute_oracledb_command(command, command_arguments, callback){
    oracledb.getConnection(dbConfig, (err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err.message);
            return;
        }
        connection.execute(command, command_arguments, (err, result) => {
            if (err) {
                console.error('Error executing command:', command, '\nError: ', err.message);
                return;
            }
            callback(result);
        });
        connection.release((err) => {
            if (err) {
                console.error('Error releasing the connection:', err.message);
            }
        });
    });
}

function write_json_data(callback){
    fs.readFile('./actor_table.json', 'utf8', (err, data)=>{
        if(err){
            console.log('Error reading file: ', err)
            return;
        }
        try{
            //Callback returns na updated JSON array if the user wishes to write something in the file
            //If not, callback must return null
            updatedJSONArray = callback(data);
            if(updatedJSONArray != null)
            {
                fs.writeFile('./actor_table.json', updatedJSONArray, 'utf8', (err)=>{
                    if(err)
                        console.log("Error writting file: ", err);
                })
            }
        }
        catch(err){
            console.log('Error parsing JSON: ', err)
        }
    })
}

function counterFunction(DataSource, callback){
    let counter=0;
    if(DataSource==='SQL'){
        const command = 'select min(ActorID+1) from Actor where ActorID+1 not in (select ActorID from Actor)';
        execute_oracledb_command(command, [], (result)=>{
            counter=result.rows[0][0];
            callback(counter);
        })
    }
    else{
        write_json_data((data) => {
            let jsonArray = JSON.parse(data);
            let i=0
            for(i=0; i<jsonArray.length; i++)
            {
                if(jsonArray[i].ActorID!==i+1)
                {
                    counter=i+1;
                    break;
                }
            }
            if(i===jsonArray.length)
                counter=i+1;
            callback(counter);
            return null;
        })
    }   
}

async function get_User(username_) {
    return new Promise((resolve, reject) => {
        const command = `SELECT * FROM Users_CRUD WHERE username_=:username_`
        execute_oracledb_command(command, [username_], (result) => {
            if (result.rows.length == 1) {
                const user = {
                    "username": result.rows[0][0],
                    "password": result.rows[0][1],
                    "access_level": result.rows[0][2]
                };
                resolve(user);
            } else {
                resolve(null);
            }
        });
    });
}

//Admin functions

function insert_user(username_, password_,){
    const command = `BEGIN insert_user(:username_, :password_); END;`
    const parameters = [username_, password_, access_level];
    execute_oracledb_command(command, parameters, ()=>{console.log('Created user:', username_)});
}

function delete_user(username_){
    const command = `BEGIN delete_user(:username_); END;`
    const parameters = [username_]
    execute_oracledb_command(command, parameters, ()=>{console.log('Deleted user: ', username_)});
}

async function promote_user(){
    try{
        console.log(document.getElementById('search_bar').value);
        const command = `BEGIN promote_user(:username); END;`
        const parameters = [username];
        execute_oracledb_command(command, parameters, ()=>{console.log('Promoted user:', username)});
    }
    catch(err){
        console.log(err)
        return;
    }
}