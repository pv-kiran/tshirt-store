const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;


// middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/' , (req,res) => {
   res.send('Hello');
})

app.listen(PORT , () => {
    console.log(`Server is listening at ${PORT}`)
})