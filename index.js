require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();

let url = process.env.MONGO_URL;

Mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.log("Error connecting to the database");
    console.log(err);
  });

app.use(bodyParser.urlencoded({ extended: false }));

let urlSchema = new Mongoose.Schema({
  original_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: Number,
    required: true,
  },
});

let urlObj = Mongoose.model("urlObj", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const urlFormat = new RegExp(/^(http|https):\/\/[^\s$.?#].[^\s]*$/i);
  if (!urlFormat.test(req.body.url)) {
    res.json({ error: "invalid url" });
    return;
  } else {
    urlObj
      .find({ original_url: req.body.url })
      .then((data) => {
        if (data.length == 1) {
          res.json({
            original_url: data[0].original_url,
            short_url: data[0].short_url,
          });
        } else {
          let url = req.body.url;
          let short_url = Math.floor(Math.random() * 1000);
          let creatUrlObj = new urlObj({
            original_url: url,
            short_url: short_url,
          });
          creatUrlObj
            .save()
            .then((data) => {
              res.json({
                original_url: data.original_url,
                short_url: data.short_url,
              });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/api/shorturl/:short_url?", (req, res) => {
  let short_url = req.params.short_url;
  urlObj.find({ short_url: short_url }).then((data) => {
    if (data.length == 1) {
      res.redirect(data[0].original_url);
    } else {
      res.json({ error: "No short url found for the given input" });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
