const express = require("express");
const session = require("express-session");

const app = express();

app.use(session({
    secret: "Einlangstringsombørveretilfeldiggenerertoglagratdidotenv",
    resave: false,
    saveUninitialized: false //Ved false settes ikke cookie (med sessionID) før en evt gjør endringer i sesjonen
})) 

app.use(express.urlencoded({extended: true}))

// Eksempel for å vise når en cookie blir satt

app.get("", (req, res) => {
    console.log(req.session)
    if (req.session.visits == undefined) {
        req.session.visits = 1
    } else {
        req.session.visits++
    }
    
    res.send("Antall besøkende: " + req.session.visits)
})

app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})