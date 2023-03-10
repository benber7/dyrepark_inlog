const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const dbDyr = require("better-sqlite3")("gondwana.db"); //{verbose: console.log}
const dbFolk = require("better-sqlite3")("brukere.db"); //{verbose: console.log}
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


// Dette er hovedsiden, du søker bare på http://localhost:3000/ og får opp en html side
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"))
})

// Koden for dyr delen av oppgaven

// Når du søker på http://localhost:3000/angi starter du denne koden
app.get("/angi", (req, res) => {
    // lager en variabel som inneholder henting av data fra databasen gondwana.db og henter ut alt fra tabellen dyr
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
    // lager en variabel som inneholder henting av data fra databasen gondwana.db og henter ut alt fra tabellen dyr
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

// Dette blir brukt på siden registrerDyr.html med <form action="/settinn" og den legger til data i dyr tabellen i gondwana.db
app.post("/settinn", (req, res) => {
    let svar = req.body
    settInnDyr(svar.navn, svar.fodselsdato, svar.vekt, svar.kjonn, svar.artID)
    res.redirect("back")
})

// Dette blir brukt på siden dyr.hbs med <form action="/Slettdyr" og den sletter dyr i tabellen dyr
app.post("/Slettdyr", (req, res) => {
    let dyrid = req.body.dyrid;
    slettDyr(dyrid);
    res.redirect("back");
});

// Dette blir brukt på siden dyr.hbs med <form action="/Endredyr" og den endrer dyren i dyr tabellen
app.post("/Endredyr", (req, res) => {
    let svar = req.body
    endreDyr(svar.navn, svar.vekt, svar.kjonn, svar.fodselsdato, svar.artID, svar.dyrid)
    res.redirect("back");
});

// Her er funksjonen som blir kjørt i app.post("/settinn"
function settInnDyr(navn, fodselsdato, vekt, kjonn, artID) {
    let settInnDyr = dbDyr.prepare("INSERT INTO dyr (navn, fodselsdato, vekt, kjonn, artID) VALUES (?, ?, ?, ?, ?)")
    settInnDyr.run(navn, fodselsdato, vekt, kjonn, artID)
}

// Her er funskjonen som blir kjørt i app.post("/Slettdyr"
function slettDyr(dyrid) {
    let slettDyr = dbDyr.prepare("DELETE FROM dyr WHERE dyrid = ?");
    slettDyr.run(dyrid);
}

// Her er funksjonen som blir kjørt i app.post("/Endredyr"
function endreDyr(navn, vekt, kjonn, fodselsdato, artID, dyrid) {
    let dyr = dbDyr.prepare("UPDATE dyr SET navn = ?, vekt = ?, kjonn = ?, fodselsdato = ?, artID = ? WHERE dyrid = ?");
    dyr.run(navn, vekt, kjonn, fodselsdato, artID, dyrid)
}



// Koden for bruker delen av oppgaven

//Disse to er veier til registrer og login siden, de er koblet til hver sin knapp i navbaren på de fleste sidene
app.get("/Public/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/registrer.html"))
})
app.get("/Public/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/Public/login.html"))
})

// Koden som kjører når du trykker på login 
app.post("/login", async (req, res) => {
    let login = req.body;
    // Henter ut data fra brukere.db, user
    let userData = dbFolk.prepare("SELECT * FROM user WHERE email = ?").get(login.email);
    
    // Her bruker jeg await for å gi bcrypt.compare nok til til å sammen ligne passordet du skrev inn med hashen som ligger i databasen
    if(await bcrypt.compare(login.password, userData.hash)) {
        // hvis passordet du skrev in er lik hashen blir du redirected til index.html og hvis de er ikke lik blir du redirected tilbake
        req.session.loggedin = true
        res.redirect("/")
    } else {
        res.redirect("back")
    }
})

// Når du tyrkker på logg ut kjører den her. Den gjør om din cookie session fra true til false og redirecter deg til index.html
app.get("/logut", (req, res) => {
    req.session.loggedin = false;
    res.redirect("/");
});

// Når du trykker på profil knappen kjører den her, den sender deg til profil.html hvis du er logget inn og hvis ikke den sender deg til login.html
app.get("/profil", (req, res) => {
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/Public/profil.html"))
    } else {
        res.sendFile(path.join(__dirname, "/Public/login.html"))
    }
})

/*
app.post("/slettBruker", (req, res) => {
});
*/

// Etter du har skrevet inn dine opplysninger og trykker på registrer
app.post(("/addUser"), async (req, res) => {
    // henter ut hva du har skrevet
    let svar = req.body;
    // omgjør passordet du skrev inn til hash
    let hash = await bcrypt.hash(svar.password, 10)
    //console.log(svar)
    //console.log(hash)
    // sender alt til database og der etter sender deg tilbake
    dbFolk.prepare("INSERT INTO user (name, email, hash) VALUES (?, ?, ?)").run(svar.name, svar.email, hash)
    res.redirect("back")    
})

/*
function Slettbruker(id) {
}
*/

app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})