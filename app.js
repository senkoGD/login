const SUPABASE_URL = "https://fhtlithkqmxbhaebeddd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Trm_4iOSUrYtJXVYLP63pg_MD7QZB67";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const btnSubmit = formRegister.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = true;

    const nombre = document.getElementById('reg-nombre').value.trim();
    const email = document.getElementById('reg-email').value.trim();
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
        if (btnSubmit) btnSubmit.disabled = false;
        return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
        alert("Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro correo.");
        if (btnSubmit) btnSubmit.disabled = false;
        return;
    }

    if (data.user) {
        const { error: playerError } = await supabaseClient
            .from('players')
            .insert([
                { username: nombre, points: 0, records_count: 0, country_flag: '🇲🇽' }
            ]);

        if (playerError) {
            console.error("Error al crear perfil en players:", playerError.message);
        }

        const DISCORD_WEBHOOK_REGISTROS = "https://discord.com/api/webhooks/1563779559751688262/EUNJ7yMIz37VG_5cBUqBIPTKmw2XgeFhgNnSIhpD6CBDT15mTJjNo-pNY_Mx-vJ1w6Rv";

        try {
            await fetch(DISCORD_WEBHOOK_REGISTROS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `**¡Nuevo Usuario Registrado en Zen List!**\n\n**Usuario:** ${nombre}\n**Correo:** ${email}`
                })
            });
        } catch (err) {
            console.error("Error al enviar webhook:", err);
        }

        alert("¡Registro exitoso! Revisa tu correo o inicia sesión.");
        formRegister.reset();
    }

    if (btnSubmit) btnSubmit.disabled = false;
});

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
        console.log("Sesión iniciada:", data);
        window.location.href = "home.html";
    }
});

const btnInvitado = document.getElementById('btn-invitado');
if (btnInvitado) {
    btnInvitado.addEventListener('click', () => {
        localStorage.setItem('modoInvitado', 'true');
        window.location.href = 'home.html';
    });
}

