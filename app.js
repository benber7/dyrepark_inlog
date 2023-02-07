const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const dbDyr = require("better-sqlite3")("gondwana.db", {verbose: console.log});
const dbFolk = require("better-sqlite3")("database.db")
const hbs = require("hbs");
const path = require("path");

const app = express();

app.use(session({
    secret: "detteherersjult",
    resave: false,
    saveUninitialized: false //Ved false settes ikke cookie (med sessionID) før en evt gjør endringer i sesjonen
})) 

app.use(express.static(path.join(__dirname, "Public")));
app.use(express.urlencoded({extended: true}))
app.set("view engine", hbs);
app.set("views", path.join(__dirname, "./views/pages"))
hbs.registerPartials(path.join(__dirname, "./views/partials"))


// Dyr kode start
app.post("/settinn", (req, res) => {
    //console.log(req.body)
    let svar = req.body
    settInnDyr(svar.navn, svar.fodselsdato, svar.vekt, svar.kjonn, svar.artID)
    res.redirect("back")
})

app.get("/angi", (req, res) => {
    let dyr = dbDyr.prepare("SELECT * FROM dyr").all()
    let objekt = {dyr: dyr}
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/Public/registrerDyr.html"))
    } else {
        res.sendFile(path.join(__dirname, "/Public/login.html"))
    } 
}) 

app.get("/visdyr", (req, res) => {
    let dyr = dbDyr.prepare("SELECT * FROM dyr").all()
    let objekt = {dyr: dyr}
    res.render("dyr.hbs", objekt)
}) 

app.get("/visart", (req, res) => {
    let id = req.query.id
    let art = dbDyr.prepare("SELECT * FROM art WHERE artID = ?").get(id)
    let objekt = {art: art}
    console.log(objekt)
    res.render("art.hbs", objekt)
})

app.post("/Slettdyr", (req, res) => {
    let dyrid = req.body.dyrid;
    slettDyr(dyrid);
    res.redirect("back");
});
app.post("/Updaterdyr", (req, res) => {
    let dyrid = req.body.dyrid;
    updaterDyr(dyrid);
    res.redirect("back");
});

function settInnDyr(navn, fodselsdato, vekt, kjonn, artID) {
    let settInnDyr = dbDyr.prepare("INSERT INTO dyr (navn, fodselsdato, vekt, kjonn, artID) VALUES (?, ?, ?, ?, ?)")
    settInnDyr.run(navn, fodselsdato, vekt, kjonn, artID)
}

function slettDyr(dyrid) {
    let slettDyr = dbDyr.prepare("DELETE FROM dyr WHERE dyrid = ?");
    slettDyr.run(dyrid);
}

function updaterDyr(dyrid) {
    let updaterDyr = dbDyr.prepare("")
    updaterDyr.run(dyrid);
}
// Dyr kode slutt




// Folk kode start
app.get("/Public/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrer.html"))
})
app.get("/Public/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/login.html"))
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
    /*
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/index.hbs"))
    } else {
        res.sendFile(path.join(__dirname, "/Public/login.html"))
    }  
    */  
})

app.post("/login", async (req, res) => {
    let login = req.body;

    let userData = dbFolk.prepare("SELECT * FROM user WHERE email = ?").get(login.email);
    
    if(await bcrypt.compare(login.password, userData.hash)) {
        req.session.loggedin = true
        res.redirect("/")
    } else {
        res.redirect("back")
    }
})

app.post(("/addUser"), async (req, res) => {
    let svar = req.body;

    let hash = await bcrypt.hash(svar.password, 10)
    console.log(svar)
    console.log(hash)

    dbFolk.prepare("INSERT INTO user (name, email, hash) VALUES (?, ?, ?)").run(svar.name, svar.email, hash)
    
    res.redirect("back")    
})
// Folk kode slutt

app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})