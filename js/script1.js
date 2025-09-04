// Configuración
const SHEET_ID = "18SBf_CjjlFCS7nSkh7do2yExTrTvTqs8Bq-msu-sR5M";
const SHEET_NAME = "Products";
const WHATSAPP_NUMBER = "5217229087294";
let allProducts = [];

// URLs alternativas para probar
const SHEET_URLS = [
    `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`,
    `https://api.allorigins.win/raw?url=https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`
];

// FUNCIÓN OPTIMIZADA: Convertir enlaces con tamaños específicos
function convertGoogleDriveLink(url, size = 'thumbnail') {
    if (!url || typeof url !== "string") {
        console.log("URL vacía o inválida:", url);
        return "img/placeholder.jpg";
    }

    console.log("URL original desde Sheets:", url);
    url = url.trim();

    // Si ya es una URL directa a una imagen
    if (url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
        console.log("URL ya es directa:", url);
        return url;
    }

    // Extraer ID de Google Drive
    let driveId = null;

    // Patrón 1: /file/d/ID/
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
        driveId = fileMatch[1];
    }

    // Patrón 2: /d/ID/
    if (!driveId) {
        const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (dMatch && dMatch[1]) {
            driveId = dMatch[1];
        }
    }

    // Patrón 3: id=ID
    if (!driveId) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            driveId = idMatch[1];
        }
    }

    // Patrón 4: Solo el ID
    if (!driveId && /^[a-zA-Z0-9_-]{20,}$/.test(url)) {
        driveId = url;
    }

    if (driveId) {
        // DIFERENTES TAMAÑOS OPTIMIZADOS
        const sizes = {
            thumbnail: `https://lh3.googleusercontent.com/d/${driveId}=w300-h300`,
            medium: `https://lh3.googleusercontent.com/d/${driveId}=w600-h600`,
            large: `https://lh3.googleusercontent.com/d/${driveId}=w800-h800`,
            original: `https://lh3.googleusercontent.com/d/${driveId}=w1000`
        };
        
        const directUrl = sizes[size] || sizes.thumbnail;
        console.log(`Convertido a GoogleUserContent (${size}):`, directUrl);
        return directUrl;
    }

    console.log("No se pudo extraer ID de:", url);
    return "img/placeholder.jpg";
}

// FUNCIÓN CORREGIDA: Sanitizar datos para JSON
function sanitizeProductData(product) {
    const sanitized = {
        id: String(product.id || '').replace(/[\n\r\t]/g, ' ').trim(),
        nombre: String(product.nombre || '').replace(/[\n\r\t]/g, ' ').trim(),
        precio: String(product.precio || '0').replace(/[\n\r\t]/g, '').trim(),
        precioOriginal: String(product.precioOriginal || '').replace(/[\n\r\t]/g, '').trim(),
        talla: String(product.talla || '').replace(/[\n\r\t]/g, ' ').trim(),
        imagen: String(product.imagen || '').replace(/[\n\r\t]/g, '').trim(),
        imagenOriginal: String(product.imagenOriginal || '').replace(/[\n\r\t]/g, '').trim(),
        oferta: Boolean(product.oferta)
    };
    
    // Escapar caracteres problemáticos
    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = sanitized[key]
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/\\/g, '\\\\')
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/[\u0000-\u001F\u007F]/g, '');
        }
    });
    
    return sanitized;
}

// FUNCIÓN CORREGIDA: Crear JSON seguro para data attributes
function createSafeDataAttribute(product) {
    try {
        const sanitizedProduct = sanitizeProductData(product);
        const jsonString = JSON.stringify(sanitizedProduct);
        
        // Verificar que el JSON es válido
        JSON.parse(jsonString);
        
        return jsonString;
    } catch (error) {
        console.warn('Error creando JSON para producto:', product.nombre, error);
        
        // Fallback con datos básicos
        const fallback = {
            id: product.id || 'unknown',
            nombre: 'Producto sin nombre',
            precio: product.precio || '0',
            talla: product.talla || '',
            imagen: product.imagen || 'img/placeholder.jpg',
            imagenOriginal: product.imagenOriginal || product.imagen || 'img/placeholder.jpg',
            oferta: false
        };
        
        return JSON.stringify(fallback);
    }
}

