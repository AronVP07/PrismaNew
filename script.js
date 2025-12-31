// === Configuración Global ===
const numeroWhatsApp = '51984191444'; 

// ====================================================================
// === FUNCIÓN CLAVE: EL CORRECTOR DE RUTAS (LA SOLUCIÓN) ===
// ====================================================================
/**
 * Esta función es la que arregla el error de las imágenes.
 * Detecta la ubicación actual y ajusta el path de la imagen.
 */
function corregirRutaImagen(rutaOriginal) {
    if (!rutaOriginal) return "";

    // 1. Limpiamos la ruta de cualquier "../" previo para estandarizarla
    // Ejemplo: "../imagenes/foto.jpg" -> "imagenes/foto.jpg"
    let rutaLimpia = rutaOriginal.replace(/\.\.\//g, "");

    // 2. Detectamos si el archivo HTML actual está dentro de la carpeta "extencion"
    const estamosEnSubcarpeta = window.location.pathname.includes("/extencion/");

    // 3. Si estamos en subcarpeta, necesitamos subir un nivel para llegar a "imagenes"
    // Si estamos en el index (raíz), la ruta limpia ya es correcta.
    return estamosEnSubcarpeta ? "../" + rutaLimpia : rutaLimpia;
}

// ====================================================================
// === LÓGICA DEL CARRITO DE COTIZACIÓN ===
// ====================================================================
const btnCarrito = document.getElementById("btnCarrito");
const carritoPanel = document.getElementById("carritoPanel");
const carritoOverlay = document.getElementById("carritoOverlay");
const cerrarCarrito = document.getElementById("cerrarCarrito");
const carritoContenido = document.getElementById("carritoContenido");
const carritoBadge = document.getElementById("carritoBadge");
const btnVaciar = document.getElementById("vaciarCarrito");
const btnWhatsApp = document.getElementById("cotizarWhatsApp");

let carrito = [];

function guardarCarrito() {
    localStorage.setItem('prismaCarrito', JSON.stringify(carrito));
}

function cargarCarrito() {
    const stored = localStorage.getItem('prismaCarrito');
    carrito = stored ? JSON.parse(stored) : [];
}

function actualizarBadge() {
    const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    if (carritoBadge) carritoBadge.textContent = totalItems.toString();
}

function renderCarrito() {
    if (!carritoContenido) return;
    carritoContenido.innerHTML = "";
    
    if (carrito.length === 0) {
        carritoContenido.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
        if (btnVaciar) btnVaciar.disabled = true;
        if (btnWhatsApp) btnWhatsApp.disabled = true;
    } else {
        if (btnVaciar) btnVaciar.disabled = false;
        if (btnWhatsApp) btnWhatsApp.disabled = false;

        carrito.forEach(producto => {
            // APLICAMOS LA CORRECCIÓN AQUÍ:
            const imgRutaCorregida = corregirRutaImagen(producto.imagen);

            const fila = document.createElement("div");
            fila.classList.add("carrito-item");
            fila.innerHTML = `
                <img src="${imgRutaCorregida}" alt="${producto.nombre}" class="item-img" />
                <div class="item-details">
                    <h4>${producto.nombre}</h4>
                    <p>Cant: <span class="item-cantidad">${producto.cantidad}</span></p>
                    <div class="cantidad-controls">
                        <button class="btn-qty-minus" data-id="${producto.id}">-</button>
                        <button class="btn-qty-plus" data-id="${producto.id}">+</button>
                    </div>
                </div>
                <button class="btn-eliminar" data-id="${producto.id}"><i class="fas fa-trash"></i></button>
            `;
            carritoContenido.appendChild(fila);
        });

        // Listeners de botones dentro del carrito
        document.querySelectorAll(".btn-qty-plus").forEach(btn => {
            btn.addEventListener("click", e => changeQuantity(e.currentTarget.dataset.id, 1));
        });
        document.querySelectorAll(".btn-qty-minus").forEach(btn => {
            btn.addEventListener("click", e => changeQuantity(e.currentTarget.dataset.id, -1));
        });
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", e => removeItem(e.currentTarget.dataset.id));
        });
    }
    actualizarBadge();
}

function removeItem(id) {
    carrito = carrito.filter(p => p.id !== id);
    renderCarrito();
    guardarCarrito();
}

