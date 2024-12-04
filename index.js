const express = require("express")
const cors = require("cors")
const bodyParser = require('body-parser');
const port = process.env.PORT || 2000

const app = express()
require('dotenv').config()
app.use(bodyParser.json());
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const documentController = require("./document/document.controller")
const attachmentController = require("./attachment/attachment.controller")

app.use("/document", documentController)
app.use("/attachment", attachmentController)

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});