// FUNCIÓN CORREGIDA: Parsear JSON de forma segura
function parseSafeProductData(jsonString) {
    try {
        const product = JSON.parse(jsonString);
        
        // Des-escapar caracteres
        Object.keys(product).forEach(key => {
            if (typeof product[key] === 'string') {
                product[key] = product[key]
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\\\\/g, '\\');
            }
        });
        
        return product;
    } catch (error) {
        console.error('Error parseando JSON de producto:', error);
        console.error('JSON problemático:', jsonString);
        
        return {
            id: 'error',
            nombre: 'Error cargando producto',
            precio: '0',
            talla: '',
            imagen: 'img/placeholder.jpg',
            imagenOriginal: 'img/placeholder.jpg',
            oferta: false
        };
    }
}

// FUNCIÓN MEJORADA: Crear imagen con fallback progresivo
function createImageWithFallback(src, alt, className = '', isModal = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.className = className;
        img.alt = alt;
        
        const driveId = src.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const alternativeUrls = driveId ? [
            src,
            `https://drive.google.com/uc?export=view&id=${driveId[1]}`,
            `https://drive.google.com/thumbnail?id=${driveId[1]}&sz=w300-h300`,
            `https://lh3.googleusercontent.com/d/${driveId[1]}=w400`,
            "img/placeholder.jpg"
        ] : [src, "img/placeholder.jpg"];

        let currentIndex = 0;

        function tryNextUrl() {
            if (currentIndex >= alternativeUrls.length) {
                console.log("Todas las URLs alternativas fallaron para:", alt);
                reject(new Error("No se pudo cargar ninguna URL"));
                return;
            }

            const currentUrl = alternativeUrls[currentIndex];
            console.log(`Probando URL ${currentIndex + 1}/${alternativeUrls.length} para "${alt}":`, currentUrl);
            
            img.onload = function() {
                console.log(`Imagen "${alt}" cargada con URL ${currentIndex + 1}:`, currentUrl);
                resolve(img);
            };
            
            img.onerror = function() {
                console.log(`URL ${currentIndex + 1} falló para "${alt}":`, currentUrl);
                currentIndex++;
                setTimeout(tryNextUrl, 200);
            };
            
            img.src = currentUrl;
        }

        tryNextUrl();
    });
}

// INTERSECTION OBSERVER CORREGIDO
function createLazyLoader() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;
                const productId = container.dataset.productId;
                const productDataString = container.dataset.productData;
                
                observer.unobserve(container);
                
                if (productDataString) {
                    const productData = parseSafeProductData(productDataString);
                    loadProductImage(container, productData);
                } else {
                    console.warn('No hay datos de producto para:', productId);
                    container.innerHTML = `
                        <div class="error-image">
                            <div class="error-icon">⚠️</div>
                            <div class="error-text">Datos no disponibles</div>
                        </div>
                    `;
                }
            }
        });
    }, {
        rootMargin: '100px'
    });
    
    return observer;
}

// CARGAR IMAGEN INDIVIDUAL
async function loadProductImage(container, product) {
    try {
        const img = await createImageWithFallback(
            product.imagen, 
            product.nombre, 
            'product-image clickable-image'
        );
        
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const modalSrc = convertGoogleDriveLink(product.imagenOriginal || product.imagen, 'large');
            openImageModal(modalSrc, product);
        });
        
        container.innerHTML = '';
        container.appendChild(img);
        
    } catch (error) {
        console.log(`No se pudo cargar imagen para ${product.nombre}`);
        container.innerHTML = `
            <div class="error-image">
                <div class="error-icon">📷</div>
                <div class="error-text">Imagen no disponible</div>
            </div>
        `;
    }
}