function changeQuantity(id, delta) {
    const p = carrito.find(prod => prod.id === id);
    if (p) {
        p.cantidad += delta;
        if (p.cantidad < 1) removeItem(id);
        else { renderCarrito(); guardarCarrito(); }
    }
}

function abrirCerrarCarrito(abrir = true) {
    if (!carritoPanel || !carritoOverlay) return;
    carritoPanel.classList.toggle("abierto", abrir);
    carritoOverlay.classList.toggle("visible", abrir);
}

// ====================================================================
// === INICIALIZACIÓN Y EVENTOS GENERALES ===
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    renderCarrito();

    // Abrir/Cerrar
    btnCarrito?.addEventListener("click", () => abrirCerrarCarrito(true));
    cerrarCarrito?.addEventListener("click", () => abrirCerrarCarrito(false));
    carritoOverlay?.addEventListener("click", () => abrirCerrarCarrito(false));

    // Agregar productos
    document.querySelectorAll(".btn-agregar").forEach(btn => {
        btn.addEventListener("click", e => {
            const card = e.target.closest(".producto");
            if (!card) return;

            const id = card.dataset.id || `prod-${Date.now()}`;
            const nombre = card.querySelector('h3')?.textContent || "Producto";
            const imgPath = card.querySelector("img")?.getAttribute("src") || "";

            // Guardamos la ruta "limpia" (sin puntos) para que la función correctora trabaje
            const imgLimpia = imgPath.replace(/\.\.\//g, "");

            const existente = carrito.find(p => p.id === id);
            if (existente) {
                existente.cantidad += 1;
            } else {
                carrito.push({ id, nombre, imagen: imgLimpia, cantidad: 1 });
            }

            renderCarrito();
            guardarCarrito();
            abrirCerrarCarrito(true);
        });
    });

    // Botón Vaciar
    btnVaciar?.addEventListener("click", () => {
        if (confirm("¿Vaciar el carrito de cotización?")) {
            carrito = [];
            renderCarrito();
            guardarCarrito();
        }
    });

    // WhatsApp
    btnWhatsApp?.addEventListener("click", () => {
        if (carrito.length === 0) return;
        let mensaje = "¡Hola! Quisiera cotizar:\n\n";
        carrito.forEach((p, i) => mensaje += `${i+1}. ${p.nombre} (Cant: ${p.cantidad})\n`);
        window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. BASE DE DATOS DE PRODUCTOS (Nombres para sugerencias)
    // ==========================================
    // Esta lista alimenta el autocompletado. 
    // No necesita rutas de imagen, solo los nombres para ayudar al usuario a buscar.
    const listaNombresProductos = [
        "Abrazadera Electrofusión", "Acoples Alta Presión", "Adaptador de Brida Rápida", 
        "Adaptador HDPE", "Adaptador Macho HDPE", "Adaptador PVC", "Balde de Prueba Hidráulica",
        "Brida", "Brida UF PVC", "Bridas Soldables Citaly", "Bushing Galvanizado",
        "Caja Termoplástico", "Caño Bronce Pesado", "Caño Mango Amarillo", "Caño Botadero",
        "Caño Cromado", "Caño Doble Entrada", "Caño Esférico Rubistar", "Caño Jardinería",
        "Caño PVC", "Caño Rosca", "Cinta Teflón", "Codo Galvanizado", "Codo HDPE",
        "Codo Alcantarilla", "Codo PVC", "Conexión Alcantarillado", "Cruz Galvanizada",
        "Cuchara para Concreto", "Cupla Electrofusión", "Curva SEL Tuboplast",
        "Empaquetadura Neopreno", "Extintor", "Hidrante Contra Incendio", "Kit Varilla Desatoro",
        "Manguera HDPE", "Manguera Lona", "Manguera Succión", "Manómetro Líquido",
        "Marco y Tapa", "Marco Hierro Dúctil", "Mazo de Goma", "Medidor de Agua",
        "Niple Galvanizado", "Pegamento Oatey", "Probetas de Concreto", "Reducción",
        "Registro Dados", "Rejilla Ventilación", "Separador Concreto", "Tapa Registro",
        "Tapón Macho", "Tee Galvanizada", "Tee HDPE", "Tee PVC", "Tuberías Aquaplas",
        "Tubo Abasto", "Unión Universal", "Válvula Canastilla York", "Válvula Check",
        "Válvula Compuerta", "Válvula Esférica", "Válvula Flotadora", "Válvula Mariposa",
        "Válvula Reductora", "Varilla de Desatoro", "Water Stop Caucho", "Yee PVC", "Yee Galvanizada"
    ];

    // ==========================================
    // 2. LÓGICA DEL BUSCADOR INTELIGENTE
    // ==========================================
    const inputBuscador = document.getElementById('inputBuscador');
    const btnBuscar = document.querySelector('.btn-buscar');
    const contenedorBuscador = document.querySelector('.buscador-central');

    // Crear lista de sugerencias dinámicamente
    const ulSugerencias = document.createElement('ul');
    ulSugerencias.className = 'lista-sugerencias';
    contenedorBuscador.appendChild(ulSugerencias);

    // Función para normalizar texto (quitar tildes y mayúsculas)
    const normalizar = (texto) => {
        return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Evento al escribir
    inputBuscador.addEventListener('input', (e) => {
        const valor = normalizar(e.target.value);
        ulSugerencias.innerHTML = ''; // Limpiar lista anterior

        if (valor.length === 0) {
            ulSugerencias.classList.remove('active');
            return;
        }

        // Filtrar coincidencias
        const coincidencias = listaNombresProductos.filter(nombre => 
            normalizar(nombre).includes(valor)
        );

        // Mostrar sugerencias (máximo 8 para no saturar)
        if (coincidencias.length > 0) {
            coincidencias.slice(0, 8).forEach(nombre => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-search"></i> ${nombre}`;
                li.addEventListener('click', () => {
                    inputBuscador.value = nombre;
                    ejecutarBusqueda(nombre);
                    ulSugerencias.classList.remove('active');
                });
                ulSugerencias.appendChild(li);
            });
            ulSugerencias.classList.add('active');
        } else {
            ulSugerencias.classList.remove('active');
        }
    });

    // Ocultar sugerencias si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!contenedorBuscador.contains(e.target)) {
            ulSugerencias.classList.remove('active');
        }
    });

    // Evento Botón Buscar y Enter
    btnBuscar.addEventListener('click', () => ejecutarBusqueda(inputBuscador.value));
    inputBuscador.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') ejecutarBusqueda(inputBuscador.value);
    });

    // FUNCIÓN PRINCIPAL DE REDIRECCIÓN/BÚSQUEDA
    function ejecutarBusqueda(termino) {
        if (!termino.trim()) return;
        const terminoLimpio = encodeURIComponent(termino.trim());
        
        // Detectar si estamos en index.html o catalogo.html
        // Nota: Ajusta 'catalogo.html' si tu archivo está en una carpeta
        const esCatalogo = window.location.pathname.includes('catalogo.html') || window.location.pathname.includes('catalogo');
        
        if (esCatalogo) {
            // Si ya estamos en el catálogo, filtramos directamente
            filtrarCatalogoInSitu(termino);
        } else {
            // Si estamos en inicio, redirigimos
            // Asumimos que catalogo está en extencion/catalogo.html o similar según tu estructura
            // Basado en tu HTML, desde index es "extencion/catalogo.html"
            // Pero si el script corre en index, la ruta es relativa.
            
            let rutaDestino = 'extencion/catalogo.html'; 
            
            // Verificación simple de ruta (ajustar según tu estructura de carpetas real)
            if(document.querySelector('.catalogo')) { 
                // Ya estamos en catálogo (redundancia de seguridad)
                filtrarCatalogoInSitu(termino);
            } else {
                window.location.href = `${rutaDestino}?q=${terminoLimpio}`;
            }
        }
    }

    // ==========================================
    // 3. LÓGICA DE FILTRADO EN CATALOGO.HTML
    // ==========================================
    
    // Esta función corre solo si estamos en la página del catálogo
    function inicializarCatalogo() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');

        if (query) {
            inputBuscador.value = decodeURIComponent(query); // Poner texto en el input
            filtrarCatalogoInSitu(decodeURIComponent(query));
        }
    }

    function filtrarCatalogoInSitu(textoBusqueda) {
        const textoNormalizado = normalizar(textoBusqueda);
        const contenedorGrupos = document.getElementById('contenedor-grupos');
        const tabsContainer = document.querySelector('.tabs-container');
        const tituloMain = document.querySelector('.titulo-main');

        // 1. Modificar la interfaz
        if(tabsContainer) tabsContainer.style.display = 'none'; // Ocultar pestañas 1-8
        if(tituloMain) tituloMain.textContent = `Resultados para: "${textoBusqueda}"`;

        // 2. Recolectar TODOS los productos de TODOS los grupos
        const todosLosGrupos = document.querySelectorAll('.productos-grid');
        let encontrados = 0;

        // Estrategia: Mostrar todos los grupos pero filtrar los productos internos
        todosLosGrupos.forEach(grupo => {
            // Forzar que el grupo sea visible (quitamos hidden)
            grupo.classList.remove('hidden');
            grupo.style.display = 'grid'; // Asegurar display grid

            const productos = grupo.querySelectorAll('.producto');
            let visiblesEnGrupo = 0;

            productos.forEach(prod => {
                const nombreProd = normalizar(prod.querySelector('h3').textContent);
                if (nombreProd.includes(textoNormalizado)) {
                    prod.style.display = 'flex'; // Mostrar producto
                    visiblesEnGrupo++;
                    encontrados++;
                } else {
                    prod.style.display = 'none'; // Ocultar producto
                }
            });

            // Si ningún producto del grupo coincide, ocultar el grupo entero para no dejar huecos
            if (visiblesEnGrupo === 0) {
                grupo.style.display = 'none';
            }
        });

        if (encontrados === 0) {
            if(tituloMain) tituloMain.innerHTML = `No se encontraron resultados para "${textoBusqueda}". <br><small><a href="#" onclick="location.reload()">Ver todo el catálogo</a></small>`;
        }
    }

    // Ejecutar inicialización si estamos en catálogo
    if (document.querySelector('.catalogo')) {
        inicializarCatalogo();
    }
    // ====================================================================
