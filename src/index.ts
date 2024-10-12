import express, { Request, Response } from "express";
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

// Função para validar a força da senha
function validarSenha(senha: string): { valido: boolean; mensagem: string } {
    let temNumero = false;
    let temCaractereEspecial = false;
    const caracteresEspeciais = "!@#$%^&*()-_=+[]{}|;:',.<>?/";

    if (senha.length < 8) {
        return { valido: false, mensagem: "A senha deve ter pelo menos 8 caracteres." };
    }

    for (let char of senha) {
        if (!isNaN(Number(char))) {
            temNumero = true; // Verifica se é um número
        }
        if (caracteresEspeciais.includes(char)) {
            temCaractereEspecial = true; // Verifica se é um caractere especial
        }
    }

    if (!temNumero) {
        return { valido: false, mensagem: "A senha deve conter pelo menos um número." };
    }

    if (!temCaractereEspecial) {
        return { valido: false, mensagem: "A senha deve conter pelo menos um caractere especial." };
    }

    return { valido: true, mensagem: "" };
}

// Rota para exibir o formulário de adicionar usuário
app.get("/users/form", async function (req: Request, res: Response) {
    return res.render("users/form");
});

// Rota para salvar o usuário
app.post("/users/save", async function(req: Request, res: Response) {
    const { nome, email, papel, senha, confsenha, ativo } = req.body;

    // Validação da senha
    const resultadoValidadeSenha = validarSenha(senha);

    if (!resultadoValidadeSenha.valido) {
        return res.render("users/form", { error: resultadoValidadeSenha.mensagem });
    }

    if (senha !== confsenha) {
        return res.render("users/form", { error: "As senhas não coincidem." });
    }

    const ativoNum = ativo === 'on' ? 1 : 0; 
    const insertQuery = "INSERT INTO users (name, email, papel, senha, ativo) VALUES (?, ?, ?, ?, ?)";
    await connection.query(insertQuery, [nome, email, papel, senha, ativoNum]);

    res.redirect("/users");
});

// Rota para ver usuários
app.get('/users', async function (req: Request, res: Response) {
    const [rows] = await connection.query("SELECT * FROM users");
    return res.render('users/index', {
        users: rows
    });
});

// Rota de login
app.get("/users/login", async function (req: Request, res: Response) {
    res.render("users/login"); 
});

app.post("/users/login", async function(req: Request, res: Response) {
    const { email, senha } = req.body;
    const [rows]: any = await connection.query("SELECT * FROM users WHERE email = ? AND senha = ?", [email, senha]);

    if (rows.length > 0) {
        return res.redirect("/users/postagem");
    } else {
        return res.status(401).send("Email ou senha incorretos.");
    }
});

// Rota para exibir postagens
app.get("/users/postagem", async function(req: Request, res: Response) {
    const [posts] = await connection.query("SELECT titulo, nome FROM posts");
    
    // Renderiza a página de postagens com os posts recuperados
    return res.render('users/postagem', {
        posts: posts
    });
});

app.listen('3000', () => console.log("Server is listening on port 3000"));
