import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

const SECRET = process.env.JWT_SECRET;

if(!SECRET){
  console.error("Erro: A variável de ambiente JWT_SECRET não está definida no arquivo .env");
  process.exit(1);
}

const users = [];

const alunos = [
  {
    id: 1,
    nome: "Filipe",
    ra: "000000",
    nota1: 10,
    nota2: 10
  },
  {
    id: 2,
    nome: "Fernando De riggi",
    ra: "101010",
    nota1: 1.5,
    nota2: 1.5
  }
];


function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const parts = authHeader.split(' ');
  let token;

  if(parts.length===2 && parts[0]=== 'Bearer'){
    token = parts[1];
  }else{
    return res.status(401).json({message: 'Formato de token inválido. Use "Bearer <token>".'});
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Acesso negado. Token expirado.' });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: 'Acesso negado. Token inválido.' });
            } else {
                return res.status(403).json({ message: 'Acesso negado. Erro na verificação do token.' });
            }
        }
        req.user = decoded;
        next(); 
  });
}


app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }
  const passwordHash = await bcrypt.hashSync(password, 10);
  users.push({ username, passwordHash });
  console.log("Usuários registrados atualmente:", users);
  res.status(201).json({ message: 'Usuário registrado com sucesso' });
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compareSync(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ message: 'login  efetuado com sucesso', token });
});


app.get('/alunos', verifyToken, (req, res) => {
  res.json(alunos);
});


app.get('/alunos/medias', verifyToken, (req, res) => {
  const result = alunos.map(a => ({
    nome: a.nome,
    media: ((a.nota1 + a.nota2) / 2).toFixed(2)
  }));
  res.json(result);
});

app.get('/alunos/aprovados', verifyToken, (req, res) => {
  const result = alunos.map(a => {
    const media = (a.nota1 + a.nota2) / 2;
    return {
      nome: a.nome,
      status: media >= 6 ? 'aprovado' : 'reprovado'
    };
  });
  res.json(result);
});

app.get('/alunos/:id', verifyToken, (req, res) => {
  const aluno = alunos.find(a => a.id === parseInt(req.params.id));
  if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado' });
  res.json(aluno);
});


app.post('/alunos', verifyToken, (req, res) => {
  const { id, nome, ra, nota1, nota2 } = req.body;
  if (
    id === undefined || nome === undefined || ra === undefined ||
    nota1 === undefined || nota2 === undefined
  ) {
    return res.status(400).json({ message: 'Todos os campos (id, nome, ra, nota1, nota2) são obrigatórios' });
  }
  if (alunos.some(a => a.id === id)) {
        return res.status(409).json({ message: 'Aluno com este ID já existe.' });
  }
  alunos.push({ id, nome, ra, nota1, nota2 });
  console.log("Alunos atualmente cadastrados:", alunos);
  res.status(201).json({ message: 'Aluno adicionado com sucesso' });
});

app.put('/alunos/:id', verifyToken, (req, res) => {
  const index = alunos.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Aluno não encontrado' });
  alunos[index] = { ...alunos[index], ...req.body };
  console.log("Aluno atualizado:", alunos[index]); 
  res.json({ message: 'Aluno atualizado com sucesso' });
});


app.delete('/alunos/:id', verifyToken, (req, res) => {
  const index = alunos.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Aluno não encontrado' });
  alunos.splice(index, 1);
  console.log("Alunos restantes após exclusão:", alunos);
  res.json({ message: 'Aluno removido com sucesso' });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));