// === LÓGICA DEL CARRITO DE COTIZACIÓN ===
// ====================================================================
const btnCarrito = document.getElementById("btnCarrito");
const carritoPanel = document.getElementById("carritoPanel");
const carritoOverlay = document.getElementById("carritoOverlay");
const cerrarCarrito = document.getElementById("cerrarCarrito");
const carritoContenido = document.getElementById("carritoContenido");
const carritoBadge = document.getElementById("carritoBadge");
const btnVaciar = document.getElementById("vaciarCarrito");
const btnWhatsApp = document.getElementById("cotizarWhatsApp");

let carrito = [];

function guardarCarrito() {
    localStorage.setItem('prismaCarrito', JSON.stringify(carrito));
}

function cargarCarrito() {
    try {
        const storedCarrito = localStorage.getItem('prismaCarrito');
        carrito = storedCarrito ? JSON.parse(storedCarrito) : [];
    } catch (e) {
        console.error("Error al cargar el carrito de localStorage:", e);
        carrito = [];
    }
}

function actualizarBadge() {
    const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    if (carritoBadge) carritoBadge.textContent = totalItems.toString();
}

function abrirCerrarCarrito(abrir = true) {
    if (!carritoPanel || !carritoOverlay) return;

    carritoPanel.classList.toggle("abierto", abrir);
    carritoOverlay.classList.toggle("visible", abrir);
    carritoPanel.setAttribute("aria-hidden", (!abrir).toString());
}

