const SUPABASE_URL = "https://fhtlithkqmxbhaebeddd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Trm_4iOSUrYtJXVYLP63pg_MD7QZB67";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let globalLevels = []; 
let usuarioActualNombre = ""; 
let htmlDashboardOriginal = ""; 

async function inicializarDashboard() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    const welcomeEl = document.getElementById('user-welcome');
    const btnLogout = document.getElementById('btn-logout');

    if (session && !error) {
        const user = session.user;
        usuarioActualNombre = user.user_metadata.username || user.email;
        
        if (welcomeEl) {
            welcomeEl.innerText = `${usuarioActualNombre}`;
            welcomeEl.style.cursor = 'pointer';
            welcomeEl.title = 'Haz clic para ver tu perfil';
            welcomeEl.onclick = () => abrirPerfilJugador(usuarioActualNombre);
        }
        if (btnLogout) {
            btnLogout.style.display = 'inline-block';
        }
    } else {
        usuarioActualNombre = "";
        
        if (welcomeEl) {
            welcomeEl.innerHTML = `<a href="index.html" style="color: #00d2ff; text-decoration: none; font-weight: bold;">Iniciar Sesión</a>`;
        }
        if (btnLogout) {
            btnLogout.style.display = 'none'; 
        }
    }

    const container = document.querySelector('.dashboard-container') || document.querySelector('.main-content');
    if (container) {
        htmlDashboardOriginal = container.innerHTML;
    }

    cargarNiveles();
    configurarNavegacion();
}


    cargarNiveles();
    configurarNavegacion();
}

async function cargarNiveles() {
    const levelsContainer = document.querySelector('.levels-list');
    if (levelsContainer) {
        levelsContainer.innerHTML = '<p style="padding: 15px; color: #888;">Cargando niveles...</p>';
    }

    const { data: levels, error } = await supabaseClient
        .from('levels')
        .select('*')
        .order('position', { ascending: true });

    if (error) {
        console.error("Error al cargar niveles:", error.message);
        if (levelsContainer) {
            levelsContainer.innerHTML = '<p style="padding: 15px; color: #ff4d4d;">Error al cargar la lista.</p>';
        }
        return;
    }

    if (!levels || levels.length === 0) {
        if (levelsContainer) {
            levelsContainer.innerHTML = '<p style="padding: 15px; color: #888;">No hay niveles registrados aún.</p>';
        }
        return;
    }

    globalLevels = levels;
    renderizarListaNiveles(globalLevels);
    seleccionarNivel(globalLevels[0]);
}

