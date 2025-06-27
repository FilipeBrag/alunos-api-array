import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
app.use(bodyParser.json());

const SECRET = 'segredo_super_secreto';

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
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token não fornecido' });

  jwt.verify(token.replace('Bearer ', ''), SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.user = decoded;
    next();
  });
}


app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Usuário já existe' });
  }
  const passwordHash = bcrypt.hashSync(password, 8);
  users.push({ username, passwordHash });
  res.status(201).json({ message: 'Usuário registrado com sucesso' });
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ message: 'login  efetuado com sucesso', token });
});


app.get('/alunos', verifyToken, (req, res) => {
  res.json(alunos);
});


app.get('/alunos/:id', verifyToken, (req, res) => {
  const aluno = alunos.find(a => a.id === parseInt(req.params.id));
  if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado' });
  res.json(aluno);
});

app.get('/alunos/medias/todos', verifyToken, (req, res) => {
  const result = alunos.map(a => ({
    nome: a.nome,
    media: ((a.nota1 + a.nota2) / 2).toFixed(2)
  }));
  res.json(result);
});

app.get('/alunos/aprovados/todos', verifyToken, (req, res) => {
  const result = alunos.map(a => {
    const media = (a.nota1 + a.nota2) / 2;
    return {
      nome: a.nome,
      status: media >= 6 ? 'aprovado' : 'reprovado'
    };
  });
  res.json(result);
});

app.post('/alunos', verifyToken, (req, res) => {
  const { id, nome, ra, nota1, nota2 } = req.body;
  if (
    id === undefined || nome === undefined || ra === undefined ||
    nota1 === undefined || nota2 === undefined
  ) {
    return res.status(400).json({ message: 'Todos os campos (id, nome, ra, nota1, nota2) são obrigatórios' });
  }
  alunos.push({ id, nome, ra, nota1, nota2 });
  res.status(201).json({ message: 'Aluno adicionado com sucesso' });
});

app.put('/alunos/:id', verifyToken, (req, res) => {
  const index = alunos.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Aluno não encontrado' });
  alunos[index] = { ...alunos[index], ...req.body };
  res.json({ message: 'Aluno atualizado com sucesso' });
});


app.delete('/alunos/:id', verifyToken, (req, res) => {
  const index = alunos.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Aluno não encontrado' });
  alunos.splice(index, 1);
  res.json({ message: 'Aluno removido com sucesso' });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));