// SISTEMA DE MODAL PARA IMÁGENES
function createImageModal() {
    if (document.getElementById('imageModal')) {
        return;
    }

    const modalHTML = `
        <div id="imageModal" class="image-modal hidden">
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                <button class="modal-close" aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="modal-content">
                    <div class="modal-image-container">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <div>Cargando imagen en alta resolución...</div>
                        </div>
                    </div>
                    <div class="modal-info">
                        <h3 id="modalTitle">Nombre del producto</h3>
                        <p id="modalDetails">Detalles del producto</p>
                        <div class="modal-actions">
                            <a id="modalWhatsApp" href="#" class="whatsapp-btn" target="_blank">
                                💬 Comprar este producto
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('imageModal');
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    console.log('Modal de imágenes creado');
}


// FUNCIÓN OPTIMIZADA: Abrir modal con carga progresiva
async function openImageModal(imageSrc, productData) {
    const modal = document.getElementById('imageModal');
    const imageContainer = modal.querySelector('.modal-image-container');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');
    const modalWhatsApp = document.getElementById('modalWhatsApp');

    if (!modal) {
        console.error('Modal no encontrado');
        return;
    }

    modalTitle.textContent = productData.nombre;
    
    const details = [];
    if (productData.talla) details.push(`Talla: ${productData.talla}`);
    if (productData.precioOriginal) details.push(`Precio original: $${productData.precioOriginal}`);
    if (productData.oferta) details.push('En oferta');
    
    modalDetails.innerHTML = `
        <div class="modal-price">$${productData.precio}</div>
        <div class="modal-meta">${details.join(' • ')}</div>
    `;

    const whatsappText = encodeURIComponent(
        `Hola, me interesa el siguiente producto:\n\n` +
        `Modelo: ${productData.id}\n` +
        `Producto: ${productData.nombre}\n` +
        `Talla: ${productData.talla}\n` +
        `Precio: $${productData.precio}\n` +
        `Foto: ${productData.imagenOriginal || productData.imagen}`
    );
    modalWhatsApp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

    imageContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div>Cargando imagen en alta resolución...</div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    try {
        const img = await createImageWithFallback(imageSrc, productData.nombre, '', true);
        img.id = 'modalImage';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
        
    } catch (error) {
        imageContainer.innerHTML = `
            <div class="error-image">
                <div class="error-icon">📷</div>
                <div class="error-text">No se pudo cargar la imagen</div>
            </div>
        `;
    }

    console.log('Modal abierto para:', productData.nombre);
}

// Convertir CSV a JSON
function csvToJson(csv) {
    try {
        console.log('CSV original:', csv.substring(0, 200));
        
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            console.log('CSV tiene muy pocas líneas');
            return [];
        }
        
        const headers = lines[0].split(',').map(h => {
            let header = h.trim().replace(/"/g, '');
            if (header === 'Nombre del Producto') return 'Nombre';
            if (header === 'Oferta (Si/No)') return 'Oferta';
            return header;
        });
        
        console.log('Encabezados normalizados:', headers);
        
        const products = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim().replace(/"/g, ''));
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim().replace(/"/g, ''));
            
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] || '';
            });
            
            if (product.ID && product.Nombre) {
                products.push(product);
            }
        }
        
        console.log('Productos parseados correctamente:', products);
        return products;
        
    } catch (error) {
        console.error('Error parsing CSV:', error);
        return [];
    }
}

// Intentar cargar con diferentes proxies
async function tryLoadFromSheets() {
    for (const url of SHEET_URLS) {
        try {
            console.log('Probando URL:', url);
            const response = await fetch(url, {
                headers: {
                    'Accept': 'text/csv'
                }
            });
            
            if (!response.ok) {
                console.log(`HTTP error: ${response.status}`);
                continue;
            }
            
            const csvData = await response.text();
            console.log('CSV recibido:', csvData.substring(0, 100) + '...');
            
            if (!csvData || csvData.trim().length < 10) {
                console.log('CSV vacío o muy corto');
                continue;
            }
            
            const products = csvToJson(csvData);
            console.log('Productos parseados:', products.length);
            
            if (products.length > 0) {
                return products;
            }
            
        } catch (error) {
            console.log(`Error con URL ${url}:`, error.message);
        }
    }
    return null;
}

// FUNCIÓN RENDERIZAR PRODUCTOS CORREGIDA
async function renderProductsWithFallback(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log(`Contenedor #${containerId} no encontrado`);
        return;
    }
    
    if (products.length === 0) {
        const isOfertasPage = containerId === 'ofertas';
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--muted);">${isOfertasPage ? 'No hay ofertas disponibles.' : 'No hay productos disponibles.'}</p>
                <button onclick="location.reload()" class="btn" style="margin-top: 15px;">
                    Recargar
                </button>
            </div>
        `;
        return;
    }

    const lazyLoader = createLazyLoader();

    container.innerHTML = products.map(product => {
        const sanitizedProduct = sanitizeProductData(product);
        const safeDataAttribute = createSafeDataAttribute(sanitizedProduct);
        
        const whatsappMessage = encodeURIComponent(
            `Hola, me interesa el siguiente producto:\n\n` +
            `Modelo: ${sanitizedProduct.id}\n` +
            `Producto: ${sanitizedProduct.nombre}\n` +
            `Talla: ${sanitizedProduct.talla}\n` +
            `Precio: $${sanitizedProduct.precio}\n` +
            `Foto: ${sanitizedProduct.imagenOriginal || sanitizedProduct.imagen}`
        );

        return `
            <div class="product-card ${sanitizedProduct.oferta ? 'offer' : ''}">
                ${sanitizedProduct.oferta ? '<span class="badge badge--danger">Oferta</span>' : ''}
                <div class="product-media">
                    <div class="image-loader lazy-load" 
                         data-product-id="${sanitizedProduct.id}"
                         data-product-data='${safeDataAttribute}'>
                        <div class="skeleton-loader">
                            <div class="skeleton-image"></div>
                        </div>
                    </div>
                </div>
                <div class="product-body">
                    <h3 class="product-title">${sanitizedProduct.nombre}</h3>
                    <div class="product-meta">
                        <span>Modelo: ${sanitizedProduct.id}</span>
                        <span>Talla: ${sanitizedProduct.talla}</span>
                    </div>
                    <div class="product-price">
                        ${sanitizedProduct.precioOriginal ? `<s>$${sanitizedProduct.precioOriginal}</s>` : ''}
                        $${sanitizedProduct.precio}
                    </div>
                    <div class="product-actions">
                        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}" 
                           class="whatsapp-btn" target="_blank">
                            Comprar
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.lazy-load').forEach(loader => {
        lazyLoader.observe(loader);
    });

    console.log(`Renderizado con lazy loading en #${containerId}: ${products.length} productos`);
}

