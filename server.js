const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const cors=require('cors');
const bcrypt=require('bcrypt-nodejs');
const knex=require('knex')({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
          },
    }
  })
app.use(bodyParser.json());
app.use(cors());
app.get('/',(req,res)=>{    
    res.json('server running')
})

app.get('/profile/:id',(req,res)=>{
const {id}=req.params;
knex.select('*').from('users').where({id:id})
.then(user=>{
if(user.length){
    res.json(user[0]);}
else{
    res.status(404).json('Not Found');
}
})
.catch(err=>res.status(400).json('Error'));
});
app.post('/signin',(req,res)=>{
    const {email,password}=req.body;
    knex.select('email','hash').from('login').where('email','=',email)
    .then(data=>{
        if(bcrypt.compareSync(password,data[0].hash))
        {
            return knex.select('id').from('users')
            .where('email','=',email)
            .then(user=>{
                res.json(user[0].id);
            })
            .catch(err=>res.status(400).json(-1));
        }
        else
        {
            res.status(400).json(-1);
        }
    })
    .catch(err=>res.status(400).json(-1));
});

app.post('/register',(req,res)=>{
    const {name,email,password}=req.body;
    const hash=bcrypt.hashSync(password);
    knex.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return trx('users')
                    .returning('*')
                    .insert({
                        email:loginEmail[0].email,
                        name:name,
                        joined:new Date()
                            })
                    .then(response=>{
                        res.json(response[0]);
                    })
        })
        .then(trx.commit)
        .catch(trx.rollback)
        })
        .catch(err=>res.status(400).json('Cannot Register'))
});

app.put('/image',(req,res)=>{
    const id=req.body.id;
    knex('users')
    .where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        if(entries.length){
        res.json(entries[0].entries);
        }
        else{
        res.status(400).json('unable to get entries')
        }
    })
    .catch(err=>{
        res.status(400).json('unable to get entries');
    });
});

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Listening to port ${process.env.PORT}`);
})