function removeItem(id) {
    carrito = carrito.filter(p => p.id !== id);
    renderCarrito();
    guardarCarrito();
}

// Renderiza el contenido del carrito (SIN PRECIOS)
function renderCarrito() {
    if (!carritoContenido) return;

    carritoContenido.innerHTML = "";
    
    if (carrito.length === 0) {
        carritoContenido.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío.</p>';
        if (btnVaciar) btnVaciar.disabled = true;
        if (btnWhatsApp) btnWhatsApp.disabled = true;
    } else {
        if (btnVaciar) btnVaciar.disabled = false;
        if (btnWhatsApp) btnWhatsApp.disabled = false;

        carrito.forEach(producto => {
            const fila = document.createElement("div");
            fila.classList.add("carrito-item");
            fila.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}" class="item-img" />
                <div class="item-details">
                    <h4>${producto.nombre}</h4>
                    <p>Cantidad: <span class="item-cantidad">${producto.cantidad}</span></p>
                    <div class="cantidad-controls">
                        <button class="btn-qty-minus" data-id="${producto.id}">-</button>
                        <button class="btn-qty-plus" data-id="${producto.id}">+</button>
                    </div>
                </div>
                <button class="btn-eliminar" data-id="${producto.id}" aria-label="Eliminar producto"><i class="fas fa-trash"></i></button>
            `;
            carritoContenido.appendChild(fila);
        });

        // Event Listeners para botones de control de cantidad
        document.querySelectorAll(".btn-qty-plus").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.currentTarget.dataset.id;
                changeQuantity(id, 1);
            });
        });

        document.querySelectorAll(".btn-qty-minus").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.currentTarget.dataset.id;
                changeQuantity(id, -1);
            });
        });

        // Listener para el botón de eliminar dentro del carrito
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.currentTarget.dataset.id;
                removeItem(id);
            });
        });
    }

    actualizarBadge();
}

// Función para cambiar la cantidad de un producto en el carrito
function changeQuantity(id, delta) {
    const producto = carrito.find(p => p.id === id);
    if (producto) {
        producto.cantidad += delta;
        if (producto.cantidad < 1) {
            removeItem(id); // Elimina si la cantidad llega a 0
        } else {
            renderCarrito();
            guardarCarrito();
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    renderCarrito();

    // Event Listeners principales del carrito
    if (btnCarrito) btnCarrito.addEventListener("click", () => abrirCerrarCarrito(true));
    if (cerrarCarrito) cerrarCarrito.addEventListener("click", () => abrirCerrarCarrito(false));
    if (carritoOverlay) carritoOverlay.addEventListener("click", () => abrirCerrarCarrito(false));

    // Event Listener para botones de AGREGAR AL CARRITO
    document.querySelectorAll(".btn-agregar").forEach(btn => {
        btn.addEventListener("click", e => {
            const card = e.target.closest(".producto"); 
            if (!card) return;

            const id = card.dataset.id || `prod-${Date.now()}`; 
            const nombre = card.querySelector('h3')?.textContent || "Producto sin nombre";
            const img = card.querySelector("img")?.getAttribute("src") || "";

            const existente = carrito.find(p => p.id === id);
            if (existente) {
                existente.cantidad += 1;
            } else {
                carrito.push({ id, nombre, imagen: img, cantidad: 1 });
            }

            renderCarrito();
            guardarCarrito();
            abrirCerrarCarrito(true);
        });
    });

    // Vaciar carrito
    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            if (confirm("¿Estás seguro de que quieres vaciar el carrito de cotización?")) {
                carrito = [];
                renderCarrito();
                guardarCarrito();
            }
        });
    }

    // Cotizar por WhatsApp (Generación de mensaje dinámico)
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener("click", () => {
            if (carrito.length === 0) return;

            let mensaje = "¡Hola! Quisiera cotizar los siguientes productos de PRISMA STELL:\n\n";

            carrito.forEach((p, index) => {
                mensaje += `${index + 1}. ${p.nombre} (Cant: ${p.cantidad})\n`;
            });

            mensaje += `\n*Por favor, confirmen disponibilidad y precios. ¡Gracias!*`;

            const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        });
    }
});

});
 
// ==========================================
// 5. FUNCIONES DE PESTAÑAS (TABS)
// ==========================================
// Necesario para que el catálogo funcione normal cuando NO se está buscando
function mostrarGrupo(numero) {
    // Ocultar todos los grupos
    document.querySelectorAll('.productos-grid').forEach(grid => {
        grid.classList.add('hidden');
        grid.style.display = 'none'; // Reseteo forzoso
        // Restaurar visibilidad de productos internos por si hubo búsqueda previa
        grid.querySelectorAll('.producto').forEach(p => p.style.display = 'flex');
    });
    
    // Quitar active de tabs
    document.querySelectorAll('.tab-box').forEach(tab => tab.classList.remove('active'));

    // Mostrar el seleccionado
    const grupoSeleccionado = document.getElementById(`grupo${numero}`);
    if(grupoSeleccionado) {
        grupoSeleccionado.classList.remove('hidden');
        grupoSeleccionado.style.display = 'grid'; // Estilo original del grid
    }
    
    const btnSeleccionado = document.getElementById(`btn${numero}`);
    if(btnSeleccionado) btnSeleccionado.classList.add('active');
}

// ====================================================================
// === LÓGICA DE CARRUSELES Y SLIDERS ===
// ====================================================================

// Hero Slider (Index)
const heroSlider = document.getElementById('heroSlider');
if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.slide');
    let hIdx = 0;
    setInterval(() => {
        slides[hIdx].classList.remove('active');
        hIdx = (hIdx + 1) % slides.length;
        slides[hIdx].classList.add('active');
    }, 5000);
}

// === LÓGICA DE CARRUSEL DE PRODUCTOS (Horizontal Scroll y AutoSlide) ==
// ====================================================================
document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    const track = wrapper.querySelector('.carousel-track');
    const prevBtn = wrapper.querySelector('.carousel-btn.prev');
    const nextBtn = wrapper.querySelector('.carousel-btn.next');

    let currentIndex = 0;
    let autoProductSlideInterval;

    function getProductWidth() {
        // Obtenemos el ancho de la primera tarjeta de producto más el espacio entre ellas
        const producto = track.querySelector('.producto:not(.hidden)');
        if (!producto) return 0;
        
        const gapValue = getComputedStyle(track).getPropertyValue('gap');
        const gap = parseInt(gapValue) || 20; 
        
        return producto.offsetWidth + gap;
    }

    function updateCarousel() {
        const productWidth = getProductWidth();
        if (productWidth === 0) return;

        const visibleProducts = Array.from(track.children).filter(p => !p.classList.contains('hidden'));
        const totalProducts = visibleProducts.length;
        const wrapperWidth = wrapper.getBoundingClientRect().width;
        // Calcula cuántos productos caben en el contenedor
        const productCountInView = Math.floor(wrapperWidth / productWidth); 
        
        // El máximo índice al que podemos llegar (número de "slides" disponibles)
        const maxIndex = Math.max(0, totalProducts - productCountInView);
        const loopLength = maxIndex + 1; // Longitud del loop (incluyendo el índice 0)

        // **ADAPTACIÓN DE LÓGICA DE LOOP:** Usa el módulo en base a la longitud del loop
        if (totalProducts > 0 && maxIndex > 0) {
            // Esta línea simplificada maneja el loop tanto para index++ (next) como index-- (prev)
            currentIndex = (currentIndex % loopLength + loopLength) % loopLength;
        } else {
            currentIndex = 0;
        }


        // Calculamos el desplazamiento
        const offset = -currentIndex * productWidth;
        track.style.transform = `translateX(${offset}px)`;

        // Mostramos los botones solo si hay más productos de los que caben en la vista
        const showBtns = totalProducts > productCountInView;
        if (prevBtn) prevBtn.style.display = showBtns ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = showBtns ? 'flex' : 'none';
    }

    // Función para iniciar el deslizamiento automático
    function startProductAutoSlide() {
        if (autoProductSlideInterval) clearInterval(autoProductSlideInterval);

        autoProductSlideInterval = setInterval(() => {
            // Simplemente incrementa el índice
            currentIndex++; 
            // updateCarousel se encarga del loop con el operador módulo
            updateCarousel();
        }, 4000); // Desliza cada 4 segundos
    }

    // Event Listeners de navegación manual: SÓLO incrementan/decrementan el índice
    prevBtn?.addEventListener('click', () => {
        currentIndex--;
        updateCarousel();
        startProductAutoSlide(); // Reinicia el timer
    });

    nextBtn?.addEventListener('click', () => {
        currentIndex++;
        updateCarousel();
        startProductAutoSlide(); // Reinicia el timer
    });

    // Re-calcula la posición y reinicia el timer al cambiar el tamaño de la ventana
    window.addEventListener('resize', () => {
        currentIndex = 0; // Reinicia la posición
        updateCarousel();
        startProductAutoSlide();
    });
    
    // Observa cambios en las tarjetas (ej: por la función de búsqueda/filtro)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' || mutation.type === 'childList') {
                currentIndex = 0; // Resetear el carrusel al cambiar la visibilidad/contenido
                updateCarousel();
            }
        });
    });

    observer.observe(track, { attributes: true, childList: true, subtree: true, attributeFilter: ['class'] });

    // Inicialización
    document.addEventListener('DOMContentLoaded', () => {
        updateCarousel();
        startProductAutoSlide();
    });
});
// WhatsApp Flotante
const waBtn = document.getElementById('whatsapp-btn');
const waPopup = document.getElementById('whatsapp-popup');
waBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    waPopup?.classList.toggle('active');
});
document.addEventListener('click', () => waPopup?.classList.remove('active'));

function mostrarGrupo(num) {
    // Ocultar todos los grupos del 1 al 8
    for (let i = 1; i <= 8; i++) {
        const el = document.getElementById('grupo' + i);
        const btn = document.getElementById('btn' + i);
        
        if (el) {
            if (i === num) {
                // Mostrar el grupo seleccionado y activar el botón
                el.classList.remove('hidden');
                btn.classList.add('active');
            } else {
                // Ocultar los demás y desactivar botones
                el.classList.add('hidden');
                btn.classList.remove('active');
            }
        }
    }
}
// === VISOR INTERACTIVO DE BOMBAS ===

// 1. Base de datos de las bombas (Información)
const datosBombas = [
    {
        id: 0,
        titulo: "Bomba Eléctrica DSY-60",
        desc: "La bomba de pruebas hidrostáticas DSY 60 se utiliza para comprobar la resistencia y estanqueidad de sistemas hidráulicos y tuberías, principalmente en los sectores de construcción e industria. Está diseñada para trabajar en condiciones de alta presión.",
        img: "imagenes/actualizado/bomba_dsy_60.jpeg", // Asegúrate que esta ruta sea correcta
        specs: [
            "Presión Máxima: 0-860 PSI",
            "Accionamiento: 250W ",
            "Uso: Industrial / Pesado",
            "Peso: 12 Kg"
        ]
    },
    {
        id: 1,
        titulo: "Bomba Eléctrica DSY-25",
        desc: "Electrobomba de prueba de presión con salida estable y bajo consumo, fácil de transportar y mantener. Es un equipo confiable para pruebas de fabricación en recipientes a presión y para la verificación de presión en tuberías.",
        img: "imagenes/actualizado/bomba_dsy_25.jpeg",
        specs: [
            "Presión Máx: 0-25 Bar",
            "Tanque: Acero Reforzado",
            "Voltaje: 220v",
            "Potencia: 180w",
            "Uso: Gasfitería y Riego"
        ]
    },
    {
        id: 2,
        titulo: "Bomba de Prueba Manual",
        desc: "Prueba de presión con agua o aceite, adecuada para tuberías en construcciones residenciales e industriales. Es posible ampliar su capacidad con un manómetro de escala fina (0.1 bar) para pruebas de hasta 16 bar.",
        img: "imagenes/actualizado/bomba_manual.jpeg",
        specs: [
            "Presión Máx: 0-700 PSI",
            "Capacidad del tanque: 5 L",
            "Material del tanque: Acero",
            "Material de las valvulas: Aluminio",
            "Accesorios incluidos: Manguera de presion, manometro, juego de sellos"
        ]
    },
      {
        id: 3,
        titulo: "Balde de Prueba Hidraulica",
        desc: "La bomba de prueba hidrostática está diseñada para probar sistemas de agua, como medidores de agua, líneas de plomería, recipientes a presión y sistemas de aspersores. Su uso es aplicable tanto en edificios residenciales como en instalaciones comerciales.",
        img: "imagenes/image_0dab7e.png",
        specs: [
            "Presión Máx: 0-300 PSI",
            "Capacidad del tanque: 20 L",
            "Material del tanque: Hierro fundido",
            "Accesorios incluidos: Manometro",
        ]
    },
];

// 2. Función para cambiar la bomba mostrada
function cambiarBomba(index) {
    const data = datosBombas[index];
    
    // Referencias a los elementos del HTML
    const imgElement = document.getElementById('bomba-img-grande');
    const tituloElement = document.getElementById('bomba-titulo');
    const descElement = document.getElementById('bomba-desc');
    const specsContainer = document.getElementById('bomba-specs');
    const botones = document.querySelectorAll('.visor-btn');

    // 1. Efecto de desvanecimiento (resetear animación)
    imgElement.classList.remove('fade-in');
    void imgElement.offsetWidth; // Forzar reflow (truco para reiniciar CSS animation)
    imgElement.classList.add('fade-in');

    // 2. Actualizar contenido
    imgElement.src = corregirRutaImagen(data.img); // Usamos tu función corregirRutaImagen
    tituloElement.textContent = data.titulo;
    descElement.textContent = data.desc;

    // 3. Generar la lista de características
    let htmlSpecs = '';
    data.specs.forEach(spec => {
        htmlSpecs += `<li><i class="fas fa-check"></i> ${spec}</li>`;
    });
    specsContainer.innerHTML = htmlSpecs;

    // 4. Actualizar botones (clase active)
    botones.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 3. Función para el botón "Cotizar Ahora" del visor
function cotizarProductoActual() {
    const titulo = document.getElementById('bomba-titulo').textContent;
    agregarAlCarrito(titulo); // Usa tu función existente
}      
/* =============================================================
   NUEVA FUNCIÓN: CONECTAR EL VISOR CON EL CARRITO
   Pega esto al final de tu archivo script.js
   ============================================================= */

function cotizarProductoActual() {
    // 1. OBTENER DATOS DEL VISOR
    // Buscamos el título y la imagen que se está mostrando actualmente
    var tituloEl = document.getElementById('bomba-titulo');
    var imgEl = document.getElementById('bomba-img-grande');

    if (!tituloEl || !imgEl) {
        alert("Error: No se encuentra la información del producto.");
        return;
    }

    var nombre = tituloEl.innerText || tituloEl.textContent; // Texto del h3
    var rutaImagen = imgEl.getAttribute('src'); // Ruta de la imagen
    
    // Generamos un ID único para este producto del visor
    var idProducto = 'visor-' + nombre.replace(/\s+/g, '-').toLowerCase();

    // 2. AGREGAR AL CARRITO (Usando la variable 'carrito' global de tu script)
    // Primero limpiamos la ruta de la imagen por si tiene "../"
    var imgLimpia = rutaImagen.replace(/\.\.\//g, "");

    // Verificamos si ya existe en el carrito
    var existente = carrito.find(function(p) { return p.nombre === nombre; });

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: idProducto,
            nombre: nombre,
            imagen: imgLimpia,
            cantidad: 1
        });
    }

    // 3. ACTUALIZAR Y ABRIR EL CARRITO
    // Llamamos a las funciones que YA existen en tu script.js original
    if (typeof renderCarrito === "function") renderCarrito();
    if (typeof guardarCarrito === "function") guardarCarrito();
    if (typeof abrirCerrarCarrito === "function") {
        abrirCerrarCarrito(true); // Esto abre el panel lateral
    } else {
        // Respaldo por si la función abrirCerrarCarrito no se encuentra
        var panel = document.getElementById('carritoPanel');
        var overlay = document.getElementById('carritoOverlay');
        if (panel) panel.classList.add('abierto'); 
        if (overlay) overlay.classList.add('visible');
    }
}
/* =======================================================
   LÓGICA PARA LA PÁGINA "NOSOTROS" (TABS INTERACTIVOS)
   ======================================================= */

function cambiarPestana(evt, tabId) {
    // 1. Ocultar todos los contenidos
    var contenidos = document.querySelectorAll('.tab-content');
    contenidos.forEach(function(contenido) {
        contenido.classList.remove('active');
        // Pequeño truco para reiniciar la animación CSS
        contenido.style.display = 'none'; 
    });

    // 2. Desactivar todos los botones (quitar color naranja)
    var botones = document.querySelectorAll('.tab-btn');
    botones.forEach(function(boton) {
        boton.classList.remove('active');
    });

    // 3. Mostrar el contenido seleccionado con un pequeño delay para la animación
    var seleccion = document.getElementById(tabId);
    if (seleccion) {
        seleccion.style.display = 'grid'; // Restaurar display
        // Usamos un timeout minúsculo para permitir que el navegador procese el display:grid antes de añadir la clase active (opacity)
        setTimeout(function() {
            seleccion.classList.add('active');
        }, 10);
    }

    // 4. Activar el botón que fue clickeado
    evt.currentTarget.classList.add('active');
}