// Funciones de compatibilidad
async function renderCatalogWithFallback(products) {
    await renderProductsWithFallback(products, 'catalogo');
}

async function renderOffersWithFallback(products) {
    console.log('Renderizando ofertas...');
    console.log('Total productos recibidos:', products.length);
    
    const offers = products.filter(product => {
        console.log(`Producto: ${product.nombre}, Oferta: "${product.oferta}", Tipo: ${typeof product.oferta}`);
        return product.oferta === true;
    });
    
    console.log('Ofertas encontradas:', offers.length);
    
    if (offers.length > 0) {
        console.log('Ofertas filtradas:', offers.map(o => ({ nombre: o.nombre, oferta: o.oferta })));
    }
    
    await renderProductsWithFallback(offers, 'ofertas');
}

// FUNCIÓN OPTIMIZADA: Cargar productos
async function loadProducts() {
    console.log('Cargando productos...');
    
    try {
        const sheetProducts = await tryLoadFromSheets();
        
        if (sheetProducts && sheetProducts.length > 0) {
            allProducts = sheetProducts.map(product => ({
                id: product.ID || '',
                nombre: product.Nombre || product['Nombre del Producto'] || 'Sin nombre',
                precio: product.Precio || '0',
                precioOriginal: product['Precio original'] || '',
                talla: product.Talla || '',
                imagen: convertGoogleDriveLink(product.Imagen, 'thumbnail'),
                imagenOriginal: product.Imagen,
                oferta: product.Oferta === 'Sí' || 
                        product.Oferta === 'si' || 
                        product.Oferta === 'Si' ||
                        product.Oferta === 'S' ||
                        product.Oferta === 'SI' ||
                        product.Oferta === 'TRUE' ||
                        product.Oferta === 'True' ||
                        product.Oferta === 'true'
            }));
            
            console.log(`${allProducts.length} productos mapeados con imágenes optimizadas`);
        } else {
            console.log('Usando datos de ejemplo (Sheets no disponible)');
            useSampleData();
        }

        await renderContent();
        
    } catch (error) {
        console.error('Error general:', error);
        useSampleData();
    }
}

