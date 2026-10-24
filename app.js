const SUPABASE_URL = "https://fhtlithkqmxbhaebeddd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Trm_4iOSUrYtJXVYLP63pg_MD7QZB67";

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Control visual para cambiar entre Login y Registro
const signContainer = document.querySelector('.sign-container');
const signLogin = document.querySelector('.sign-login');

document.querySelector('.ok-account').addEventListener('click', () => {
    signContainer.style.display = 'none';
    signLogin.style.display = 'block';
});

document.querySelector('.no-account').addEventListener('click', () => {
    signLogin.style.display = 'none';
    signContainer.style.display = 'block';
});

const formRegister = document.getElementById('form-register');

formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: nombre
            }
        }
    });

    if (error) {
        alert("Error al registrarse: " + error.message);
    } else {
        alert("¡Registro exitoso! Revisa tu correo o inicia sesión.");
        console.log("Usuario creado:", data);
    }
});

// 4. Lógica para INICIAR SESIÓN
const formLogin = document.getElementById('form-login');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Error al iniciar sesión: " + error.message);
    } else {
        alert("¡Bienvenido " + (data.user.user_metadata.username || email) + "!");
        console.log("Sesión iniciada:", data
         window.location.href = "home.html";
    }
});
