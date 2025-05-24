console.log('login.js carregado');
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');

    if ((username === 'adm' && password === '123') ||
        (username === 'inspetor1' && password === 'senha1') ||
        (username === 'inspetor2' && password === 'senha2') ||
        (username === 'inspetor3' && password === 'senha3') ||
        (username === 'inspetor4' && password === 'senha4') ||
        (username === 'inspetor5' && password === 'senha5') ||
        (username === 'inspetor6' && password === 'senha6')) {

        loggedInUser = username; // Armazena o usuário logado
        loginError.style.display = 'none';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('inspectionForm').style.display = 'block'
        document.getElementById('campos_apos_login').style.display = 'block'
        document.getElementById('btn-proximo').style.display = 'block'
        document.body.classList.remove("form1-bg");
        document.body.classList.add("form2-bg");
    } else {
        loginError.textContent = 'Nome de usuário ou senha incorretos.';
        loginError.style.display = 'block';
    }
};

export {login};
