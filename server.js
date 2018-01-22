const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const upload = multer({dest: './files'});
const PORT = 3000;
app.use(cors())

app.post('/posts', upload.any('input-file'), (req, res, next) => {
  console.log("Form received!");
  const respObj = (body, files) => {
    if (files === undefined) {
      return body
    }
    return {...body, files: [...files]}
  }
  res.send(respObj(req.body, req.files));
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
})
