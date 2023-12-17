const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const PORT = 3000;

const { Op } = require('sequelize');
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

var urlencodedParser = bodyParser.urlencoded({
    extended:
        false
});

const uuid = require('uuid');
const session = require('express-session');
const bcrypt = require('bcrypt'); //Criptografia
const saltRounds = 10;

app.use(session(({
    secret: '2C44-1T58-WFpQ350',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000 * 2
    }
})));

const Usuario = require('./model/usuario');
const Produto = require('./model/produto');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/busca', (req, res) => {
    res.render('buscaProdutos');
});

app.get('/entrar', (req, res) => {
    res.render('login');
});

app.get('/cadastraProduto', (req, res) => {
    if (!req.session.userid) {
        res.status(401).send("Não tem permissão para acessar esta página! Realize o login.");
    } else {
        res.render('cadastraProduto', { nome: req.session.name });
    }
});

app.post('/insereProdutos', urlencodedParser, (req, res) => {

    var codigoProduto = req.body.codigo;
    var nomeProduto = req.body.nome;
    var precoProduto = req.body.preco;
    var marcaProduto = req.body.marca;


    var produto = Produto.create({
        codigo: codigoProduto,
        nome: nomeProduto,
        preco: precoProduto,
        marca: marcaProduto
    }).then(function () {
        res.send("Produto inserido com sucesso!")
    }).catch(function (erro) {
        res.send("Erro ao inserir produto: " + erro)
    })

});

app.get('/alteraProduto', (req, res) => {

    var idProduto = req.query.id;

    Produto.findOne({
        where: { id: idProduto }
    }).then(function (produto) {
        console.log(produto)

        var formulario = "<form action='/updateProduto' method='post'>";
        formulario += "<input type = 'hidden' name='id' value='" + produto.id + "'>";
        formulario += "Código do Produto: <input type='text' name='codigo' id='codigo' value='" + produto.codigo + "'><br>";
        formulario += "Nome do Produto: <input type='text' name='nome' id='nome' value='" + produto.nome + "'> <br>"
        formulario += "Preço: <input type='text' name='preco' id='preco' value='" + produto.preco + "'> <br> "
        formulario += "Marca: <input type='text' name='marca' id='marca' value='" + produto.marca + "'> <br> "
        formulario += "<input type='submit' value='Cadastrar'>"
        formulario += "</form>";

        res.send("<br> Veja nossos produtos</br><br>" + formulario)


    }).catch(function (erro) {
        console.log("Erro na consulta: " + erro)
    })

})

app.get('/excluiProduto', (req, res) => {

    var idProduto = req.query.id;

    Produto.destroy({
        where: {
            id: idProduto
        }
    }).then(function () {

        res.send("<br> Produto excluído com sucesso!</br>")


    }).catch(function (erro) {
        console.log("Erro na exclusão." + erro)
        res.send("Erro na exclusão." + erro)
    })

});

app.post("/updateProduto", urlencodedParser, (req, res) => {

    var idProduto = req.body.id;
    var codigoProduto = req.body.codigo;
    var nomeProduto = req.body.nome;
    var precoProduto = req.body.preco;
    var marcaProduto = req.body.marca;
    Produto.update(
        {
            codigo: codigoProduto,
            nome: nomeProduto,
            preco: precoProduto,
            marca: marcaProduto
        },
        {
            where: {
                id: idProduto
            }
        }
    ).then(function (produto) {
        res.send("<br>Produto alterado</br>")
    }).catch(function (erro) {
        res.send("<br>Erro ao alterar </br>")
    })
})

app.post('/produtos', urlencodedParser, (req, res) => {

    var nomeFiltro = req.body.nomeFiltro;
    var marcaFiltro = req.body.marcaFiltro;
    var todosProdutos = "";
    nomeFiltro = '%' + nomeFiltro + '%';
    marcaFiltro = '%' + marcaFiltro + '%';

    Produto.findAll({
        where: { nome: { [Op.like]: nomeFiltro }, marca: { [Op.like]: marcaFiltro } }
    }).then(function (produtos) {
        console.log(produtos)


        res.render('resultadoBusca', { produtos: produtos });


    }).catch(function (erro) {
        console.log("Erro na consulta: " + erro)
    })



});

