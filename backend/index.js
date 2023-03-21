import mysql from 'mysql2';
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';
// import helmet from "helmet";

const app= express();
// app.use(helmet())
app.use(cookieParser())
app.use(express.json());
app.use(cors({ origin: true, credentials: true }))
// app.use(cors());

const ACCESS_TOKEN='bd7b4d83a3b6ca0947c799e08cd41955fd9b470eb444357310ac4e12ca973c371c611f433f6e53b1941f36be5f963acb8b67139a6a934858693fc4a67c4bd0ff';
const db= mysql.createConnection({
    host : "localhost",
    user :"root",
    password : "mysql@nam",
    database : "test",
})

app.get('/',(req,res)=>{
    res.json("hello, please login");
})
app.get("/books",(req,res)=>{
    const q= "SELECT * FROM books"
    db.query(q,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})
app.post("/books",(req,res)=>{
    const q= "INSERT INTO books (`name`, `desc`, `cover`,`price`) VALUES (?)";
    const values=[
        req.body.name,
        req.body.desc,
        req.body.cover,
        req.body.price,
    ];
    db.query(q, [values], (err,data)=>{
        if(err) return res.json(err);
        return res.json("Created");
    })
});
app.post("/register",(req,res)=>{
    const q= "INSERT INTO users (`username`, `email`, `password`) VALUES (?)";
    const hash=bcrypt.hashSync(req.body.password,10)
    const values=[
        req.body.username,
        req.body.email,
        hash,
    ];
    db.query(q, [values], (err,data)=>{
        if(err) return res.json(err);
        return res.json("User Created");
    })
});
app.post("/login",(req,res)=>{
    const q="SELECT * FROM users WHERE username=?";
    db.query(q, [req.body.username], (err,data)=>{
        if(err) return res.json(err);
        if(data.length===0) return res.status(404).json("user not found")
        if( !bcrypt.compare(req.body.password, data[0].password))
            res.send("not correct password")
        const token=jwt.sign({id:data[0].id},ACCESS_TOKEN);
        const {password, ...rest}=data[0];
        res.cookie('access_token', token, {httpOnly:true}).status(200).json(rest)
        // next();
    })
})

// app.delete("/books/:id",(req,res)=>{
//     const token=req.cookies.access_token;
//     console.log("token"+token);
//     const bookid=req.params.id;
//     const q= "DELETE FROM books WHERE id= ?"
//     db.query(q, [bookid],(err,data)=>{
//         if(err) return res.json(err);
//         return res.json("Book has been deleted");
//     });
// });

app.delete("/books/:id",(req,res)=>{
    const token=req.cookies.access_token;
    if(!token) return res.status(401).json("not authenticated to delete")
    jwt.verify(token,ACCESS_TOKEN,(err,user)=>{
        if(err)return res.json(403).json("not right token")
        const bookid=req.params.id;
        const q= "DELETE FROM books WHERE id= ?"
        db.query(q, [bookid],(err,data)=>{
            if(err) return res.json(err);
            return res.json("Book has been deleted"+data);
        })
    });
});
app.put("/books/:id",(req,res)=>{
    const bookid=req.params.id;
    const q= "UPDATE books SET `name`=?, `desc`=?,  `cover`=?, `price`=? WHERE id= ?";
    const values=[
        req.body.name,
        req.body.desc,
        req.body.cover,
        req.body.price,
    ];
    db.query(q, [...values, bookid],(err,data)=>{
        if(err) return res.json(err);
        return res.json("Book has been updated");
    });
});
app.get("/logout",(req,res)=>{
    // console.log("loggout")
    res.clearCookie("access_token",{path:'/', domain:'localhost'}).status(200).json("user has logged out");
    // res.clearCookie("access_token",{path:'/',sameSite:'none',}).status(200).json("logged out")
});
app.listen(8000,()=>{
    console.log('connected');
})