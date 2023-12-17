const Sequelize = require('sequelize')
const sequelize = new Sequelize('lojinha', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',

})
sequelize.authenticate().then(function () {
    console.log("Conectado!!")
}).catch(function (erro) {
    console.log("Erro ao conectar: " + erro)
})

const Usuario = sequelize.define('usuario', {
    login: {
        type: Sequelize.STRING(15),
        unique: true,
        allowNull: false
    },
    nome: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    senha: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    perfil: {
        type: Sequelize.STRING(25),
        allowNull: false
    },
}, { timestamps: false, })

Usuario.sync()
module.exports = Usuario;