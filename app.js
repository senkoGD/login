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

// 3. Lógica para REGISTRO con protección y validación de correo existente
const formRegister = document.getElementById('form-register');

formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Deshabilitar el botón para evitar spam de clics
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

    // Si ocurre un error directo (contraseña corta, formato inválido, etc.)
    if (error) {
        alert("Error al registrarse: " + error.message);
        if (btnSubmit) btnSubmit.disabled = false;
        return;
    }

    // Si Supabase devuelve identidades vacías, significa que EL CORREO YA ESTÁ REGISTRADO
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        alert("Este correo electrónico ya está registrado. Por favor, inicia sesión o utiliza otro correo.");
        if (btnSubmit) btnSubmit.disabled = false;
        return;
    }

    // Si el registro es completamente nuevo y exitoso
    if (data.user) {
        // A) Insertar al usuario en la tabla 'players' para que aparezca en el Leaderboard
        const { error: playerError } = await supabaseClient
            .from('players')
            .insert([
                { username: nombre, points: 0, records_count: 0, country_flag: '🇲🇽' }
            ]);

        if (playerError) {
            console.error("Error al crear perfil en players:", playerError.message);
        }

        // B) 🌐 WEBHOOK DE DISCORD PARA NUEVOS REGISTROS
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
        console.log("Sesión iniciada:", data);
        window.location.href = "home.html";
    }
});