// Función para renderizar contenido
async function renderContent() {
    console.log('Renderizando contenido...');
    
    if (document.getElementById('catalogo')) {
        console.log('Detectado contenedor de catálogo, renderizando...');
        await renderCatalogWithFallback(allProducts);
        if (allProducts.length > 0) {
            setupSizeFilters(allProducts);
        }
    }
    
    if (document.getElementById('ofertas')) {
        console.log('Detectado contenedor de ofertas, renderizando...');
        await renderOffersWithFallback(allProducts);
    }
}

// Configurar filtros
function setupSizeFilters(products) {
    const filterContainer = document.getElementById('filtros-tallas');
    if (!filterContainer) return;
    
    const sizes = [...new Set(products.map(p => p.talla))].filter(Boolean).sort((a, b) => a - b);
    
    if (sizes.length === 0) {
        filterContainer.innerHTML = '<p style="color: var(--muted);">No hay tallas disponibles</p>';
        return;
    }
    
    filterContainer.innerHTML = `
        <button class="filter-pill is-active" data-size="all">
            Todas (${products.length})
        </button>
        ${sizes.map(size => `
            <button class="filter-pill" data-size="${size}">
                Talla ${size} (${products.filter(p => p.talla === size).length})
            </button>
        `).join('')}
    `;
    
    filterContainer.querySelectorAll('.filter-pill').forEach(button => {
        button.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
                btn.classList.remove('is-active');
            });
            button.classList.add('is-active');
            
            const size = button.dataset.size;
            if (size === 'all') {
                renderCatalogWithFallback(allProducts);
            } else {
                const filtered = allProducts.filter(product => product.talla === size);
                renderCatalogWithFallback(filtered);
            }
        });
    });
}

// CSS OPTIMIZADO con skeleton loaders
function injectAdditionalCSS() {
    const additionalCSS = `
        <style>
        @supports not (contain: layout) {
            .product-card {
                will-change: transform;
            }
            .grid {
                backface-visibility: hidden;
            }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .loading-products { animation: pulse 2s infinite; }
        .product-card.loading { pointer-events: none; opacity: 0.6; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        </style>
    `;
    
    if (document.head && !document.querySelector('#additional-css-injection')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'additional-css-injection';
        styleElement.innerHTML = additionalCSS.replace('<style>', '').replace('</style>', '');
        document.head.appendChild(styleElement);
        console.log('CSS adicional inyectado');
    }
}

// NAVEGACIÓN RESPONSIVE MEJORADA PARA MÓVIL
function initResponsiveNav() {
    const nav = document.querySelector('nav');
    if (!nav) {
        console.warn('No se encontró elemento <nav>');
        return;
    }

    let menuToggle = nav.querySelector('.menu-toggle');
    if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-label', 'Abrir menú');
        menuToggle.innerHTML = `<span></span><span></span><span></span>`;

        const navUl = nav.querySelector('ul');
        if (navUl) {
            navUl.classList.add('nav-menu');
        } else {
            console.warn('No se encontró lista <ul> en la navegación');
            return;
        }

        nav.appendChild(menuToggle);
    }

    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }

    const navMenu = nav.querySelector('.nav-menu');
    if (!navMenu) {
        console.warn('No se encontró .nav-menu');
        return;
    }

    function isMobileView() {
        return window.innerWidth <= 768 || window.getComputedStyle(menuToggle).display !== 'none';
    }

    function toggleMenu(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu() {
        console.log('Abriendo menú móvil...');
        
        menuToggle.classList.add('active');
        navMenu.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        menuToggle.setAttribute('aria-label', 'Cerrar menú');
        
        const menuItems = navMenu.querySelectorAll('li');
        menuItems.forEach((item, index) => {
            item.style.transitionDelay = `${(index + 1) * 0.1}s`;
        });

        console.log('Menú móvil abierto');
    }

    function closeMenu() {
        console.log('Cerrando menú móvil...');
        
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        menuToggle.setAttribute('aria-label', 'Abrir menú');
        
        const menuItems = navMenu.querySelectorAll('li');
        menuItems.forEach(item => {
            item.style.transitionDelay = '0s';
        });

        console.log('Menú móvil cerrado');
    }

    // EVENT LISTENERS MEJORADOS
    menuToggle.addEventListener('click', toggleMenu);
    menuToggle.addEventListener('touchstart', function(e) {
        e.preventDefault();
        toggleMenu();
    }, { passive: false });

    overlay.addEventListener('click', closeMenu);
    overlay.addEventListener('touchstart', closeMenu, { passive: true });

    // Cerrar menú al hacer clic en enlaces
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobileView()) {
                setTimeout(closeMenu, 100);
            }
        });
        
        link.addEventListener('touchstart', function() {
            if (isMobileView()) {
                setTimeout(closeMenu, 100);
            }
        }, { passive: true });
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Manejar cambio de orientación/tamaño
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isMobileView() && navMenu.classList.contains('active')) {
                closeMenu();
            }
        }, 250);
    });

    // Detectar cambio de orientación en móvil
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (navMenu.classList.contains('active')) {
                closeMenu();
            }
        }, 100);
    });

    console.log('Navegación responsive inicializada con mejoras móviles');
}

