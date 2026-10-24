const SUPABASE_URL = "https://fhtlithkqmxbhaebeddd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Trm_4iOSUrYtJXVYLP63pg_MD7QZB67";

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let globalLevels = []; // Almacenará los niveles cargados de Supabase

// 1. Verificar Sesión y Cargar Datos al Iniciar
async function inicializarDashboard() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (!session || error) {
        // Redirigir al login si no hay sesión
        window.location.href = "index.html";
        return;
    }

    // Mostrar el usuario autenticado en la barra superior
    const user = session.user;
    const nombreUsuario = user.user_metadata.username || user.email;
    document.getElementById('user-welcome').innerText = `${nombreUsuario}`;

    // Cargar los niveles desde la base de datos
    cargarNiveles();
}

// 2. Función para obtener los niveles desde Supabase
async function cargarNiveles() {
    const levelsContainer = document.querySelector('.levels-list');
    levelsContainer.innerHTML = '<p style="padding: 15px; color: #888;">Cargando niveles...</p>';

    const { data: levels, error } = await supabaseClient
        .from('levels')
        .select('*')
        .order('position', { ascending: true }); // Ordenados por posición (#1, #2, ...)

    if (error) {
        console.error("Error al cargar niveles:", error.message);
        levelsContainer.innerHTML = '<p style="padding: 15px; color: #ff4d4d;">Error al cargar la lista.</p>';
        return;
    }

    if (!levels || levels.length === 0) {
        levelsContainer.innerHTML = '<p style="padding: 15px; color: #888;">No hay niveles registrados aún.</p>';
        return;
    }

    globalLevels = levels;
    renderizarListaNiveles(globalLevels);
    
    // Mostrar el primer nivel por defecto en la pantalla principal
    seleccionarNivel(globalLevels[0]);
}

// 3. Renderizar las tarjetas de la lista lateral
function renderizarListaNiveles(lista) {
    const levelsContainer = document.querySelector('.levels-list');
    levelsContainer.innerHTML = '';

    lista.forEach((level, index) => {
        const card = document.createElement('div');
        card.className = `level-card ${index === 0 ? 'active' : ''}`;
        card.dataset.id = level.id;

        card.innerHTML = `
            <span class="level-pos">#${level.position}</span>
            <div class="level-info">
                <h3>${level.name}</h3>
                <p>by ${level.creator}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            seleccionarNivel(level);
        });

        levelsContainer.appendChild(card);
    });
}

// 4. Mostrar la información del nivel seleccionado a la derecha
function seleccionarNivel(level) {
    const detailsContainer = document.querySelector('.level-details');

    // Manejo de video embed de Youtube o texto temporal
    let videoHTML = `<div class="video-placeholder"><span>🎬 Sin video disponible</span></div>`;
    if (level.video_url) {
        videoHTML = `
            <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 20px; border-radius: 8px;">
                <iframe style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;" 
                        src="${level.video_url}" 
                        allowfullscreen>
                </iframe>
            </div>
        `;
    }

    detailsContainer.innerHTML = `
        <div class="details-header">
            <h2>${level.name}</h2>
            <p>by ${level.creator} | Verified by ${level.verifier || level.creator}</p>
        </div>
        
        ${videoHTML}

        <div class="level-stats">
            <div class="stat-box"><span>PASSWORD</span><strong>${level.password || 'Free Copy'}</strong></div>
            <div class="stat-box"><span>ID</span><strong>${level.level_id || 'N/A'}</strong></div>
            <div class="stat-box"><span>LENGTH</span><strong>${level.length || 'N/A'}</strong></div>
        </div>

        <div class="records-section">
            <h3>Records</h3>
            <p style="color: #666; font-size: 0.85rem;">Próximamente consulta de récords desde la BD.</p>
        </div>
    `;
}

// 5. Buscador de Niveles en tiempo real
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtrados = globalLevels.filter(lvl => 
            lvl.name.toLowerCase().includes(query) || 
            lvl.creator.toLowerCase().includes(query)
        );
        renderizarListaNiveles(filtrados);
    });
}

// 6. Botón de Cerrar Sesión
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert("Error al cerrar sesión: " + error.message);
        } else {
            window.location.href = "index.html";
        }
    });
}

// Iniciar ejecuciones
inicializarDashboard();