app.post('/sigin', urlencodedParser, async (req, res) => {
    var nomeUsuario = req.body.login;
    var senha = req.body.senha;
    Usuario.findOne({
        attributes: ['id', 'login', 'senha', 'nome'],
        where: {
            login: nomeUsuario
        }
    }).then(async function (usuario) {
        if (usuario != null) {
            const senha_valida = await //await serve para fazer o código "esperar" em funções assíncronas.
                bcrypt.compare(req.body.senha, usuario.senha) //descriptografando a senha.
            if (senha_valida) {
                req.session.userid = usuario.id;
                req.session.name = usuario.nome;
                req.session.login = usuario.login;
                res.redirect("/");
            } else {
                res.send("Senha não corresponde!")
            }
        } else {
            res.send("Usuário não encontrado!")
        }
    }).catch(function (erro) {
        res.send("Erro ao realizar login: " + erro)
    })
});

//Inserção de usuário.
app.get('/cadastraUsuario', (req, res) => {
    res.render('cadastraUsuario');
});

app.post('/insereUsuario', urlencodedParser, async (req, res) => {

    var loginUsuario = req.body.login;
    var nomeUsuario = req.body.nome;
    var senhaUsuario = req.body.senha;
    var perfilUsuario = req.body.perfil;

    const senha = await bcrypt.hash(senhaUsuario, saltRounds)

    var usuario = Usuario.create({
        login: loginUsuario,
        nome: nomeUsuario,
        senha: senha,
        perfil: perfilUsuario

    }).then(async function () {
        res.send("Usuário inserido com sucesso!")
    }).catch(function (erro) {
        res.send("Erro ao inserir cadastro: " + erro)
    })

});

//Busca de usuário.
app.get('/buscaUser', (req, res) => {
    res.render('buscaUsuarios');
});

app.post('/usuariosCadastrados', urlencodedParser, (req, res) => {

    var nomeUsuario = req.body.nomeUsuario;
    var todosCadastrados = "";
    nomeUsuario = '%' + nomeUsuario + '%';

    Usuario.findAll({
        where: { nome: { [Op.like]: nomeUsuario } }
    }).then(function (cadastrados) {
        console.log(cadastrados)


        res.render('resultadoBuscaUsuario', { cadastrados: cadastrados });


    }).catch(function (erro) {
        console.log("Erro na consulta: " + erro)
    })



});

//Alteração de dados do usuário(Recebendo as alterações via formulário)1/2.
app.get('/alteraUsuario', (req, res) => {

    var idUsuario = req.query.id;

    Usuario.findOne({
        where: { id: idUsuario }
    }).then(function (usuario) {
        console.log(usuario)

        var formulario = "<form action='/updateUsuario' method='post'>";
        formulario += "<input type = 'hidden' name='id' value='" + usuario.id + "'>";
        formulario += "Login do usuário: <input type='text' name='login' id='login' value='" + usuario.login + "'><br>";
        formulario += "Nome do usuário: <input type='text' name='nome' id='nome' value='" + usuario.nome + "'> <br>"
        formulario += "Senha: <input type='text' name='senha' id='senha' value='" + usuario.senha + "'> <br> "
        formulario += "Perfil: <input type='text' name='perfil' id='perfil' value='" + usuario.perfil + "'> <br> "
        formulario += "<input type='submit' value='Cadastrar'>"
        formulario += "</form>";

        res.send("<br> Veja seus dados</br><br>" + formulario)


    }).catch(function (erro) {
        console.log("Erro na consulta: " + erro)
    })

})

//Exclusão de dados do usuário.
app.get('/excluiUsuario', (req, res) => {

    var idUsuario = req.query.id;

    Usuario.destroy({
        where: {
            id: idUsuario
        }
    }).then(function () {

        res.send("<br> Usuário excluído com sucesso!</br>")


    }).catch(function (erro) {
        console.log("Erro na exclusão." + erro)
        res.send("Erro na exclusão." + erro)
    })

});

//Alteração de dados do usuário(Recebendo as alterações via formulário)2/2.
app.post("/updateUsuario", urlencodedParser, async(req, res) => {

    var idUsuario = req.body.id;
    var loginUsuario = req.body.login;
    var nomeUsuario = req.body.nome;
    var senhaUsuario = req.body.senha;
    var perfilUsuario = req.body.perfil;

    const senha = await bcrypt.hash(senhaUsuario, saltRounds)

    Usuario.update(
        {
            login: loginUsuario,
            nome: nomeUsuario,
            senha: senha,
            perfil: perfilUsuario
        },
        {
            where: {
                id: idUsuario
            }
        }
    ).then(async function (usuario) {
        res.send("<br>Usuário alterado</br>")
    }).catch(function (erro) {
        res.send("<br>Erro ao alterar </br>" +erro)
    })
})

app.listen(PORT, () => {
    console.log("http://localhost:" + 3000);
});