// EFECTOS HOVER ADICIONALES PARA EL LOGO
function initLogoEffects() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    logo.addEventListener('mouseenter', () => {
        logo.style.filter = `
            drop-shadow(0 0 20px rgba(0,229,255,.6)) 
            drop-shadow(0 0 8px rgba(255,122,24,.3))
            brightness(1.1)
        `;
    });

    logo.addEventListener('mouseleave', () => {
        logo.style.filter = `
            drop-shadow(0 0 15px rgba(0,229,255,.4)) 
            drop-shadow(0 0 5px rgba(255,122,24,.2))
            brightness(1)
        `;
    });

    console.log('Efectos del logo inicializados');
}

// SMOOTH SCROLL PARA NAVEGACIÓN
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href.startsWith('#') && href.length > 1) {
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    console.log('Scroll suave inicializado');
}

// HEADER SCROLL EFFECT MEJORADO
function initHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    let ticking = false;

    function updateHeader() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        ticking = false;
    }

    function requestUpdateHeader() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestUpdateHeader, { passive: true });

    console.log('Efecto de scroll del header fijo inicializado');
}

// SCROLL TO TOP BUTTON
function createScrollToTopButton() {
    if (document.getElementById('scrollToTop')) {
        return;
    }

    const scrollButton = document.createElement('button');
    scrollButton.id = 'scrollToTop';
    scrollButton.className = 'scroll-to-top';
    scrollButton.setAttribute('aria-label', 'Volver al inicio');
    scrollButton.title = 'Volver arriba';
    
    scrollButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 15l-6-6-6 6"/>
        </svg>
    `;
    scrollButton.classList.add('svg-icon');

    document.body.appendChild(scrollButton);

    let isVisible = false;
    let ticking = false;

    function toggleScrollButton() {
        const scrollY = window.scrollY;
        const shouldShow = scrollY > 300;

        if (shouldShow && !isVisible) {
            scrollButton.classList.add('visible');
            isVisible = true;
            
            setTimeout(() => {
                if (isVisible) {
                    scrollButton.classList.add('pulse');
                }
            }, 3000);
            
        } else if (!shouldShow && isVisible) {
            scrollButton.classList.remove('visible', 'pulse');
            isVisible = false;
        }
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                toggleScrollButton();
                ticking = false;
            });
            ticking = true;
        }
    }

    function scrollToTop() {
        scrollButton.classList.remove('pulse');
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    scrollButton.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', onScroll, { passive: true });

    toggleScrollButton();

    console.log('Botón scroll to top creado');
    return scrollButton;
}

function initScrollToTop() {
    createScrollToTopButton();
}

// Función principal de navegación
function initNavigation() {
    initResponsiveNav();
    initLogoEffects();
    initSmoothScroll();
    initHeaderScrollEffect();
}

// FUNCIONES DE DEBUG
function debugMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('.nav-overlay');
    
    console.log('Debug del menú móvil:');
    console.log('- Ancho de ventana:', window.innerWidth);
    console.log('- Nav menu encontrado:', !!navMenu);
    console.log('- Menu toggle encontrado:', !!menuToggle);
    console.log('- Overlay encontrado:', !!overlay);
    console.log('- Es vista móvil:', window.innerWidth <= 768);
    
    if (menuToggle) {
        const computed = window.getComputedStyle(menuToggle);
        console.log('- Menu toggle display:', computed.display);
        console.log('- Menu toggle visible:', computed.display !== 'none');
        console.log('- Menu toggle activo:', menuToggle.classList.contains('active'));
    }
    
    if (navMenu) {
        console.log('- Nav menu clases:', navMenu.className);
        console.log('- Nav menu activo:', navMenu.classList.contains('active'));
        console.log('- Enlaces encontrados:', navMenu.querySelectorAll('a').length);
    }
}

function debugImages() {
    console.log('Diagnóstico de imágenes iniciado...');
    
    const lazyImages = document.querySelectorAll('.lazy-load');
    console.log(`Elementos lazy-load encontrados: ${lazyImages.length}`);
    
    lazyImages.forEach((container, index) => {
        const productData = container.dataset.productData;
        if (productData) {
            try {
                const product = JSON.parse(productData);
                console.log(`Imagen ${index + 1}:`, {
                    nombre: product.nombre,
                    imagenOriginal: product.imagenOriginal,
                    imagenOptimizada: product.imagen,
                    container: container
                });
            } catch (error) {
                console.log(`Error parseando datos del producto ${index + 1}:`, error);
            }
        }
    });
    
    const loadedImages = document.querySelectorAll('.product-image');
    console.log(`Imágenes ya cargadas: ${loadedImages.length}`);
    
    const errorImages = document.querySelectorAll('.error-image');
    console.log(`Imágenes con error: ${errorImages.length}`);
}

// INICIALIZAR TODO cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    injectAdditionalCSS();
    createImageModal();
    initNavigation();
    initScrollToTop();
    loadProducts();
    
    setTimeout(() => {
        console.log('Funciones de debug disponibles: debugMobileMenu(), debugImages()');
    }, 1000);
});

// Función de datos de ejemplo
function useSampleData() {
    console.log('Usando datos de ejemplo...');
    allProducts = [
        {
            id: '1',
            nombre: 'Nike Air Max Ejemplo',
            precio: '1299',
            precioOriginal: '1599',
            talla: '8.5',
            imagen: convertGoogleDriveLink('img/placeholder.jpg', 'thumbnail'),
            imagenOriginal: 'img/placeholder.jpg',
            oferta: true
        },
        {
            id: '2',
            nombre: 'Adidas Ultraboost Ejemplo',
            precio: '1899',
            precioOriginal: '',
            talla: '9',
            imagen: convertGoogleDriveLink('img/placeholder.jpg', 'thumbnail'),
            imagenOriginal: 'img/placeholder.jpg',
            oferta: false
        }
    ];
}

function debugImageURL(url) {
    console.log("Debug de URL:", url);
    const converted = convertGoogleDriveLink(url, 'thumbnail');
    console.log("URL convertida:", converted);
    
    const testImg = document.createElement('img');
    testImg.style.maxWidth = '200px';
    testImg.style.border = '2px solid #ccc';
    testImg.style.margin = '10px';
    testImg.style.cursor = 'pointer';
    
    testImg.onload = () => {
        console.log("Imagen cargada OK");
        testImg.style.border = '2px solid green';
    };
    
    testImg.onerror = () => {
        console.log("Error cargando imagen");
        testImg.style.border = '2px solid red';
    };
    
    testImg.src = converted;
    document.body.appendChild(testImg);
}

function testImageLoading() {
    console.log('Iniciando test de carga de imágenes...');
    console.log('Total productos:', allProducts.length);
    
    if (allProducts.length > 0) {
        const firstProduct = allProducts[0];
        console.log('Probando primer producto:', firstProduct.nombre);
        debugImageURL(firstProduct.imagenOriginal || firstProduct.imagen);
    }
}

function forceReload() {
    console.log('Forzando recarga completa...');
    allProducts = [];
    
    const catalogo = document.getElementById('catalogo');
    const ofertas = document.getElementById('ofertas');
    
    if (catalogo) catalogo.innerHTML = '';
    if (ofertas) ofertas.innerHTML = '';
    
    loadProducts();
}

// Exponer funciones globales para debugging
window.debugImageURL = debugImageURL;
window.testImageLoading = testImageLoading;
window.forceReload = forceReload;
window.debugMobileMenu = debugMobileMenu;
window.debugImages = debugImages;
window.allProducts = allProducts;

console.log('Script optimizado cargado completamente');
console.log('Funciones de debug disponibles: debugImageURL(), testImageLoading(), forceReload(), debugMobileMenu(), debugImages()');