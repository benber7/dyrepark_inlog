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
    saveUninitialized: false // Cookies settes ikke før endringer har blitt gjort på nettsiden
})) 

app.use(express.static(path.join(__dirname, "Public")));
app.use(express.urlencoded({extended: true}))
app.set("view engine", hbs);
app.set("views", path.join(__dirname, "./views/pages"))
hbs.registerPartials(path.join(__dirname, "./views/partials"))


// Dyrepark

// Dette er koden til registrerDyr.html formen
app.post("/settinn", (req, res) => {
    let svar = req.body
    settInnDyr(svar.navn, svar.fodselsdato, svar.vekt, svar.kjonn, svar.artID)
    res.redirect("back")
})

// Når du søker på http://localhost:3000/angi starter du denne koden
app.get("/angi", (req, res) => {
    // Jeg lager en variabel som inneholder henting av data fra databasen gondwana.db og henter ut alt fra tabellen dyr
    let dyr = dbDyr.prepare("SELECT * FROM dyr").all()
    let objekt = {dyr: dyr}
    // Hvis du er logget in blir du sendt til registrerDyr.html hvis ikke blir du sendt til login.html
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/Public/registrerDyr.html"))
    } else {
        res.sendFile(path.join(__dirname, "/Public/login.html"))
    } 
}) 

// Når du søker på http://localhost:3000/visdyr starter du denne koden
app.get("/visdyr", (req, res) => {
    // Jeg lager en variabel som inneholder henting av data fra databasen gondwana.db og henter ut alt fra tabellen dyr
    let dyr = dbDyr.prepare("SELECT * FROM dyr").all()
    let objekt = {dyr: dyr}
    res.render("dyr.hbs", objekt)
}) 

// Når du søker på http://localhost:3000/visart starter du denne koden
app.get("/visart", (req, res) => {
    let id = req.query.id
    /*  
        Lager en variabel som inneholder henting av data fra databasen gondwana.db og henter ut artene 
        dersom du skriver in id-en i URL-en feks http://localhost:3000/visart?id=2 
    */
    let art = dbDyr.prepare("SELECT * FROM art WHERE artID = ?").get(id)
    let objekt = {art: art}
    console.log(objekt)
    res.render("art.hbs", objekt)
})

//
app.get("/Endredyr", (req, res) => {
    res.render("endre.hbs")
})

// Dette skjører når du trykker på slett knappen på siden dyr.hbs
app.post("/Slettdyr", (req, res) => {
    let dyrid = req.body.dyrid;
    slettDyr(dyrid);
    res.redirect("back");
});

// Dette funskjonen blir kjørt i /settinn som legger in data i dyr tabellen
function settInnDyr(navn, fodselsdato, vekt, kjonn, artID) {
    let settInnDyr = dbDyr.prepare("INSERT INTO dyr (navn, fodselsdato, vekt, kjonn, artID) VALUES (?, ?, ?, ?, ?)")
    settInnDyr.run(navn, fodselsdato, vekt, kjonn, artID)
}

// Dette er funskjonen som blir kjørt i /Slettdyr, den setter in data i dyr tabellen
function slettDyr(dyrid) {
    let slettDyr = dbDyr.prepare("DELETE FROM dyr WHERE dyrid = ?");
    slettDyr.run(dyrid);
}
// Dyrepark




// Pålogging

//Disse to er veier til registrer og login siden, de her blir kjørt i knapper
app.get("/Public/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrer.html"))
})
app.get("/Public/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/login.html"))
})

// Dette er hovedsiden, du søker bare på http://localhost:3000/ og får opp en html side
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

// Dette blir kjørt i login.htm
app.post("/login", async (req, res) => {
    let login = req.body;
    // Henter ut data fra database.db, user
    let userData = dbFolk.prepare("SELECT * FROM user WHERE email = ?").get(login.email);
    
    if(await bcrypt.compare(login.password, userData.hash)) {
        req.session.loggedin = true
        res.redirect("/")
    } else {
        res.redirect("back")
    }
})

app.get("/logut", (req, res) => {
    req.session.loggedin = false;
    res.redirect("/");
});

app.get("/profil", (req, res) => {
    res.render("profil.hbs")
})

app.post("/slettBruker", (req, res) => {
    let id = req.body.id;
    Slettbruker(id);
    res.redirect("/");
});

// 
app.post(("/addUser"), async (req, res) => {
    let svar = req.body;

    let hash = await bcrypt.hash(svar.password, 10)
    console.log(svar)
    console.log(hash)

    dbFolk.prepare("INSERT INTO user (name, email, hash) VALUES (?, ?, ?)").run(svar.name, svar.email, hash)
    
    res.redirect("back")    
})

function Slettbruker(id) {
    let Slettbruker = dbFolk.prepare("DELETE FROM user WHERE id = ?");
    Slettbruker.run(id);
}
// Pålogging

app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})