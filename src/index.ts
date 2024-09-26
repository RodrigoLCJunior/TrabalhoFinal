import express, {Request, Response} from "express";
import mysql from "mysql2/promise";

const app = express();

// Configura EJS como a engine de renderização de templates
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);

const connection = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "mudar123",
    database: "unicesumar"
});

// Middleware para permitir dados no formato JSON
app.use(express.json());
// Middleware para permitir dados no formato URLENCODED
app.use(express.urlencoded({ extended: true }));

app.get('/users', async function (req: Request, res: Response) {
    const [rows] = await connection.query("SELECT * FROM users");
    return res.render('users/index', {
        users: rows
    });
});

app.get("/users/form", async function (req: Request, res: Response) {
    return res.render("users/form");
});

app.post("/users/save", async function(req: Request, res: Response) {
    const body = req.body;
    const ativo = body.ativo === 'on' ? 1 : 0; 

    if (body.senha !== body.confsenha) {
        return res.render("users/form", { error: "As senhas não coincidem." });
    }

    const insertQuery = "INSERT INTO users (name, email, papel, senha, ativo) VALUES (?, ?, ?, ?, ?)";
    await connection.query(insertQuery, [body.nome, body.email, body.papel, body.senha, ativo]);

    res.redirect("/users");
});

app.post("/users/delete/:id", async function (req: Request, res: Response) {
    const id = req.params.id;
    const sqlDelete = "DELETE FROM users WHERE id = ?";
    await connection.query(sqlDelete, [id]);

    res.redirect("/users");
});

app.get("/users/login", async function (req: Request, res: Response) {
    res.render("users/login"); 
});

app.post("/users/login", async function(req: Request, res: Response) {
    const {email, senha} = req.body;
    const [rows]: any = await connection.query("SELECT * FROM users WHERE email = ? AND senha = ?", [email, senha]);

    if (rows.length > 0) {
        return res.redirect("/users");
    } else {
        return res.status(401).send("Email ou senha incorretos.");
    }
});

app.get("/users/postagem", async function(req: Request, res: Response) {
    res.render("users/postagem");
    
});


app.listen('3000', () => console.log("Server is listening on port 3000"));
