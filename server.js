const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'hello',
    database : 'smartbrain'
  }
});

const app = express();

//import to parse data that the
//front end pushes into the back end into a JSON file using body-parser
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res)=> {
  //res.send('this is working');
  res.json(db.users);
})

app.post('/signin', (req, res)=> {
  const {email, password}=req.body;
  db.select('email', 'hash')
  .where({
    email: email
  })
  .from('login')
  .then(data =>{
    console.log(data);
    const ok = bcrypt.compareSync(password, data[0].hash);
    console.log(ok);
    if(ok){
      return db.select('*').from('users').where({email: email})
      .then(user=>{
        res.json(user[0])
      })
      .catch(err => res.status(400).json("Unable to get user!"))
    }else{
      res.status(400).json("Wrong Credentials!")
    }
  })
  .catch(err => res.status(400).json("Invalid Credentials!"))
})


app.post('/register', (req, res)=>{
  const {email, password, name} = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail =>{
      return trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0],
          name: name,
          joined: new Date()
        })
        .then(user => {
          res.json(user[0]);
        })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err=> res.status(400).json("Unable to register!!!"))
})

app.get('/profile/:id', (req, res) =>{
  const {id} =req.params;
  db.select('*').from('users')
  .where({id: id}).then(user => {
    if(user.length){
      res.json(user[0]);
    }else{
      console.log(user);
      res.status(400).json("Invalid Credentials!");
    }
  })
  .catch(err=> res.status(400).json("error!"))
})

app.put('/image', (req, res)=>{
  const {id} =req.body;
  db('users').where({
    id:  id
  })
  .increment('entries', 1)
  .returning('entries')
  .then(entries =>{
    res.json(entries[0]);
  })
  .catch(err=> res.status(400).json("uable to get entries!"))
})

app.listen(3000, ()=> {
  console.log('app is running on port 3000');
})

/*
/--> res = this isworking
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> usern
*/