function renderizarListaNiveles(lista) {
    const levelsContainer = document.querySelector('.levels-list');
    if (!levelsContainer) return;
    
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

async function seleccionarNivel(level) {
    const detailsContainer = document.querySelector('.level-details');
    if (!detailsContainer) return;

    let videoHTML = `<div class="video-placeholder"><span>Sin video disponible</span></div>`;
    
    if (level.video_url) {
        let url = level.video_url;
        let videoId = '';

        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1].split('&')[0];
        } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1].split('?')[0];
        }

        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            videoHTML = `
                <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 20px; border-radius: 8px;">
                    <iframe style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;" 
                            src="${embedUrl}" 
                            allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }

    const { data: registeredPlayers } = await supabaseClient
        .from('players')
        .select('username');

    const listaUsuariosValidos = registeredPlayers ? registeredPlayers.map(p => p.username.toLowerCase()) : [];

    function estaRegistrado(nombre) {
        if (!nombre) return false;
        return listaUsuariosValidos.includes(nombre.trim().toLowerCase());
    }

    const creatorName = level.creator || 'Desconocido';
    const verifierName = level.verifier || level.creator || 'Desconocido';

    const creatorHTML = estaRegistrado(creatorName) 
        ? `<span class="creator-link" style="color: #00d2ff; cursor: pointer; text-decoration: underline;" onclick="abrirPerfilJugador('${creatorName}')">${creatorName}</span>` 
        : `<span style="color: #fff;">${creatorName}</span>`;

    const verifierHTML = estaRegistrado(verifierName) 
        ? `<span class="creator-link" style="color: #00d2ff; cursor: pointer; text-decoration: underline;" onclick="abrirPerfilJugador('${verifierName}')">${verifierName}</span>` 
        : `<span style="color: #fff;">${verifierName}</span>`;

    const { data: records } = await supabaseClient
        .from('records')
        .select('*')
        .eq('level_id', level.id)
        .order('progress', { ascending: false });

    let recordsListHTML = '<p style="color: #666; font-size: 0.85rem;">No hay récords registrados de jugadores activos.</p>';

    if (records && records.length > 0) {
        const recordsValidos = records.filter(rec => estaRegistrado(rec.username));

        if (recordsValidos.length > 0) {
            recordsListHTML = `<ul class="records-list" style="list-style: none; padding: 0; margin: 0;">` + 
                recordsValidos.map(rec => `
                    <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #111; margin-bottom: 6px; border-radius: 6px; border: 1px solid #222;">
                        <span style="color: #00d2ff; cursor: pointer; font-weight: bold; text-decoration: underline;" onclick="abrirPerfilJugador('${rec.username}')">${rec.username}</span>
                        <span style="color: #22c55e; font-weight: bold;">${rec.progress}%</span>
                    </li>
                `).join('') + `</ul>`;
        }
    }

    detailsContainer.innerHTML = `
        <div class="details-header">
            <h2>${level.name}</h2>
            <p>by ${creatorHTML} | Verified by ${verifierHTML}</p>
        </div>
        
        ${videoHTML}

        <div class="level-stats">
            <div class="stat-box"><span>POINTS</span><strong style="color: #22c55e;">${level.points || 0} pts</strong></div>
            <div class="stat-box"><span>ID</span><strong>${level.level_id || 'N/A'}</strong></div>
            <div class="stat-box"><span>LENGTH</span><strong>${level.length || 'N/A'}</strong></div>
        </div>

        <div class="records-section" style="margin-top: 20px;">
            <h3 style="margin-bottom: 10px; color: #fff; font-size: 1.1rem;">Records</h3>
            ${recordsListHTML}
        </div>
    `;
}

function configurarNavegacion() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const section = link.innerText.trim().toLowerCase();

            if (section === 'list') {
                restaurarDashboard();
            } else if (section === 'leaderboard') {
                cargarLeaderboard();
            } else if (section === 'submit') {
                mostrarFormularioSubmit();
            }
        });
    });
}

function obtenerContenedorDinamico() {
    return document.querySelector('.dashboard-container') || document.querySelector('.main-content') || document.body;
}

function restaurarDashboard() {
    const container = obtenerContenedorDinamico();
    if (htmlDashboardOriginal) {
        container.innerHTML = htmlDashboardOriginal;
        renderizarListaNiveles(globalLevels);
        if (globalLevels.length > 0) seleccionarNivel(globalLevels[0]);
        
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
    } else {
        window.location.reload();
    }
}

async function cargarLeaderboard() {
    const container = obtenerContenedorDinamico();
    container.innerHTML = '<p style="padding: 40px; text-align: center; color: #888;">Cargando Leaderboard...</p>';

    const { data: players } = await supabaseClient
        .from('players')
        .select('*')
        .order('points', { ascending: false });

    let rows = '';
    if (players && players.length > 0) {
        rows = players.map((p, idx) => `
            <tr style="border-bottom: 1px solid #222;">
                <td style="padding: 10px;">#${idx + 1}</td>
                <td style="padding: 10px; font-weight: bold; color: #00d2ff; cursor: pointer;" onclick="abrirPerfilJugador('${p.username}')">${p.country_flag || '🇲🇽'} ${p.username}</td>
                <td style="padding: 10px;">${p.records_count || 0}</td>
                <td style="padding: 10px; color: #22c55e; font-weight: bold;">${p.points || 0} pts</td>
            </tr>
        `).join('');
    } else {
        rows = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #888;">No hay jugadores en el leaderboard aún.</td></tr>`;
    }

    container.innerHTML = `
        <div style="padding: 15px; width: 100%; max-width: 800px; margin: 0 auto; overflow-x: auto;">
            <h2 style="margin-bottom: 15px; color: #fff;">Leaderboard</h2>
            <table style="width: 100%; text-align: left; border-collapse: collapse; background: #18181c; border-radius: 8px; overflow: hidden; border: 1px solid #333; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #222; color: #aaa;">
                        <th style="padding: 10px;">Rank</th>
                        <th style="padding: 10px;">Jugador</th>
                        <th style="padding: 10px;">Récords</th>
                        <th style="padding: 10px;">Puntos</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

async function mostrarFormularioSubmit() {
    const container = obtenerContenedorDinamico();
    container.innerHTML = '<p style="padding: 40px; text-align: center; color: #888;">Cargando formulario...</p>';

    const { data: levelsList } = await supabaseClient
        .from('levels')
        .select('name')
        .order('position', { ascending: true });

    let opcionesNiveles = '<option value="" disabled selected>Selecciona un nivel</option>';
    if (levelsList && levelsList.length > 0) {
        levelsList.forEach(lvl => {
            opcionesNiveles += `<option value="${lvl.name}">${lvl.name}</option>`;
        });
    }

    container.innerHTML = `
        <div style="padding: 15px; width: 100%; max-width: 500px; margin: 0 auto;">
            <h2 style="margin-bottom: 15px; color: #fff; text-align: center; font-size: 1.8rem;">SUMIT</h2>
            <form id="submit-form" style="display: flex; flex-direction: column; gap: 15px; background: #18181c; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                
                <div>
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Tu usuario</label>
                    <input type="text" id="sub-player" value="${usuarioActualNombre}" readonly style="width:100%; padding:10px; background:#111; border:1px solid #333; color:#00d2ff; border-radius:6px; font-weight:bold;">
                </div>

                <div>
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Escoge el nivel</label>
                    <select id="sub-level" required style="width:100%; padding:10px; background:#111; border:1px solid #333; color:#fff; border-radius:6px;">
                        ${opcionesNiveles}
                    </select>
                </div>

                <div>
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Porcentaje alcanzado (%)</label>
                    <input type="number" id="sub-progress" min="1" max="100" placeholder="Ejemplo: 100" required style="width:100%; padding:10px; background:#111; border:1px solid #333; color:#fff; border-radius:6px;">
                </div>

                <div>
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Enlace de prueba (YouTube / TikTok)</label>
                    <input type="url" id="sub-video" placeholder="https://youtu.be/..." required style="width:100%; padding:10px; background:#111; border:1px solid #333; color:#fff; border-radius:6px;">
                </div>

                <button type="submit" style="padding:12px; background:#22c55e; color:#fff; font-weight:bold; border:none; border-radius:6px; cursor:pointer; font-size: 1rem;">Enviar Progreso</button>
            </form>
        </div>
    `;

    document.getElementById('submit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const player = document.getElementById('sub-player').value;
        const level = document.getElementById('sub-level').value;
        const progress = document.getElementById('sub-progress').value;
        const video = document.getElementById('sub-video').value;

        const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1563443204899078264/q9hJ6LCc3bEGzX7LGNY-E-nL1Ao5ea0ENoEy0cTC6bgzocJ4pxh7Qo5z_HkE0jmkXK5y";

        const mensajeDiscord = {
            content: `**Nuevo Progreso Recibido** \n\n**Usuario:** ${player}\n**Nivel:** ${level} (${progress}%)\n**Prueba:** ${video}`
        };

        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mensajeDiscord)
            });

            if (response.ok || response.status === 204) {
                alert("¡Progreso enviado con éxito a Discord!");
                document.getElementById('submit-form').reset();
                document.getElementById('sub-player').value = player;
            } else {
                alert("Error al enviar al Webhook de Discord.");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("No se pudo conectar con el Webhook de Discord.");
        }
    });
}

async function abrirPerfilJugador(nombreJugador) {
    let puntos = 0;
    let banderaActual = '🇲🇽';

    const { data: playerData } = await supabaseClient
        .from('players')
        .select('*')
        .eq('username', nombreJugador)
        .single();

    if (playerData) {
        puntos = playerData.points || 0;
        banderaActual = playerData.country_flag || '🇲🇽';
    }

    const { count: nivelesCreadosCount } = await supabaseClient
        .from('levels')
        .select('*', { count: 'exact', head: true })
        .ilike('creator', nombreJugador);

    const banderasLatam = ['🇲🇽', '🇵🇪', '🇸🇻', '🇦🇷', '🇨🇴', '🇨🇱', '🇺🇸', '🇻🇪', '🇪🇨', '🇧🇴', '🇺🇾', '🇵🇾', '🇨🇷', '🇵🇦', '🇩🇴', '🇭🇳', '🇬🇹', '🇳🇮', '🇨🇺', '🇪🇸'];

    const modal = document.createElement('div');
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:2000;";
    
    modal.innerHTML = `
        <div style="background:#18181c; padding:25px; border-radius:12px; width:90%; max-width:360px; color:#fff; border:1px solid #333; text-align:center; position:relative;">
            <button id="cerrar-modal" style="position:absolute; top:10px; right:15px; background:none; border:none; color:#aaa; font-size:1.5rem; cursor:pointer;">&times;</button>
            
            <h3 style="margin-bottom: 15px; font-size: 1.4rem; color: #00d2ff;">${nombreJugador}</h3>
            
            <div style="display:flex; justify-content:space-between; align-items:center; background:#111; padding:12px 18px; border-radius:8px; margin-bottom:12px; border: 1px solid #222;">
                <div style="font-size:1rem; font-weight:bold; color:#22c55e;"> ${puntos} pts</div>
                <div id="contenedor-bandera" style="font-size:1.8rem; cursor:pointer;" title="Haz clic para cambiar tu país">
                    <span id="bandera-actual">${banderaActual}</span>
                </div>
            </div>

            <div id="selector-banderas" style="display:none; grid-template-columns: repeat(5, 1fr); gap: 6px; background:#111; padding:10px; border-radius:8px; margin-bottom:12px; max-height: 130px; overflow-y: auto; border: 1px solid #333;">
                ${banderasLatam.map(flag => `<span class="opcion-bandera" style="font-size:1.3rem; cursor:pointer; padding:4px; text-align:center;">${flag}</span>`).join('')}
            </div>

            <div style="background:#111; padding:10px; border-radius:8px; font-size:0.9rem; color:#ccc; border: 1px solid #222;">
                <strong>Levels Creator:</strong> <span style="color: #00d2ff; font-weight: bold;">${nivelesCreadosCount || 0}</span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cerrar-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const banderaEl = document.getElementById('contenedor-bandera');
    const selectorEl = document.getElementById('selector-banderas');
    
    banderaEl.addEventListener('click', () => {
        selectorEl.style.display = selectorEl.style.display === 'none' ? 'grid' : 'none';
    });

    selectorEl.querySelectorAll('.opcion-bandera').forEach(flagSpan => {
        flagSpan.addEventListener('click', async () => {
            const nuevaBandera = flagSpan.innerText;
            document.getElementById('bandera-actual').innerText = nuevaBandera;
            selectorEl.style.display = 'none';

            await supabaseClient
                .from('players')
                .update({ country_flag: nuevaBandera })
                .eq('username', nombreJugador);
        });
    });
}

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

// esto hara que se inicie (por favor funciona 😭)
inicializarDashboard();
